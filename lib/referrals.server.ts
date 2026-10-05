import "server-only";
import { cookies } from "next/headers";
import type { createClient } from "@/lib/supabase/server";
import { parseReferralCookie, REFERRAL_COOKIE, type ReferralVisit } from "./referrals";

/** The affiliate link this browser last came through, if any. */
export async function readReferralVisit(): Promise<ReferralVisit | null> {
  return parseReferralCookie((await cookies()).get(REFERRAL_COOKIE)?.value);
}

/**
 * Credits the affiliate whose link the newly signed-up member came through
 * (from the ud_ref cookie). Safe to call on every sign-in: the database only
 * accepts it once, within a day of sign-up, for an approved code.
 */
export async function attachReferral(supabase: Awaited<ReturnType<typeof createClient>>) {
  const visit = await readReferralVisit();
  if (!visit) return;
  const { error } = await supabase.rpc("attach_referral", { ref_code: visit.code });
  if (error) console.error("[attachReferral]", error.message);
}
