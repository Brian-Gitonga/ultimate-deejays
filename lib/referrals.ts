/*
 * Affiliate referral tracking.
 *
 * 1. Someone opens a link with ?ref=CODE (and optionally &sub=campaign).
 *    proxy.ts counts a click (once per visitor per code) and remembers the
 *    code, the sub-ID and the time in the ud_ref cookie.
 * 2. When they create an account, attachReferral() credits the affiliate
 *    (profiles.referred_by). The database only accepts it for approved codes,
 *    within a day of signing up, once, and never for your own code.
 * 3. At checkout the affiliate is credited with the sale (last click wins)
 *    when the cookie is younger than Studio → Settings → Affiliates → cookie
 *    length, and their code is applied as a discount for the buyer. A code
 *    typed at checkout beats the cookie. See lib/checkout.server.ts.
 */

export const REFERRAL_COOKIE = "ud_ref";
/** How long the browser keeps the cookie. The attribution window itself is the cookie length setting (up to this). */
export const REFERRAL_COOKIE_MAX_DAYS = 90;

export const isReferralCode = (value: string | null | undefined): value is string => !!value && /^[A-Za-z0-9]{3,20}$/.test(value);

/** Tracking-link sub-IDs: lowercase letters, digits and dashes ("yt-bio"). */
export const toSubId = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

export type ReferralVisit = { code: string; sub: string; at: number };

/** "DJKAYA.yt-bio.1767225600" → { code, sub, at (ms) }. Older cookies hold just the code. */
export function parseReferralCookie(value: string | null | undefined): ReferralVisit | null {
  if (!value) return null;
  const [code, sub = "", at = ""] = value.split(".");
  if (!isReferralCode(code)) return null;
  const seconds = Number(at);
  return { code: code.toUpperCase(), sub: toSubId(sub), at: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0 };
}

export const serializeReferralCookie = (visit: ReferralVisit) => `${visit.code}.${visit.sub}.${Math.floor(visit.at / 1000)}`;
