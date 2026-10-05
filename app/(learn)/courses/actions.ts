"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { youtubeId, type LessonResource } from "@/lib/curriculum";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { getViewer } from "@/lib/dal";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/*
 * The learner side of a course page. The page itself stays static (anyone can
 * browse it); these run from the browser after it loads:
 * - openLesson() hands out a lesson's video only to signed-in students whose
 *   plan includes the course (or for a free-preview lesson). The database
 *   checks this in lesson_video() and enrolls the student the first time.
 * - Finished lessons are saved to the account, so progress follows students
 *   between devices; enrolled students can leave a review.
 */

const planSlug = z.enum(["warm-up", "resident", "headliner"]);

const lessonVideoSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    youtube: z.string(),
    resources: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })).catch([]),
    full: z.boolean(),
  }),
  z.object({ status: z.literal("signin") }),
  z.object({ status: z.literal("upgrade"), plan: planSlug }),
  z.object({ status: z.literal("not_found") }),
]);

export type LessonAccess =
  /** full = their plan includes the course (not just this free preview) */
  | { status: "ok"; videoId: string | null; resources: LessonResource[]; full: boolean }
  | { status: "signin" }
  | { status: "upgrade"; plan: z.infer<typeof planSlug> }
  | { status: "not_found" }
  | { status: "error"; error: string };

/** A lesson's video, if the student may watch it. Also enrolls them and remembers where they are. */
export async function openLesson(courseSlug: string, lessonSlug: string): Promise<LessonAccess> {
  if (typeof courseSlug !== "string" || typeof lessonSlug !== "string" || courseSlug.length > 120 || lessonSlug.length > 120) {
    return { status: "not_found" };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("lesson_video", { course_slug: courseSlug, lesson_slug: lessonSlug });
    if (error) {
      console.error("[openLesson]", error);
      // "Could not find the function" = migration 012 hasn't been run.
      return { status: "error", error: withDetail("We couldn't load this lesson. Please try again.", error) };
    }
    const parsed = lessonVideoSchema.safeParse(data);
    if (!parsed.success) return { status: "error", error: "We couldn't load this lesson. Please try again." };
    const result = parsed.data;
    if (result.status !== "ok") return result;
    return {
      status: "ok",
      videoId: youtubeId(result.youtube),
      resources: result.resources.filter((r) => r.url.startsWith("https://") || r.url.startsWith("http://")),
      full: result.full,
    };
  } catch (error) {
    console.error("[openLesson]", error);
    return { status: "error", error: "We couldn't load this lesson. Please try again." };
  }
}

const notSignedIn = { ok: false as const, error: "Log in to save your progress." };

async function publishedCourseId(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data } = await supabase.from("courses").select("id").eq("slug", slug).eq("status", "published").maybeSingle();
  return data?.id ?? null;
}

/**
 * For an enrolled student (openLesson enrolls them): saves any lessons
 * finished on this device that the account doesn't have yet, and returns
 * every finished lesson.
 */
export async function syncCourseProgress(courseSlug: string, localSlugs: string[]): Promise<ActionResult<string[]>> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (viewer.status === "suspended") return { ok: false, error: "Your account is suspended." };

  const supabase = await createClient();
  const courseId = await publishedCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: "This course isn't available." };

  const enrolled = await supabase.from("enrollments").select("course_id").eq("user_id", viewer.id).eq("course_id", courseId).maybeSingle();
  if (!enrolled.data) return { ok: true, record: [] };

  const { data: lessons } = await supabase.from("course_lessons").select("slug").eq("course_id", courseId);
  const valid = new Set((lessons ?? []).map((l) => l.slug));
  const toSave = [...new Set(localSlugs)].filter((slug) => valid.has(slug)).slice(0, 500);
  if (toSave.length) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(toSave.map((lesson_slug) => ({ user_id: viewer.id, course_id: courseId, lesson_slug })), {
        onConflict: "user_id,course_id,lesson_slug",
        ignoreDuplicates: true,
      });
    if (error) return { ok: false, error: withDetail("We couldn't save your progress.", error) };
  }

  const { data: progress, error } = await supabase.from("lesson_progress").select("lesson_slug").eq("user_id", viewer.id).eq("course_id", courseId);
  if (error) return { ok: false, error: withDetail("We couldn't load your progress.", error) };
  return { ok: true, record: progress.map((p) => p.lesson_slug).filter((slug) => valid.has(slug)) };
}

/** Marks one lesson finished or not finished. */
export async function saveLessonProgress(courseSlug: string, lessonSlug: string, done: boolean): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;

  const supabase = await createClient();
  const courseId = await publishedCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: "This course isn't available." };

  const { error } = done
    ? await supabase
        .from("lesson_progress")
        .upsert({ user_id: viewer.id, course_id: courseId, lesson_slug: lessonSlug }, { onConflict: "user_id,course_id,lesson_slug", ignoreDuplicates: true })
    : await supabase.from("lesson_progress").delete().eq("user_id", viewer.id).eq("course_id", courseId).eq("lesson_slug", lessonSlug);
  if (error) return { ok: false, error: withDetail("We couldn't save your progress.", error) };
  return { ok: true, record: null };
}

export type MyReview = { rating: number; body: string; status: "published" | "hidden"; reply: string } | null;

/** The signed-in student's review of this course, and whether they can write one. */
export async function getMyReview(courseSlug: string): Promise<ActionResult<{ canReview: boolean; review: MyReview }>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: true, record: { canReview: false, review: null } };

  const supabase = await createClient();
  const courseId = await publishedCourseId(supabase, courseSlug);
  if (!courseId) return { ok: true, record: { canReview: false, review: null } };

  const [enrolled, review] = await Promise.all([
    supabase.from("enrollments").select("course_id").eq("user_id", viewer.id).eq("course_id", courseId).maybeSingle(),
    supabase.from("course_reviews").select("rating, body, status, reply").eq("user_id", viewer.id).eq("course_id", courseId).maybeSingle(),
  ]);
  const row = review.data;
  return {
    ok: true,
    record: {
      canReview: !!enrolled.data && viewer.role !== "admin",
      review: row ? { rating: row.rating, body: row.body, status: row.status as "published" | "hidden", reply: row.reply } : null,
    },
  };
}

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a star rating.").max(5),
  body: z.string().trim().max(2000, "Keep your review to 2,000 characters.").refine((v) => v.length === 0 || v.length >= 10, "Write at least a sentence, or leave it empty."),
});

/** Creates or updates the student's review. */
export async function saveMyReview(courseSlug: string, input: { rating: number; body: string }): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Log in to review this course." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const courseId = await publishedCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: "This course isn't available." };

  const existing = await supabase.from("course_reviews").select("id").eq("user_id", viewer.id).eq("course_id", courseId).maybeSingle();
  const { error } = existing.data
    ? await supabase.from("course_reviews").update(parsed.data).eq("id", existing.data.id)
    : await supabase.from("course_reviews").insert({ course_id: courseId, user_id: viewer.id, ...parsed.data });

  if (error) {
    console.error("[saveMyReview]", error);
    if (error.code === "42501") return { ok: false, error: "Start the course before reviewing it." };
    return { ok: false, error: withDetail("We couldn't save your review. Please try again.", error) };
  }

  updateTag(CONTENT_TAGS.reviews);
  updateTag(CONTENT_TAGS.courses);
  return { ok: true, record: null };
}

export async function deleteMyReview(courseSlug: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Log in first." };
  const supabase = await createClient();
  const courseId = await publishedCourseId(supabase, courseSlug);
  if (!courseId) return { ok: false, error: "This course isn't available." };
  const { error } = await supabase.from("course_reviews").delete().eq("user_id", viewer.id).eq("course_id", courseId);
  if (error) return { ok: false, error: withDetail("We couldn't delete your review.", error) };
  updateTag(CONTENT_TAGS.reviews);
  updateTag(CONTENT_TAGS.courses);
  return { ok: true, record: null };
}
