import type { Metadata } from "next";
import { MyCourses, type MyCourse, type MyPlan } from "@/components/my-courses";
import { isAbove } from "@/lib/checkout";
import { displayName, requireViewer } from "@/lib/dal";
import { getLessonSlugsByCourse, getPublishedCourses } from "@/lib/db/courses";
import { getSiteSettings } from "@/lib/db/settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My courses" };

export default async function MyCoursesPage() {
  const viewer = await requireViewer("/account/courses");
  const supabase = await createClient();
  const [courses, lessonsByCourse, progress, enrollments, settings] = await Promise.all([
    getPublishedCourses(),
    getLessonSlugsByCourse(),
    supabase.from("lesson_progress").select("course_id, lesson_slug").eq("user_id", viewer.id),
    supabase.from("enrollments").select("course_id, last_lesson_slug, last_lesson_at, enrolled_at").eq("user_id", viewer.id),
    getSiteSettings(),
  ]);

  const planName = (slug: string) => settings.plans.find((p) => p.slug === slug)?.name ?? slug;
  const enrolled = new Map((enrollments.data ?? []).map((e) => [e.course_id, e]));
  const isAdmin = viewer.role === "admin";

  const catalog: MyCourse[] = courses
    .filter((course) => lessonsByCourse[course.id]?.length)
    .map((course) => {
      const e = enrolled.get(course.id);
      return {
        slug: course.slug,
        title: course.title,
        image: course.image,
        instructor: course.instructor.name,
        level: course.level,
        lessons: lessonsByCourse[course.id],
        students: course.students,
        included: isAdmin || !isAbove(course.access, viewer.plan),
        planName: planName(course.access),
        enrolled: !!e,
        lastLesson: e?.last_lesson_slug ?? null,
        lastActive: e?.last_lesson_at ?? e?.enrolled_at ?? null,
      };
    });

  // Progress saved to the account (from any device).
  const slugById = new Map(courses.map((c) => [c.id, c.slug]));
  const accountProgress: Record<string, string[]> = {};
  for (const row of progress.data ?? []) {
    const slug = slugById.get(row.course_id);
    if (slug) (accountProgress[slug] ??= []).push(row.lesson_slug);
  }

  const next = viewer.plan === "warm-up" ? "resident" : viewer.plan === "resident" ? "headliner" : null;
  const plan: MyPlan = {
    name: isAdmin ? "Admin (every course)" : planName(viewer.plan),
    upgrade: next && !isAdmin ? { slug: next, name: planName(next) } : null,
  };

  return <MyCourses catalog={catalog} name={displayName(viewer)} plan={plan} accountProgress={accountProgress} />;
}
