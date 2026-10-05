import type { CategorySlug, Level, SubcategorySlug } from "./course-taxonomy";
import { youtubeId } from "./curriculum";
import type { Plan } from "./plans";

/*
 * The course model the studio edits: a superset of what the public site shows
 * (Course + curriculum). Loaded from and saved to the database by
 * lib/db/studio/courses.ts and app/(studio)/studio/courses/actions.ts.
 */

export type StudioStatus = "draft" | "review" | "published";
export type AccessPlan = Plan["slug"];

export type StudioResource = { id: string; label: string; url: string };

export type StudioLesson = {
  id: string;
  /** URL slug (?lesson=); set by the server on first save and kept after that */
  slug?: string;
  title: string;
  youtube: string;
  durationSeconds: number;
  summary: string;
  /** Watchable without buying, like Udemy's "free preview" */
  preview: boolean;
  resources: StudioResource[];
  /** Channel credit for videos you didn't make */
  source?: string;
};

export type StudioSection = { id: string; title: string; lessons: StudioLesson[] };

export type StudioCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: CategorySlug | "";
  subcategory: SubcategorySlug | "";
  level: Level;
  language: string;
  access: AccessPlan;
  thumbnail: string;
  promoVideo: string;
  outcomes: string[];
  requirements: string[];
  audience: string[];
  sections: StudioSection[];
  drip: boolean;
  status: StudioStatus;
  instructorId: string | null;
  /** For display; change the instructor with instructorId */
  instructor: { name: string; email: string; image: string };
  students: number;
  rating: number;
  updatedAt: string;
};

export const languages = ["English", "French", "Spanish", "Portuguese", "Swahili", "German"];

export const thumbnailLibrary = [
  "dj-fundamentals",
  "serato-dj-pro-masterclass",
  "rekordbox-cdj-club-ready",
  "scratch-school",
  "afrobeats-amapiano-mixing",
  "harmonic-mixing",
  "ableton-production-for-djs",
  "open-format-djing",
  "vinyl-djing-essentials",
  "wedding-event-dj",
  "reading-the-crowd",
  "house-techno-mixing",
  "controller-djing",
  "festival-sets",
  "radio-mixshow-dj",
  "first-club-gig",
].map((name) => `/images/courses/${name}.jpg`);

export const uid = () => Math.random().toString(36).slice(2, 10);

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const lessonsOf = (course: StudioCourse) => course.sections.flatMap((s) => s.lessons);
export const totalSeconds = (course: StudioCourse) => lessonsOf(course).reduce((sum, l) => sum + l.durationSeconds, 0);
export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Blank draft for the Create Course form. */
export function newCourse(input: Partial<StudioCourse>, instructor: InstructorOption | null): StudioCourse {
  const title = input.title?.trim() ?? "";
  return {
    id: uid(),
    slug: slugify(title) || uid(),
    title,
    subtitle: "",
    description: "",
    category: "",
    subcategory: "",
    level: "Beginner",
    language: "English",
    access: "resident",
    thumbnail: "",
    promoVideo: "",
    outcomes: [],
    requirements: [],
    audience: [],
    sections: [{ id: uid(), title: "Introduction", lessons: [] }],
    drip: false,
    status: "draft",
    instructorId: instructor?.id ?? null,
    instructor: instructor ? { name: instructor.name, email: instructor.email, image: instructor.image } : { name: "Ultimate Deejays", email: "", image: "" },
    students: 0,
    rating: 0,
    updatedAt: new Date().toISOString(),
    ...input,
  };
}

/* ---------------------------------------------------------------- checklist */

export type CheckItem = { id: string; label: string; done: boolean; step: EditorStep };
export type EditorStep = "learners" | "curriculum" | "landing" | "access" | "publish";

/** What must be true before a course can be submitted for review. */
export function checklist(course: StudioCourse): CheckItem[] {
  const lessons = lessonsOf(course);
  const outcomes = course.outcomes.filter((o) => o.trim()).length;
  return [
    { id: "outcomes", label: "At least 4 learning outcomes", done: outcomes >= 4, step: "learners" },
    { id: "requirements", label: "At least 1 requirement", done: course.requirements.some((r) => r.trim()), step: "learners" },
    { id: "audience", label: "Who the course is for", done: course.audience.some((a) => a.trim()), step: "learners" },
    { id: "lessons", label: "At least 5 lessons", done: lessons.length >= 5, step: "curriculum" },
    {
      id: "videos",
      label: "Every lesson has a working YouTube link",
      done: lessons.length > 0 && lessons.every((l) => youtubeId(l.youtube)),
      step: "curriculum",
    },
    { id: "preview", label: "At least 1 free preview lesson", done: lessons.some((l) => l.preview), step: "curriculum" },
    { id: "title", label: "Title of 10+ characters", done: course.title.trim().length >= 10, step: "landing" },
    { id: "subtitle", label: "Subtitle", done: course.subtitle.trim().length >= 20, step: "landing" },
    { id: "description", label: "Description of 50+ words", done: wordCount(course.description) >= 50, step: "landing" },
    { id: "category", label: "Category and level", done: !!course.category, step: "landing" },
    { id: "thumbnail", label: "Course image", done: !!course.thumbnail, step: "landing" },
  ];
}

/** An instructor to pick in the course editor (and blog author picker). */
export type InstructorOption = { id: string; name: string; email: string; image: string; specialty: string };
