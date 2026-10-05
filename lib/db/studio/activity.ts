import "server-only";
import { createClient } from "@/lib/supabase/server";

/*
 * Studio → Notifications: everything that happened (sign-ups, affiliate
 * applications, payments, refunds, entries, reviews, mixes), from the
 * admin_activity view, plus how many are new since this admin last looked.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ActivityKind = "student" | "affiliate" | "payment" | "refund" | "entry" | "review" | "mix";

export type Activity = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  href: string;
  createdAt: string;
};

export async function getLastReadAt(adminId: string, client?: Supabase): Promise<string | null> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase.from("admin_notification_state").select("last_read_at").eq("admin_id", adminId).maybeSingle();
  return data?.last_read_at ?? null;
}

export async function getActivity(limit = 100, client?: Supabase): Promise<Activity[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("admin_activity")
    .select("*")
    .not("created_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load notifications: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (data ?? []).map((row) => ({
    id: row.id ?? "",
    kind: (row.kind ?? "student") as ActivityKind,
    title: row.title ?? "",
    detail: row.detail ?? "",
    href: row.href ?? "/studio",
    createdAt: row.created_at ?? "",
  }));
}

/** New items since the admin last opened Notifications (all of the last 30 days if never). */
export async function getUnreadCount(adminId: string, client?: Supabase): Promise<number> {
  const supabase = client ?? (await createClient());
  const since = (await getLastReadAt(adminId, supabase)) ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { count, error } = await supabase.from("admin_activity").select("id", { count: "exact", head: true }).gt("created_at", since);
  return error ? 0 : (count ?? 0);
}
