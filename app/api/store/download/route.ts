import { downloadZip } from "client-zip";
import { NextResponse, type NextRequest } from "next/server";
import { isUuid } from "@/lib/action-result";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/*
 * Store downloads. GET /api/store/download?r=<slug>[&r=<slug>…][&f=<file id>…]
 *
 * store_download() (migration 014) decides for each resource: signed in,
 * plan high enough, published. It records the download and returns where
 * the files live. Then:
 *   one file   → a 60-second signed link to the private store bucket (or the
 *                file itself / the external link)
 *   more       → one ZIP, streamed file by file (never held in memory);
 *                several resources get a folder each
 * Files hosted elsewhere (Google Drive, Dropbox…) go into a ZIP as shortcuts,
 * since their links open a web page rather than the file.
 */

type GrantedFile = { id: string; name: string; kind: "storage" | "link"; path: string; url: string; size: number; mime: string };
type Grant = { status: "ok"; slug: string; title: string; files: GrantedFile[] } | { status: "signin" } | { status: "upgrade"; plan: string } | { status: "not_found" };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isExternal = (url: string) => /^https?:\/\//i.test(url);
/** A file on this site ("/images/x.jpg"), never "//another-site". */
const sameSite = (url: string, origin: string) => (/^\/(?!\/)/.test(url) ? new URL(url, origin).toString() : null);

/** Safe in a ZIP and a Content-Disposition header: no folders, no control characters. */
const safeName = (name: string) =>
  name
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 180) || "file";

const attachment = (name: string) => `attachment; filename="${safeName(name).replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(safeName(name))}`;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slugs = [...new Set(params.getAll("r"))].filter((s) => SLUG.test(s)).slice(0, 50);
  const fileIds = [...new Set(params.getAll("f"))].filter(isUuid).slice(0, 200);
  const back = (path: string) => NextResponse.redirect(new URL(path, request.url));
  if (!slugs.length) return back("/store");

  const supabase = await createClient();
  const results = await Promise.all(
    slugs.map((slug) => supabase.rpc("store_download", { resource_slug: slug, file_ids: slugs.length === 1 && fileIds.length ? fileIds : undefined })),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[store download]", failed.error.message);
    // "Could not find the function public.store_download" = migration 014 hasn't been run.
    return new NextResponse("The store isn't available right now. Please try again later.", { status: 503 });
  }

  const grants = results.map((r) => r.data as Grant);
  const here = slugs.length === 1 ? `/store/${slugs[0]}` : "/store";
  if (grants.some((g) => g.status === "signin")) return back(`/login?next=${encodeURIComponent(here)}`);

  const allowed = grants.filter((g): g is Extract<Grant, { status: "ok" }> => g.status === "ok");
  if (!allowed.length) {
    const upgrade = grants.find((g): g is Extract<Grant, { status: "upgrade" }> => g.status === "upgrade");
    if (upgrade) return back(slugs.length === 1 ? `/store/${slugs[0]}` : `/checkout?plan=${upgrade.plan}`);
    return back("/store");
  }

  const admin = createAdminClient();
  const origin = request.nextUrl.origin;
  const signedUrl = async (file: GrantedFile, download?: string) => {
    const { data, error } = await admin.storage.from("store").createSignedUrl(file.path, 60, download ? { download } : undefined);
    if (error) console.error("[store download] sign", file.path, error.message);
    return data?.signedUrl ?? null;
  };

  const entries = allowed.flatMap((grant) => grant.files.map((file) => ({ grant, file })));

  // One file: hand it over directly.
  if (entries.length === 1) {
    const { file } = entries[0];
    if (file.kind === "storage") {
      const url = await signedUrl(file, safeName(file.name));
      return url ? NextResponse.redirect(url) : new NextResponse("That file is missing. Please let us know.", { status: 404 });
    }
    if (isExternal(file.url)) return NextResponse.redirect(file.url);
    // A file on this site: send it as a download rather than opening it in the tab.
    const local = sameSite(file.url, origin);
    const res = local ? await fetch(local).catch(() => null) : null;
    if (!res?.ok || !res.body) return new NextResponse("That file is missing. Please let us know.", { status: 404 });
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": attachment(file.name),
        ...(res.headers.get("content-length") ? { "Content-Length": res.headers.get("content-length")! } : {}),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Several files: one ZIP. A folder per resource when there's more than one.
  const folders = allowed.length > 1;
  const used = new Set<string>();
  const unique = (name: string) => {
    let candidate = name;
    for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = name.replace(/(\.[^./]+)?$/, ` (${n})$1`);
    used.add(candidate.toLowerCase());
    return candidate;
  };

  async function* files() {
    for (const { grant, file } of entries) {
      const name = unique(`${folders ? `${safeName(grant.title)}/` : ""}${safeName(file.name)}`);
      if (file.kind === "link" && isExternal(file.url)) {
        yield { name: `${name}.url`, input: `[InternetShortcut]\r\nURL=${file.url}\r\n`, lastModified: new Date() };
        continue;
      }
      const url = file.kind === "storage" ? await signedUrl(file) : sameSite(file.url, origin);
      const res = url ? await fetch(url).catch(() => null) : null;
      if (!res?.ok || !res.body) {
        yield { name: `${name} (missing).txt`, input: `"${file.name}" couldn't be downloaded. Please let us know so we can fix it.\r\n`, lastModified: new Date() };
        continue;
      }
      yield { name, input: res, lastModified: new Date() };
    }
  }

  const zipName = folders ? "ultimate-deejays-downloads.zip" : `${allowed[0].slug}.zip`;
  return new NextResponse(downloadZip(files()).body, {
    headers: { "Content-Type": "application/zip", "Content-Disposition": attachment(zipName), "Cache-Control": "private, no-store" },
  });
}
