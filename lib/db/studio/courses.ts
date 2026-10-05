import "server-only";
import { isUuid } from "@/lib/action-result";
import type { CategorySlug, Level, SubcategorySlug } from "@/lib/course-taxonomy";
import { slugify, type InstructorOption, type StudioCourse, type StudioResource } from "@/lib/studio-courses";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { courseFigures } from "../mappers";

/*
 * Courses for the studio: every status, with the full curriculum. Read with
 * the signed-in admin's session, so RLS shows drafts to admins only. Lesson
 * videos and downloads aren't readable directly (see migration 012); admins
 * get them from studio_lesson_media().
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type CourseRow = Tables<"courses"> & { instructor: Tables<"instructors"> | null };
type LessonRow = Omit<Tables<"course_lessons">, "youtube" | "resources"> & { youtube: string; resources: Json };

const LESSON_COLUMNS = "course_id, id, section_id, slug, title, summary, duration_seconds, preview, source, position";

/** Lessons with their videos and downloads put back. */
async function lessonsWithMedia(supabase: Supabase, courseId?: string) {
  const lessonsQuery = supabase.from("course_lessons").select(LESSON_COLUMNS);
  const [lessons, media] = await Promise.all([
    courseId ? lessonsQuery.eq("course_id", courseId) : lessonsQuery,
    supabase.rpc("studio_lesson_media", courseId ? { target: courseId } : {}),
  ]);
  fail("lessons", lessons.error ?? media.error);
  const byId = new Map((media.data ?? []).map((m) => [`${m.course_id}:${m.id}`, m]));
  return (lessons.data ?? []).map((l): LessonRow => {
    const m = byId.get(`${l.course_id}:${l.id}`);
    return { ...l, youtube: m?.youtube ?? "", resources: m?.resources ?? [] };
  });
}

function toStudioCourse(row: CourseRow, sections: Tables<"course_sections">[], lessons: LessonRow[]): StudioCourse {
  const figures = courseFigures(row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category as CategorySlug | "",
    subcategory: row.subcategory as SubcategorySlug | "",
    level: row.level as Level,
    language: row.language,
    access: row.access_plan,
    thumbnail: row.thumbnail,
    promoVideo: row.promo_video,
    outcomes: row.outcomes,
    requirements: row.requirements,
    audience: row.audience,
    sections: sections
      .filter((s) => s.course_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        title: s.title,
        lessons: lessons
          .filter((l) => l.course_id === row.id && l.section_id === s.id)
          .sort((a, b) => a.position - b.position)
          .map((l) => ({
            id: l.id,
            slug: l.slug,
            title: l.title,
            youtube: l.youtube,
            durationSeconds: l.duration_seconds,
            summary: l.summary,
            preview: l.preview,
            resources: (Array.isArray(l.resources) ? l.resources : []) as StudioResource[],
            source: l.source,
          })),
      })),
    drip: row.drip,
    status: row.status,
    instructorId: row.instructor_id,
    instructor: row.instructor
      ? { name: row.instructor.name, email: row.instructor.email, image: row.instructor.image }
      : { name: "Ultimate Deejays", email: "", image: "" },
    students: figures.students,
    rating: figures.rating,
    updatedAt: row.updated_at,
  };
}

function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`Couldn't load ${what}: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
}

/** Every course, newest change first. */
export async function getStudioCourses(client?: Supabase): Promise<StudioCourse[]> {
  const supabase = client ?? (await createClient());
  const [courses, sections, lessons] = await Promise.all([
    supabase.from("courses").select("*, instructor:instructors(*)").order("updated_at", { ascending: false }),
    supabase.from("course_sections").select("*"),
    lessonsWithMedia(supabase),
  ]);
  fail("courses", courses.error ?? sections.error);
  return (courses.data as CourseRow[]).map((row) => toStudioCourse(row, sections.data ?? [], lessons));
}

/** One course with its curriculum, or null. */
export async function getStudioCourse(id: string, client?: Supabase): Promise<StudioCourse | null> {
  if (!isUuid(id)) return null;
  const supabase = client ?? (await createClient());
  const [course, sections, lessons] = await Promise.all([
    supabase.from("courses").select("*, instructor:instructors(*)").eq("id", id).maybeSingle(),
    supabase.from("course_sections").select("*").eq("course_id", id),
    lessonsWithMedia(supabase, id),
  ]);
  fail("the course", course.error ?? sections.error);
  return course.data ? toStudioCourse(course.data as CourseRow, sections.data ?? [], lessons) : null;
}

/** Instructors to choose from in the course editor and the blog's author picker. */
export async function getInstructorOptions(client?: Supabase): Promise<InstructorOption[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("instructors").select("id, name, email, image, specialty").order("position").order("name");
  fail("instructors", error);
  return data ?? [];
}

/**
 * The course as save_course() expects it. Lessons keep the slug they already
 * have in the database (so ?lesson= links and progress survive renames); new
 * lessons get one from their title, made unique within the course.
 */
export function toSavePayload(course: StudioCourse, existingSlugs: Map<string, string>): Json {
  const lessons = course.sections.flatMap((s) => s.lessons);
  // Existing lessons keep their slug; claim those first so a new lesson never takes one.
  const taken = new Set(lessons.map((l) => existingSlugs.get(l.id)).filter((slug): slug is string => !!slug));
  const lessonSlug = new Map<string, string>();
  lessons.forEach((lesson, index) => {
    const existing = existingSlugs.get(lesson.id);
    if (existing) return lessonSlug.set(lesson.id, existing);
    const base = lesson.slug || slugify(lesson.title) || `lesson-${index + 1}`;
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    lessonSlug.set(lesson.id, slug);
  });

  return {
    id: isUuid(course.id) ? course.id : null,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category: course.category,
    subcategory: course.subcategory,
    level: course.level,
    language: course.language,
    access: course.access,
    thumbnail: course.thumbnail,
    promoVideo: course.promoVideo,
    outcomes: course.outcomes.map((o) => o.trim()).filter(Boolean),
    requirements: course.requirements.map((r) => r.trim()).filter(Boolean),
    audience: course.audience.map((a) => a.trim()).filter(Boolean),
    drip: course.drip,
    status: course.status,
    instructorId: course.instructorId,
    sections: course.sections.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        slug: lessonSlug.get(l.id)!,
        title: l.title,
        summary: l.summary,
        youtube: l.youtube,
        durationSeconds: Math.max(0, Math.round(l.durationSeconds || 0)),
        preview: l.preview,
        resources: l.resources.map((r) => ({ id: r.id, label: r.label, url: r.url })),
        source: l.source ?? "",
      })),
    })),
  };
}
