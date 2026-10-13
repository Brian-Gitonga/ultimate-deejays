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

async function presignR2(method: "GET" | "PUT", key: string, seconds: number, query: Record<string, string> = {}) {
  const store = r2();
  if (!store) throw new Error("Cloudflare R2 isn't set up: add the R2_ keys to .env.");
  const url = new URL(objectUrl(store.base, key));
  url.searchParams.set("X-Amz-Expires", String(seconds));
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
  const signed = await store.client.sign(new Request(url, { method }), { aws: { signQuery: true } });
  return signed.url;
}

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
