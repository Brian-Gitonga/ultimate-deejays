import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth";
import { attachReferral } from "@/lib/referrals.server";
import { createClient } from "@/lib/supabase/server";

/*
 * Where Supabase sends people back after Google sign-in, email confirmation
 * and password-reset links. Turns the link into a session cookie, then
 * continues to ?next= (a same-site path only, so it can't be an open redirect).
 *
 * Two link styles are handled:
 *   ?code=…              the default; works in the browser that started sign-up
 *   ?token_hash=…&type=… works on any device; needs the email template change
 *                        described in supabase/README.md
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const destination = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  // Signed in by the link: credit any affiliate referral, and keep suspended accounts out.
  const signedIn = async (userId: string) => {
    const { data: profile } = await supabase.from("profiles").select("status").eq("id", userId).maybeSingle();
    if (profile?.status === "suspended") {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=suspended", origin));
    }
    await attachReferral(supabase);
    return NextResponse.redirect(new URL(destination, origin));
  };

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) return signedIn(data.user.id);
    console.error("[auth/callback] verifyOtp failed:", error?.code, error?.message);
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) return signedIn(data.user.id);
    console.error("[auth/callback] exchangeCodeForSession failed:", error?.code, error?.message);
  } else if (searchParams.get("error")) {
    console.error("[auth/callback] provider error:", searchParams.get("error"), searchParams.get("error_description"));
  }

  // Expired or already-used link, or opened in a different browser. The login page explains.
  const login = new URL("/login", origin);
  login.searchParams.set("error", "link");
  if (destination !== "/account/profile") login.searchParams.set("next", destination);
  return NextResponse.redirect(login);
}
