import "server-only";
import { cache } from "react";
import { getPublishedCourses } from "./courses";
import { contentClient } from "./content-client";
import { getSiteSettings } from "./settings";
import { getStoreResources } from "./store";

/*
 * The figures on the home page, hero and About page. Students is the number
 * kept in Studio → Settings; everything else is counted from what's actually
 * published, so it can't drift from the site: courses, free courses, lessons
 * anyone with a free account can watch, and free downloads.
 */
export type SiteStats = {
  students: number;
  courses: number;
  freeCourses: number;
  /** Lessons in free courses plus free-preview lessons in paid ones */
  freeLessons: number;
  freeDownloads: number;
};

export const getSiteStats = cache(async (): Promise<SiteStats> => {
  const [settings, courses, store, lessons] = await Promise.all([
    getSiteSettings(),
    getPublishedCourses(),
    getStoreResources(),
    contentClient("courses").from("course_lessons").select("course_id, preview"),
  ]);
  const free = new Set(courses.filter((c) => c.access === "warm-up").map((c) => c.id));
  const live = new Set(courses.map((c) => c.id));
  const freeLessons = (lessons.data ?? []).filter((l) => live.has(l.course_id) && (l.preview || free.has(l.course_id))).length;
  return {
    students: settings.general.studentCount,
    courses: courses.length,
    freeCourses: free.size,
    freeLessons,
    freeDownloads: store.filter((r) => r.access === "warm-up").length,
  };
});

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 90 → "90+", 1200 → "1.2k+" */
export const studentsLabel = (n: number) => `${n < 1000 ? n : compact.format(n).toLowerCase()}+`;
