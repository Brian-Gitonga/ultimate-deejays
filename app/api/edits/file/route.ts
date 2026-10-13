import { NextResponse, type NextRequest } from "next/server";
import { isUuid } from "@/lib/action-result";
import { getViewer } from "@/lib/dal";
import { parseAnswers, parseFiles } from "@/lib/edits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/*
 * Files of an edit request. GET /api/edits/file?request=<id>&path=<path>
 *
 * The edits bucket is private. This checks who's asking, then hands over a
 * 60-second signed link:
 *   the member  their own uploads, and the delivered files once it's delivered
 *   admins      any file on any request
 * Reading the request with the visitor's session means RLS has already
 * decided whose it is.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("request") ?? "";
  const path = params.get("path") ?? "";
  const missing = () => new NextResponse("That file isn't available.", { status: 404 });
  if (!isUuid(id) || !path || path.includes("..")) return missing();

  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/account/edits/${id}`)}`, request.url));

  const supabase = await createClient();
  const { data: row } = await supabase.from("edit_requests").select("id, status, answers, files").eq("id", id).maybeSingle();
  if (!row) return missing();

  const delivered = parseFiles(row.files).find((f) => f.kind === "storage" && f.path === path);
  const upload = parseAnswers(row.answers).find((a) => a.type === "file" && a.value === path);
  const isAdmin = viewer.role === "admin";
  const allowed = isAdmin ? delivered || upload : (delivered && row.status === "delivered") || upload;
  if (!allowed) return missing();

  const name = delivered?.name ?? upload?.name ?? path.split("/").pop() ?? "file";
  const { data, error } = await createAdminClient().storage.from("edits").createSignedUrl(path, 60, { download: name });
  if (error || !data) {
    console.error("[edits file]", path, error?.message);
    return missing();
  }
  return NextResponse.redirect(data.signedUrl);
}
