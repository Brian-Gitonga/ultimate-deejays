import "server-only";
import type { MixSubmission } from "@/lib/mixes";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type MixRow = Tables<"mix_submissions"> & {
  course: Pick<Tables<"courses">, "title"> | null;
  student: Pick<Tables<"profiles">, "email" | "avatar_url" | "plan"> | null;
};

export const MIX_COLUMNS = "*, course:courses(title), student:profiles!mix_submissions_user_id_fkey(email, avatar_url, plan)";

export function toMix(row: MixRow): MixSubmission {
  return {
    id: row.id,
    name: row.submitter_name || row.student?.email || "Student",
    email: row.student?.email ?? "",
    avatar: row.student?.avatar_url ?? null,
    plan: row.student?.plan ?? "",
    title: row.title,
    link: row.link,
    courseTitle: row.course?.title ?? null,
    notes: row.notes,
    status: row.status as MixSubmission["status"],
    feedback: row.feedback,
    reviewedAt: row.reviewed_at,
    isDemo: row.is_demo,
    createdAt: row.created_at,
  };
}

/** Every mix (admins), or just the signed-in student's (RLS decides). Newest first. */
export async function getMixes(client?: Supabase, userId?: string): Promise<MixSubmission[]> {
  const supabase = client ?? (await createClient());
  let query = supabase.from("mix_submissions").select(MIX_COLUMNS).order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load mixes: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (data as unknown as MixRow[]).map(toMix);
}
