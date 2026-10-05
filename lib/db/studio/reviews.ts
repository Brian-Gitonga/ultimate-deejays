import "server-only";
import type { StudioReview } from "@/lib/reviews";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type ReviewRow = Tables<"course_reviews"> & { course: Pick<Tables<"courses">, "title" | "slug"> | null };

export const REVIEW_COLUMNS = "*, course:courses(title, slug)";

export function toStudioReview(row: ReviewRow): StudioReview {
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.course?.title ?? "Deleted course",
    courseSlug: row.course?.slug ?? "",
    name: row.reviewer_name || "Student",
    avatar: row.reviewer_avatar,
    rating: row.rating,
    body: row.body,
    status: row.status as StudioReview["status"],
    reply: row.reply,
    repliedAt: row.replied_at,
    isDemo: row.is_demo,
    createdAt: row.created_at,
  };
}

/** Every review, newest first, hidden ones included (admins only, via RLS). */
export async function getStudioReviews(client?: Supabase): Promise<StudioReview[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("course_reviews").select(REVIEW_COLUMNS).order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load reviews: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (data as ReviewRow[]).map(toStudioReview);
}
