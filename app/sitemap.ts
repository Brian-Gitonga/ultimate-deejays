import type { MetadataRoute } from "next";
import { challenges } from "@/lib/challenges";
import { courses, posts } from "@/lib/content";
import { courseCategories, type CourseCategory } from "@/lib/course-taxonomy";
import { siteUrl } from "@/lib/site";

/*
 * Every indexable page, including each course page;
 * with a backend, read the same lists from it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  const newestCourse = courses.map((c) => c.publishedAt).sort().at(-1);
  const newestPost = posts.map((p) => p.publishedAt).sort().at(-1);

  const topics = (courseCategories as readonly CourseCategory[]).flatMap((c) => [c, ...(c.children ?? [])]);

  return [
    { url: url("/"), lastModified: newestCourse, changeFrequency: "weekly", priority: 1 },
    { url: url("/courses"), lastModified: newestCourse, changeFrequency: "weekly", priority: 0.9 },
    ...topics.map((topic) => ({
      url: url(`/courses?category=${topic.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...courses.map((course) => ({
      url: url(`/courses/${course.slug}`),
      lastModified: course.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: url("/blog"), lastModified: newestPost, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: url(`/blog/${post.slug}`),
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: url("/pricing"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/challenges"), changeFrequency: "weekly", priority: 0.7 },
    ...challenges.map((c) => ({ url: url(`/challenges/${c.slug}`), lastModified: c.opens, changeFrequency: "weekly" as const, priority: 0.5 })),
    { url: url("/about"), changeFrequency: "monthly", priority: 0.5 },
  ];
}
