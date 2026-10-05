"use server";

import { z } from "zod";
import { isUuid, type ActionResult } from "@/lib/action-result";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { toStudioPost } from "@/lib/db/studio/posts";
import { postCategories } from "@/lib/post-categories";
import type { StudioPost } from "@/lib/studio-blog";
import { adminAction, must, StudioError } from "@/lib/studio-action";
import type { Tables } from "@/lib/supabase/database.types";

const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The post URL can only use lowercase letters, numbers and dashes.").max(100),
  title: z.string().trim().max(150),
  excerpt: z.string().trim().max(400),
  body: z.string().max(100000),
  category: z.union([z.enum(postCategories.map((c) => c.slug) as [string, ...string[]]), z.literal("")]),
  keywords: z.array(z.string().trim().max(60)).max(20),
  cover: z.string().max(500),
  status: z.enum(["draft", "scheduled", "published"]),
  publishAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a publish date."),
  authorId: z.string().uuid().nullable(),
});

/** Creates or updates a blog post. Scheduled posts go live on their own once their date arrives. */
export async function savePost(post: StudioPost): Promise<ActionResult<StudioPost>> {
  return adminAction(
    "save the post",
    async ({ supabase }) => {
      const parsed = postSchema.safeParse(post);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const p = parsed.data;
      if (p.status !== "draft" && (p.title.length < 10 || !p.category || !p.cover)) {
        throw new StudioError("A post needs a title, category and cover image before it can go live.");
      }

      const existing = isUuid(post.id)
        ? must(await supabase.from("blog_posts").select("publish_at").eq("id", post.id).maybeSingle())
        : null;
      // Keep the exact time when the date didn't change; otherwise start of that day (UTC).
      const publishAt = existing && existing.publish_at.slice(0, 10) === p.publishAt ? existing.publish_at : `${p.publishAt}T00:00:00Z`;

      const values = {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        category: p.category,
        keywords: p.keywords.filter(Boolean),
        cover: p.cover,
        status: p.status,
        publish_at: publishAt,
        author_id: p.authorId,
      };
      const query = existing
        ? supabase.from("blog_posts").update(values).eq("id", post.id)
        : supabase.from("blog_posts").insert(values);
      const row = must(await query.select("*, author:instructors(*)").single());
      return toStudioPost(row as Tables<"blog_posts"> & { author: Tables<"instructors"> | null });
    },
    { tags: [CONTENT_TAGS.posts] },
  );
}

export async function deletePost(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the post",
    async ({ supabase }) => {
      must(await supabase.from("blog_posts").delete().eq("id", id));
      return null;
    },
    { tags: [CONTENT_TAGS.posts] },
  );
}
