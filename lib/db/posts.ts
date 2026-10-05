import "server-only";
import { cache } from "react";
import type { Post, PostDetail } from "@/lib/content";
import { readingMinutesOf } from "@/lib/markdown";
import { postCategories } from "@/lib/post-categories";
import type { Tables } from "@/lib/supabase/database.types";
import { contentClient, maybeOrThrow, orThrow } from "./content-client";
import { toInstructor } from "./mappers";

/* Live blog posts for the public site. RLS only returns posts that aren't drafts and whose publish time has passed. */

type PostRow = Tables<"blog_posts"> & { author: Tables<"instructors"> | null };

const POST_COLUMNS = "*, author:instructors(*)";

const categoryOf = (slug: string) => postCategories.find((c) => c.slug === slug) ?? postCategories[0];

function toPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: categoryOf(row.category),
    image: row.cover || "/images/hero-dj.webp",
    author: toInstructor(row.author),
    readMinutes: readingMinutesOf(row.body),
    publishedAt: row.publish_at.slice(0, 10),
  };
}

/** Newest first. */
export const getLivePosts = cache(async (): Promise<Post[]> => {
  const rows = orThrow(
    await contentClient("posts", "instructors").from("blog_posts").select(POST_COLUMNS).order("publish_at", { ascending: false }),
    "blog posts",
  );
  return (rows as PostRow[]).map(toPost);
});

export const getLivePost = cache(async (slug: string): Promise<PostDetail | null> => {
  const row = maybeOrThrow(await contentClient("posts", "instructors").from("blog_posts").select(POST_COLUMNS).eq("slug", slug).maybeSingle(), "the post");
  if (!row) return null;
  return { ...toPost(row as PostRow), body: row.body, keywords: row.keywords };
});
