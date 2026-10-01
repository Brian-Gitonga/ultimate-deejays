import type { Metadata } from "next";
import { BlogExplorer } from "@/components/blog-explorer";
import { parseFilters } from "@/lib/blog-filters";
import { posts } from "@/lib/content";
import { toSearchParams } from "@/lib/search";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Mixing techniques, gear guides, production walkthroughs and career advice from working DJs. New posts every week.",
};

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <main className="flex-1">
      <BlogExplorer posts={posts} initial={parseFilters(toSearchParams(await searchParams))} />
    </main>
  );
}
