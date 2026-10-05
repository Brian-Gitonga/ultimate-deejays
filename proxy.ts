import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { HOME_AFTER_AUTH, safeNextPath } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { isPaidPlan } from "@/lib/checkout";
import { isReferralCode, parseReferralCookie, REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_DAYS, serializeReferralCookie, toSubId } from "@/lib/referrals";
import { updateSession } from "@/lib/supabase/proxy";

/*
 * Runs before every page request: keeps the Supabase session fresh, sends
 * signed-out visitors from private areas to /login (and checkout to /sign-up,
 * since most buyers are new), and back afterwards; skips the auth pages for
 * people already signed in, and records affiliate referral links (?ref=CODE).
 *
 * This is the optimistic, signed-in-or-not check only. Roles (admin, approved
 * affiliate) are checked by the layouts via lib/dal.ts, and again by RLS.
 */

const PRIVATE_AREAS = ["/account", "/studio", "/affiliate", "/checkout"];
const AUTH_PAGES = ["/login", "/sign-up"];

const inArea = (path: string, area: string) => path === area || path.startsWith(`${area}/`);

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  const { response, claims } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!claims && PRIVATE_AREAS.some((area) => inArea(pathname, area))) {
    const login = new URL(inArea(pathname, "/checkout") ? "/sign-up" : "/login", request.url);
    login.searchParams.set("next", pathname + search);
    const withRef = redirectKeepingCookies(login, response);
    trackReferral(request, withRef, event);
    return withRef;
  }

  if (claims && AUTH_PAGES.includes(pathname)) {
    // Signed-in people who click "Become a Resident" (/sign-up?plan=resident) go straight to checkout.
    const plan = request.nextUrl.searchParams.get("plan");
    const fallback = isPaidPlan(plan) ? `/checkout?plan=${plan}` : HOME_AFTER_AUTH;
    const next = safeNextPath(request.nextUrl.searchParams.get("next"), fallback);
    return redirectKeepingCookies(new URL(next, request.url), response);
  }

  trackReferral(request, response, event);
  return response;
}

/**
 * Remembers the latest affiliate link (code, sub-ID, time) for sign-up and
 * checkout, and counts a click once per visitor per code.
 */
function trackReferral(request: NextRequest, response: NextResponse, event: NextFetchEvent) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!isReferralCode(ref)) return;
  const code = ref.toUpperCase();
  const sub = toSubId(request.nextUrl.searchParams.get("sub"));
  const previous = parseReferralCookie(request.cookies.get(REFERRAL_COOKIE)?.value);

  // Last click wins: a newer visit through any link restarts the window.
  response.cookies.set(REFERRAL_COOKIE, serializeReferralCookie({ code, sub, at: Date.now() }), {
    maxAge: REFERRAL_COOKIE_MAX_DAYS * 86_400,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
  });
  if (previous?.code === code) return;

  // After the response is sent: unknown or unapproved codes are ignored by the database.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  event.waitUntil(
    fetch(`${url}/rest/v1/rpc/track_referral_click`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ref_code: code, landing_path: request.nextUrl.pathname, sub_id: sub }),
    }).catch(() => {}),
  );
}

/** A redirect that still carries any refreshed session cookies (and their no-cache headers). */
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Everything except static files, images, metadata files and webhooks (which have no session).
    "/((?!_next/static|_next/image|api/webhooks|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
