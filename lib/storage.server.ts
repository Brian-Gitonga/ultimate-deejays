import "server-only";
import { AwsClient } from "aws4fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { objectKey, providerOf, type StorageProvider } from "@/lib/storage";

/*
 * Signed links and deletes for stored files, whichever storage holds them
 * (see lib/storage.ts). Cloudflare R2 speaks the S3 protocol: links are
 * presigned with the R2 API token from .env, so the bucket stays private and
 * files go straight between the browser and R2.
 */

function r2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null;
  return {
    client: new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" }),
    base: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${encodeURIComponent(R2_BUCKET)}`,
  };
}

/** The storages Studio can upload to right now: R2 once its keys are in .env, Supabase always. */
export const availableProviders = (): StorageProvider[] => (r2() ? ["r2", "supabase"] : ["supabase"]);

const objectUrl = (base: string, key: string) => `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;

/** `signedAt`: sign as of this moment instead of now (see signedPlaybackUrl). */
async function presignR2(method: "GET" | "PUT", key: string, seconds: number, query: Record<string, string> = {}, signedAt?: Date) {
  const store = r2();
  if (!store) throw new Error("Cloudflare R2 isn't set up: add the R2_ keys to .env.");
  const url = new URL(objectUrl(store.base, key));
  url.searchParams.set("X-Amz-Expires", String(seconds));
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
  const datetime = signedAt?.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const signed = await store.client.sign(new Request(url, { method }), { aws: { signQuery: true, ...(datetime ? { datetime } : {}) } });
  return signed.url;
}

/** The R2 address videos stream from, for <link rel="preconnect"> (null without R2). */
export const r2Origin = () => {
  const store = r2();
  return store ? new URL(store.base).origin : null;
};

/** Content-Disposition that saves a file as `name` (already safe: no slashes or control characters). */
export const attachmentHeader = (name: string) => `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'")}"; filename*=UTF-8''${encodeURIComponent(name)}`;

/**
 * A link that fetches a stored file for the next minute. With `downloadName`
 * the browser saves it under that name rather than opening it. null when the
 * file can't be signed.
 */
export async function signedDownloadUrl(path: string, downloadName?: string): Promise<string | null> {
  if (providerOf(path) === "r2") {
    try {
      return await presignR2("GET", objectKey(path), 60, downloadName ? { "response-content-disposition": attachmentHeader(downloadName) } : {});
    } catch (error) {
      console.error("[storage] signing an R2 download", path, error);
      return null;
    }
  }
  const { data, error } = await createAdminClient()
    .storage.from("store")
    .createSignedUrl(path, 60, downloadName ? { download: downloadName } : undefined);
  if (error) console.error("[storage] signing a Supabase download", path, error.message);
  return data?.signedUrl ?? null;
}

/** A link the browser uploads one R2 file to (PUT), for the next 30 minutes. */
export const signedUploadUrl = (path: string) => presignR2("PUT", objectKey(path), 30 * 60);

/** Deletes stored files from wherever each one is. Failures are logged, not thrown. */
export async function removeStored(paths: string[]) {
  const supabasePaths = paths.filter((p) => providerOf(p) === "supabase");
  const r2Paths = paths.filter((p) => providerOf(p) === "r2");
  if (supabasePaths.length) {
    const { error } = await createAdminClient().storage.from("store").remove(supabasePaths);
    if (error) console.error("[storage] removing from Supabase", error.message);
  }
  const store = r2();
  if (r2Paths.length && !store) console.error("[storage] can't remove R2 files: the R2_ keys aren't in .env", r2Paths);
  if (r2Paths.length && store) {
    await Promise.all(
      r2Paths.map(async (path) => {
        const res = await store.client.fetch(objectUrl(store.base, objectKey(path)), { method: "DELETE" }).catch((error) => ({ ok: false, status: String(error) }));
        if (!res.ok) console.error("[storage] removing from R2", path, res.status);
      }),
    );
  }
}

export type R2Object = { key: string; size: number };
export type R2Usage = { configured: false } | { configured: true; objects: R2Object[]; bytes: number; checkedAt: string; error?: string };

// Listing the bucket counts as an R2 operation, so the answer is kept for a few minutes.
const USAGE_TTL = 5 * 60_000;
let usageCache: { at: number; value: R2Usage } | null = null;

const xmlText = (value: string) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** Everything in the R2 bucket and its total size (S3 ListObjectsV2), for Studio's storage card. */
export async function getR2Usage(): Promise<R2Usage> {
  const store = r2();
  if (!store) return { configured: false };
  if (usageCache && Date.now() - usageCache.at < USAGE_TTL) return usageCache.value;

  const objects: R2Object[] = [];
  let token = "";
  try {
    // 1,000 objects a page; 50 pages is far more than the store will hold.
    for (let page = 0; page < 50; page++) {
      const url = new URL(store.base);
      url.searchParams.set("list-type", "2");
      url.searchParams.set("max-keys", "1000");
      if (token) url.searchParams.set("continuation-token", token);
      const res = await store.client.fetch(url.toString());
      const xml = await res.text();
      if (!res.ok) {
        const code = /<Code>([^<]*)<\/Code>/.exec(xml)?.[1];
        return { configured: true, objects: [], bytes: 0, checkedAt: new Date().toISOString(), error: `Cloudflare answered ${res.status}${code ? ` (${code})` : ""}. Check the R2_ keys in .env.` };
      }
      for (const [, body] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
        const key = /<Key>([\s\S]*?)<\/Key>/.exec(body)?.[1];
        if (key) objects.push({ key: xmlText(key), size: Number(/<Size>(\d+)<\/Size>/.exec(body)?.[1] ?? 0) });
      }
      token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xmlText(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1] ?? "") : "";
      if (!token) break;
    }
  } catch (error) {
    console.error("[storage] listing R2", error);
    return { configured: true, objects: [], bytes: 0, checkedAt: new Date().toISOString(), error: "Couldn't reach Cloudflare R2. Try again in a moment." };
  }
  const value: R2Usage = { configured: true, objects, bytes: objects.reduce((sum, o) => sum + o.size, 0), checkedAt: new Date().toISOString() };
  usageCache = { at: Date.now(), value };
  return value;
}

/** Cloudflare's page for the bucket, for a link from Studio. */
export const r2DashboardUrl = () => {
  const { R2_ACCOUNT_ID, R2_BUCKET } = process.env;
  return R2_ACCOUNT_ID && R2_BUCKET ? `https://dash.cloudflare.com/${R2_ACCOUNT_ID}/r2/default/buckets/${encodeURIComponent(R2_BUCKET)}` : null;
};

const HOUR = 60 * 60 * 1000;

/**
 * A link that plays a stored video in the page (not as a download), valid for
 * at least `seconds`. Range requests work, so the browser can stream and seek.
 *
 * R2 links are signed as of the start of the current hour (and last an hour
 * longer), so everyone gets the same link for that hour, and R2 tells the
 * browser to keep the video: hovering a card again plays it from the
 * browser's cache instead of downloading it again.
 */
export async function signedPlaybackUrl(path: string, seconds: number): Promise<string | null> {
  if (providerOf(path) === "r2") {
    try {
      const hourStart = new Date(Math.floor(Date.now() / HOUR) * HOUR);
      return await presignR2("GET", objectKey(path), seconds + HOUR / 1000, { "response-cache-control": `private, max-age=${seconds}` }, hourStart);
    } catch (error) {
      console.error("[storage] signing an R2 video", path, error);
      return null;
    }
  }
  const { data, error } = await createAdminClient().storage.from("store").createSignedUrl(path, seconds);
  if (error) console.error("[storage] signing a Supabase video", path, error.message);
  return data?.signedUrl ?? null;
}
