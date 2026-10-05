import "server-only";
import { cache } from "react";
import type { Course } from "@/lib/content";
import type { CurriculumSection } from "@/lib/curriculum";
import { contentClient, maybeOrThrow, orThrow } from "./content-client";
import { toCourse, toCurriculum, type CourseRow } from "./mappers";

/* Published courses for the public site. Drafts never come back: RLS hides them from visitors. */

const COURSE_COLUMNS = "*, instructor:instructors(*)";

export const getPublishedCourses = cache(async (): Promise<Course[]> => {
  const rows = orThrow(
    await contentClient("courses", "instructors", "reviews")
      .from("courses")
      .select(COURSE_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    "courses",
  );
  return (rows as CourseRow[]).map(toCourse);
});

export type CourseDetail = { course: Course; sections: CurriculumSection[] };

/** A published course with its curriculum, or null. */
export const getCourseDetail = cache(async (slug: string): Promise<CourseDetail | null> => {
  const client = contentClient("courses", "instructors", "reviews");
  const row = maybeOrThrow(await client.from("courses").select(COURSE_COLUMNS).eq("slug", slug).eq("status", "published").maybeSingle(), "the course");
  if (!row) return null;

  const [sections, lessons] = await Promise.all([
    client.from("course_sections").select("id, title, position").eq("course_id", row.id),
    client
      .from("course_lessons")
      // No video links or downloads here: openLesson() hands those out (migration 012).
      .select("id, section_id, slug, title, summary, duration_seconds, preview, source, position")
      .eq("course_id", row.id),
  ]);
  return {
    course: toCourse(row as CourseRow),
    sections: toCurriculum(orThrow(sections, "course sections"), orThrow(lessons, "course lessons")),
  };
});

/** Most-enrolled published courses, for the home page. */
export async function getPopularCourses(limit = 8) {
  return [...(await getPublishedCourses())].sort((a, b) => b.students - a.students).slice(0, limit);
}

/** Newest published courses, for the home page. */
export async function getLatestCourses(limit = 8) {
  return [...(await getPublishedCourses())].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

/** Lesson slugs of every published course, in curriculum order, keyed by course id. */
export const getLessonSlugsByCourse = cache(async (): Promise<Record<string, string[]>> => {
  const client = contentClient("courses");
  const [sections, lessons] = await Promise.all([
    client.from("course_sections").select("course_id, id, position"),
    client.from("course_lessons").select("course_id, section_id, slug, position"),
  ]);
  const sectionOrder = new Map(orThrow(sections, "course sections").map((s) => [`${s.course_id}:${s.id}`, s.position]));
  const byCourse: Record<string, { slug: string; order: number }[]> = {};
  for (const l of orThrow(lessons, "course lessons")) {
    (byCourse[l.course_id] ??= []).push({ slug: l.slug, order: (sectionOrder.get(`${l.course_id}:${l.section_id}`) ?? 0) * 10_000 + l.position });
  }
  return Object.fromEntries(Object.entries(byCourse).map(([id, list]) => [id, list.sort((a, b) => a.order - b.order).map((l) => l.slug)]));
});
