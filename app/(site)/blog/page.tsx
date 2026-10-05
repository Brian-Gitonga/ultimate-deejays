import type { Metadata } from "next";
import { BlogExplorer } from "@/components/blog-explorer";
import { parseFilters } from "@/lib/blog-filters";
import { getLivePosts } from "@/lib/db/posts";
import { getSiteSettings } from "@/lib/db/settings";
import { toSearchParams } from "@/lib/search";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Mixing techniques, gear guides, production walkthroughs and career advice from working DJs. New posts every week.",
};

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const [live, settings] = await Promise.all([getLivePosts(), getSiteSettings()]);
  // Studio → Settings → Blog → "Pinned post" goes first.
  const pinned = live.find((p) => p.slug === settings.blog.featuredPost);
  const posts = pinned ? [pinned, ...live.filter((p) => p !== pinned)] : live;
  return (
    <main className="flex-1">
      <BlogExplorer
        posts={posts}
        initial={parseFilters(toSearchParams(await searchParams))}
        heading={settings.blog.heading}
        pageSize={settings.blog.postsPerPage}
      />
    </main>
  );
}
