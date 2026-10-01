import {
  courseDurations,
  courseLevels,
  courseSorts,
  findTopic,
  type DurationSlug,
  type LevelSlug,
  type SortSlug,
  type TopicSlug,
} from "./course-taxonomy";

/* Catalogue state, as it appears in the /courses URL. The URL is the single source of truth. */

export type CourseView = "grid" | "list";

export type CourseFilters = {
  query: string;
  category: TopicSlug | null;
  level: LevelSlug | null;
  duration: DurationSlug | null;
  sort: SortSlug;
  view: CourseView;
  page: number;
};

export const COURSES_PAGE_SIZE = 12;

const oneOf = <S extends string>(options: readonly { slug: S }[], value: string | null): S | null =>
  options.find((o) => o.slug === value)?.slug ?? null;

export function parseCourseFilters(params: URLSearchParams): CourseFilters {
  const category = params.get("category");
  return {
    query: (params.get("q") ?? "").trim().slice(0, 100),
    category: findTopic(category) ? (category as TopicSlug) : null,
    level: oneOf(courseLevels, params.get("level")),
    duration: oneOf(courseDurations, params.get("duration")),
    sort: oneOf(courseSorts, params.get("sort")) ?? "popular",
    view: params.get("view") === "list" ? "list" : "grid",
    page: Math.max(1, Number.parseInt(params.get("page") ?? "", 10) || 1),
  };
}

/** The URL for a catalogue state. Defaults are left out so every state has exactly one URL. */
export function coursesHref(f: CourseFilters) {
  const params = new URLSearchParams();
  if (f.query.trim()) params.set("q", f.query.trim());
  if (f.category) params.set("category", f.category);
  if (f.level) params.set("level", f.level);
  if (f.duration) params.set("duration", f.duration);
  if (f.sort !== "popular") params.set("sort", f.sort);
  if (f.view !== "grid") params.set("view", f.view);
  if (f.page > 1) params.set("page", String(f.page));
  const search = params.toString();
  return search ? `/courses?${search}` : "/courses";
}

/*
 * SEO rules for catalogue URLs:
 * - Search results (?q=) are kept out of the index, as Google recommends for internal search.
 * - Category pages and their pagination are indexable landing pages with self-referencing canonicals.
 * - Level, duration and sort only re-slice the same courses, so they point their canonical at the
 *   category's first page instead of competing with it. View (grid/list) is presentation only.
 */
export const isSearchResult = (f: CourseFilters) => f.query.trim() !== "";

export function canonicalCoursesHref(f: CourseFilters) {
  const resliced = f.level !== null || f.duration !== null || f.sort !== "popular";
  return coursesHref({
    query: "",
    category: f.category,
    level: null,
    duration: null,
    sort: "popular",
    view: "grid",
    page: resliced ? 1 : f.page,
  });
}

export const activeFilterCount = (f: CourseFilters) =>
  [f.query.trim(), f.category, f.level, f.duration].filter(Boolean).length;
