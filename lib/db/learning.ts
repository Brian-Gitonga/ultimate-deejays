import "server-only";
import { isAbove } from "@/lib/checkout";
import type { Viewer } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getLessonSlugsByCourse, getPublishedCourses } from "./courses";

export type ContinueCourse = {
  slug: string;
  title: string;
  image: string;
  instructor: string;
  lessons: number;
  done: number;
  percent: number;
  /** The lesson to open: the one they were watching, or the next unfinished one */
  resume: string | null;
  lastActive: string | null;
  /** Their plan includes it */
  included: boolean;
};

export type LearningSummary = { current: ContinueCourse | null; inProgress: number; completed: number };

/**
 * For Account → Overview: the course to pick up (the latest one they haven't
 * finished, else the latest one), and how many they're taking and finished.
 * Progress saved to the account, as on My courses.
 */
export async function getLearningSummary(viewer: Viewer): Promise<LearningSummary> {
  const supabase = await createClient();
  const [courses, lessonsByCourse, enrollments, progress] = await Promise.all([
    getPublishedCourses(),
    getLessonSlugsByCourse(),
    supabase.from("enrollments").select("course_id, last_lesson_slug, last_lesson_at, enrolled_at").eq("user_id", viewer.id),
    supabase.from("lesson_progress").select("course_id, lesson_slug").eq("user_id", viewer.id),
  ]);

  const finished = new Map<string, Set<string>>();
  for (const row of progress.data ?? []) {
    if (!finished.has(row.course_id)) finished.set(row.course_id, new Set());
    finished.get(row.course_id)!.add(row.lesson_slug);
  }

  const taking: ContinueCourse[] = [];
  for (const e of enrollments.data ?? []) {
    const course = courses.find((c) => c.id === e.course_id);
    const lessons = lessonsByCourse[e.course_id] ?? [];
    if (!course || !lessons.length) continue;
    const seen = finished.get(e.course_id) ?? new Set<string>();
    const done = lessons.filter((l) => seen.has(l)).length;
    const next = lessons.find((l) => !seen.has(l)) ?? null;
    taking.push({
      slug: course.slug,
      title: course.title,
      image: course.image,
      instructor: course.instructor.name,
      lessons: lessons.length,
      done,
      percent: Math.round((done / lessons.length) * 100),
      resume: e.last_lesson_slug && !seen.has(e.last_lesson_slug) ? e.last_lesson_slug : next,
      lastActive: e.last_lesson_at ?? e.enrolled_at ?? null,
      included: viewer.role === "admin" || !isAbove(course.access, viewer.plan),
    });
  }

  taking.sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""));
  const completed = taking.filter((c) => c.percent === 100).length;
  return { current: taking.find((c) => c.percent < 100) ?? taking[0] ?? null, inProgress: taking.length - completed, completed };
}
