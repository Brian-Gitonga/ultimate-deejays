import { articles, type Block } from "./articles";
import type { Post } from "./content";
import type { PostCategory } from "./post-categories";

/* Blog posts as the studio edits them: Markdown body + SEO fields, shaped like a database record. */

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
  author: { name: string; email: string; image: string };
  updatedAt: string;
};

/** Article blocks -> the Markdown subset the studio editor writes. */
export function blocksToMarkdown(blocks: Block[]) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return b.text;
        case "h2":
          return `## ${b.text}`;
        case "h3":
          return `## ${b.text}`;
        case "ul":
          return b.items.map((i) => `- ${i}`).join("\n");
        case "ol":
          return b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
        case "tip":
          return `> **${b.title}:** ${b.text}`;
        case "quote":
          return `> ${b.text}${b.cite ? ` (${b.cite})` : ""}`;
      }
    })
    .join("\n\n");
}

const keywordsFor = (post: Post) =>
  Array.from(new Set([post.category.name.toLowerCase(), ...post.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter((w) => w.length > 5)])).slice(0, 5);

export function toStudioPost(post: Post): StudioPost {
  return {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: blocksToMarkdown(articles[post.slug].body),
    category: post.category.slug,
    keywords: keywordsFor(post),
    cover: post.image,
    status: "published",
    publishAt: post.publishedAt,
    author: {
      name: post.author.name,
      email: `${post.author.name.toLowerCase().replace(/[^a-z]+/g, ".")}@ultimatedeejays.com`,
      image: post.author.image,
    },
    updatedAt: `${post.publishedAt}T09:00:00.000Z`,
  };
}

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
