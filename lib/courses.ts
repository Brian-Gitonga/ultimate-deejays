import { courses, type Course } from "./content";
import { COURSES_PAGE_SIZE, type CourseFilters } from "./course-filters";
import { courseCategories, courseDurations, courseLevels, findTopic, type CourseCategory } from "./course-taxonomy";
import { matchesQuery } from "./search";

/*
 * Catalogue queries. This is the one place that knows where courses come from:
 * today it filters the in-memory list in lib/content; with a backend, swap the
 * body for a database or API call that returns the same shape.
 */

export type FacetCounts = Record<string, number>;

export type CourseQueryResult = {
  items: Course[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  /** How many courses each option would show, given the other active filters */
  facets: { categories: FacetCounts; levels: FacetCounts; durations: FacetCounts };
};

const levelSlug = (course: Course) => course.level.toLowerCase();

const matches = {
  query: (c: Course, f: CourseFilters) => {
    const topic = findTopic(c.subcategory ?? c.category);
    return matchesQuery(
      [c.title, c.summary, c.level, c.instructor.name, topic?.topic.name ?? "", topic?.parent?.name ?? ""],
      f.query,
    );
  },
  category: (c: Course, slug: string | null) => !slug || c.category === slug || c.subcategory === slug,
  // "All Levels" courses suit every level, so they appear under each one.
  level: (c: Course, slug: string | null) => !slug || c.level === "All Levels" || levelSlug(c) === slug,
  duration: (c: Course, slug: string | null) => {
    const range = courseDurations.find((d) => d.slug === slug);
    return !range || (c.durationMinutes >= range.min && c.durationMinutes < range.max);
  },
};

const sorters: Record<CourseFilters["sort"], (a: Course, b: Course) => number> = {
  popular: (a, b) => b.students - a.students,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  shortest: (a, b) => a.durationMinutes - b.durationMinutes,
};

function countBy(pool: Course[], keys: string[], test: (c: Course, key: string) => boolean): FacetCounts {
  return Object.fromEntries(keys.map((key) => [key, pool.filter((c) => test(c, key)).length]));
}

export async function queryCourses(filters: CourseFilters): Promise<CourseQueryResult> {
  const searched = courses.filter((c) => matches.query(c, filters));

  // Each facet counts against every *other* active filter, so the numbers say what clicking would show.
  const forCategories = searched.filter((c) => matches.level(c, filters.level) && matches.duration(c, filters.duration));
  const forLevels = searched.filter((c) => matches.category(c, filters.category) && matches.duration(c, filters.duration));
  const forDurations = searched.filter((c) => matches.category(c, filters.category) && matches.level(c, filters.level));

  const topicSlugs = (courseCategories as readonly CourseCategory[]).flatMap((c) => [
    c.slug,
    ...(c.children?.map((child) => child.slug) ?? []),
  ]);

  const results = forCategories.filter((c) => matches.category(c, filters.category)).sort(sorters[filters.sort]);
  const pageCount = Math.max(1, Math.ceil(results.length / COURSES_PAGE_SIZE));
  const start = (filters.page - 1) * COURSES_PAGE_SIZE;

  return {
    items: results.slice(start, start + COURSES_PAGE_SIZE),
    total: results.length,
    page: filters.page,
    pageCount,
    pageSize: COURSES_PAGE_SIZE,
    facets: {
      categories: { all: forCategories.length, ...countBy(forCategories, topicSlugs, matches.category) },
      levels: { all: forLevels.length, ...countBy(forLevels, courseLevels.map((l) => l.slug), matches.level) },
      durations: { all: forDurations.length, ...countBy(forDurations, courseDurations.map((d) => d.slug), matches.duration) },
    },
  };
}

/** Course counts per top-level category, for the home page's category tiles. */
export function countCoursesByCategory(): FacetCounts {
  return countBy(courses, courseCategories.map((c) => c.slug), matches.category);
}
