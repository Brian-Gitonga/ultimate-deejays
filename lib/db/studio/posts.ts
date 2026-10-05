import "server-only";
import { isUuid } from "@/lib/action-result";
import type { PostCategory } from "@/lib/post-categories";
import type { StudioPost } from "@/lib/studio-blog";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/* Blog posts for the studio: drafts and scheduled posts included (admins only, via RLS). */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type PostRow = Tables<"blog_posts"> & { author: Tables<"instructors"> | null };

export function toStudioPost(row: PostRow): StudioPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category as PostCategory["slug"] | "",
    keywords: row.keywords,
    cover: row.cover,
    status: row.status,
    publishAt: row.publish_at.slice(0, 10),
    authorId: row.author_id,
    author: row.author
      ? { name: row.author.name, email: row.author.email, image: row.author.image }
      : { name: "Ultimate Deejays", email: "", image: "/images/instructors/andre-wallace.jpg" },
    updatedAt: row.updated_at,
  };
}

export async function getStudioPosts(client?: Supabase): Promise<StudioPost[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("blog_posts").select("*, author:instructors(*)").order("publish_at", { ascending: false });
  if (error) throw new Error(`Couldn't load blog posts: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (data as PostRow[]).map(toStudioPost);
}

export async function getStudioPost(id: string, client?: Supabase): Promise<StudioPost | null> {
  if (!isUuid(id)) return null;
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("blog_posts").select("*, author:instructors(*)").eq("id", id).maybeSingle();
  if (error) throw new Error(`Couldn't load the post: ${error.message}.`);
  return data ? toStudioPost(data as PostRow) : null;
}
