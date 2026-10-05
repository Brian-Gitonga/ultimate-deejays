import type { Course, Instructor } from "@/lib/content";
import type { CategorySlug, Level, SubcategorySlug } from "@/lib/course-taxonomy";
import type { CurriculumSection } from "@/lib/curriculum";
import type { Tables } from "@/lib/supabase/database.types";

/*
 * Database rows → the shapes the site's components render. Shared by the
 * public reads (lib/db/*.ts) and the studio reads (lib/db/studio/*.ts).
 */

export const FALLBACK_COURSE_IMAGE = "/images/hero-dj.webp";

/** Shown when a course or post has no instructor/author linked. */
export const TEAM_AUTHOR: Instructor = {
  id: "",
  slug: "ultimate-deejays",
  name: "Ultimate Deejays",
  specialty: "The Ultimate Deejays team",
  image: "/images/instructors/andre-wallace.jpg",
  bio: "Lessons and guides from the Ultimate Deejays team of working DJs.",
};

export function toInstructor(row: Tables<"instructors"> | null | undefined): Instructor {
  if (!row) return TEAM_AUTHOR;
  return { id: row.id, slug: row.slug, name: row.name, specialty: row.specialty, image: row.image || TEAM_AUTHOR.image, bio: row.bio };
}

/** Sample figures plus real ones; the rating is weighted by how many reviews each side has. */
export function courseFigures(row: Pick<Tables<"courses">, "sample_students" | "enrolled_count" | "sample_rating" | "sample_reviews" | "review_count" | "rating_total">) {
  const reviews = row.sample_reviews + row.review_count;
  const rating = reviews ? (Number(row.sample_rating) * row.sample_reviews + row.rating_total) / reviews : 0;
  return { students: row.sample_students + row.enrolled_count, reviews, rating: Math.round(rating * 10) / 10 };
}

export type CourseRow = Tables<"courses"> & { instructor: Tables<"instructors"> | null };

export function toCourse(row: CourseRow): Course {
  const figures = courseFigures(row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.subtitle,
    image: row.thumbnail || FALLBACK_COURSE_IMAGE,
    level: row.level as Level,
    category: row.category as CategorySlug,
    subcategory: (row.subcategory || undefined) as SubcategorySlug | undefined,
    access: row.access_plan,
    instructor: toInstructor(row.instructor),
    students: figures.students,
    durationMinutes: row.duration_minutes,
    rating: figures.rating,
    reviews: figures.reviews,
    publishedAt: (row.published_at ?? row.created_at).slice(0, 10),
  };
}

type LessonRow = Pick<Tables<"course_lessons">, "id" | "section_id" | "slug" | "title" | "summary" | "duration_seconds" | "preview" | "source" | "position">;
type SectionRow = Pick<Tables<"course_sections">, "id" | "title" | "position">;

/** Sections in order, each with its lessons in order. */
export function toCurriculum(sections: SectionRow[], lessons: LessonRow[]): CurriculumSection[] {
  return [...sections]
    .sort((a, b) => a.position - b.position)
    .map((section) => ({
      title: section.title,
      lessons: lessons
        .filter((l) => l.section_id === section.id)
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          slug: l.slug,
          title: l.title,
          summary: l.summary,
          durationSeconds: l.duration_seconds,
          preview: l.preview,
          source: l.source || undefined,
        })),
    }))
    .filter((section) => section.lessons.length > 0);
}

/** "Accra, Ghana" → { city: "Accra", country: "Ghana" }. */
export function splitLocation(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return { city: parts[0] ?? "", country: parts[0] ?? "" };
  return { city: parts.slice(0, -1).join(", "), country: parts.at(-1)! };
}
