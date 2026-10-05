import type { PostCategory } from "./post-categories";

/*
 * Blog posts as the studio edits them: Markdown body (see lib/markdown.ts) plus
 * SEO fields. Stored in blog_posts; loaded by lib/db/studio/posts.ts.
 */

export type PostStatus = "draft" | "scheduled" | "published";

export type StudioPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: PostCategory["slug"] | "";
  keywords: string[];
  cover: string;
  status: PostStatus;
  /** ISO date the post goes (or went) live */
  publishAt: string;
  authorId: string | null;
  /** For display; change the author with authorId */
  author: { name: string; email: string; image: string };
  updatedAt: string;
};

export type PostCheck = { label: string; done: boolean };

/** SEO and completeness checks shown beside the editor. */
export function postChecks(p: StudioPost): PostCheck[] {
  const words = p.body.trim().split(/\s+/).filter(Boolean).length;
  return [
    { label: "Title between 30 and 65 characters", done: p.title.length >= 30 && p.title.length <= 65 },
    { label: "Summary between 70 and 160 characters", done: p.excerpt.length >= 70 && p.excerpt.length <= 160 },
    { label: "At least 300 words", done: words >= 300 },
    { label: "Uses section headings", done: /^## /m.test(p.body) },
    { label: "Links to another post or course", done: /\]\(\/(blog|courses)\//.test(p.body) },
    { label: "Cover image", done: !!p.cover },
    { label: "Category and 3+ keywords", done: !!p.category && p.keywords.length >= 3 },
  ];
}
