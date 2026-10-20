import { NextResponse, type NextRequest } from "next/server";
import { getPreviewVideoPath } from "@/lib/db/store";
import { signedPlaybackUrl } from "@/lib/storage.server";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** The signed link lasts an hour; browsers and the CDN keep the redirect for half that, so a cached one is always still valid. */
const SIGNED_FOR = 60 * 60;
const CACHE_FOR = 30 * 60;

/*
 * /api/store/preview/<slug>: a resource's preview clip, for <video src>. The
 * clip is in private storage (Cloudflare R2 or Supabase), so this sends the
 * browser to a signed link. Previews are public, like thumbnails: no sign-in.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/store/preview/[slug]">) {
  const { slug } = await ctx.params;
  const path = SLUG.test(slug) ? await getPreviewVideoPath(slug) : "";
  if (!path) return new NextResponse("No preview video.", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });

  const url = await signedPlaybackUrl(path, SIGNED_FOR);
  if (!url) return new NextResponse("The preview video isn't available right now.", { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": `public, max-age=${CACHE_FOR}, s-maxage=${CACHE_FOR}` } });
}
