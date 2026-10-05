import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { toProfile, type Profile } from "@/lib/profile";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/*
 * Who's signed in, and what they're allowed to open. Every server-side check
 * goes through here: layouts, pages and Server Actions call the require*
 * helpers, and RLS in the database enforces the same rules again.
 *
 * Roles:
 *   user  → /account; plus /affiliate once their application is approved
 *   admin → /account and /studio ("just admin": admins don't apply as affiliates)
 */

export type AffiliateStatus = Enums<"affiliate_status">;

export type Viewer = {
  id: string;
  email: string;
  role: Enums<"app_role">;
  /** Highest plan bought or granted */
  plan: Enums<"plan_tier">;
  status: "active" | "suspended";
  profile: Profile;
  /** Their affiliate application, or null if they haven't applied */
  affiliate: {
    status: AffiliateStatus;
    code: string | null;
    commission: number;
    channel: string;
    note: string;
    appliedAt: string;
  } | null;
};

/** The signed-in person with their profile, or null. Cached per request, so call it freely. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  // getClaims() verifies the session token; never trust getSession() on the server.
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims) return null;
  const id = auth.claims.sub;

  const [profile, affiliate] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("affiliate_applications").select("status, code, commission, channel, note, applied_at").eq("user_id", id).maybeSingle(),
  ]);

  if (profile.error) {
    throw new Error(`Couldn't load the profile for user ${id}: ${profile.error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  }
  if (!profile.data) {
    throw new Error(`User ${id} is signed in but has no profile row. Re-run the profiles migration (it backfills), then check supabase/diagnostics/01_users_and_profiles.sql.`);
  }
  if (affiliate.error) {
    throw new Error(`Couldn't load the affiliate application for user ${id}: ${affiliate.error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  }

  // "Last active" for Studio → Students. The database only writes it every 10 minutes.
  supabase.rpc("touch_last_seen").then(
    () => {},
    () => {},
  );

  const a = affiliate.data;
  return {
    id,
    email: profile.data.email || auth.claims.email || "",
    role: profile.data.role,
    plan: profile.data.plan,
    status: profile.data.status === "suspended" ? "suspended" : "active",
    profile: toProfile(profile.data),
    affiliate: a
      ? { status: a.status, code: a.code, commission: a.commission, channel: a.channel, note: a.note, appliedAt: a.applied_at }
      : null,
  };
});

/** Signed in, or off to the log-in page (coming back to `next` afterwards). */
export async function requireViewer(next = "/account/profile") {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  // Suspended in Studio → Students while signed in: end the session.
  if (viewer.status === "suspended") redirect("/auth/signout?reason=suspended");
  return viewer;
}

/** Admins only. Everyone else goes back to their account. */
export async function requireAdmin() {
  const viewer = await requireViewer("/studio");
  if (viewer.role !== "admin") redirect("/account/profile");
  return viewer;
}

/** Approved affiliates only. Everyone else lands on the program page, which shows their status. */
export async function requireAffiliate() {
  const viewer = await requireViewer("/affiliate");
  if (viewer.affiliate?.status !== "approved") redirect("/account/affiliate");
  return viewer as Viewer & { affiliate: NonNullable<Viewer["affiliate"]> };
}

/** Display name: DJ name if set, otherwise full name, otherwise email. */
export const displayName = (viewer: Viewer) => viewer.profile.djName || viewer.profile.fullName || viewer.email;
