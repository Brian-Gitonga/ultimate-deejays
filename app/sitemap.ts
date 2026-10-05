import type { MetadataRoute } from "next";
import { courseCategories, type CourseCategory } from "@/lib/course-taxonomy";
import { getPublicChallenges } from "@/lib/db/challenges";
import { getPublishedCourses } from "@/lib/db/courses";
import { getLivePosts } from "@/lib/db/posts";
import { getStoreResources } from "@/lib/db/store";
import { siteUrl } from "@/lib/site";

/* Every indexable page, including each published course, live post, challenge and store resource. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, posts, challenges, resources] = await Promise.all([getPublishedCourses(), getLivePosts(), getPublicChallenges(), getStoreResources()]);
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
    { url: url("/store"), lastModified: resources.map((r) => r.publishedAt).sort().at(-1), changeFrequency: "weekly", priority: 0.7 },
    ...resources.map((r) => ({ url: url(`/store/${r.slug}`), lastModified: r.publishedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: url("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: url("/careers"), changeFrequency: "monthly", priority: 0.3 },
    ...["/terms", "/privacy", "/refunds", "/cookies"].map((path) => ({ url: url(path), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
