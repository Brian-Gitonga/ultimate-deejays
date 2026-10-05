import type { Metadata } from "next";
import { Suspense } from "react";
import { PostEditor } from "@/components/studio/post-editor";
import { StudioPageHeader } from "@/components/studio/ui";
import { getSiteSettings } from "@/lib/db/settings";
import { getInstructorOptions } from "@/lib/db/studio/courses";
import { getStudioPosts } from "@/lib/db/studio/posts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Write a post" };

export default async function NewPostPage() {
  const supabase = await createClient();
  const [posts, authors, settings] = await Promise.all([getStudioPosts(supabase), getInstructorOptions(supabase), getSiteSettings()]);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Write a post" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Blog", href: "/studio/blog" }, { label: "New post" }]} />
        {/* The editor reads ?saved= on the client */}
        <Suspense>
          <PostEditor
            post={null}
            authors={authors}
            defaultCategory={settings.blog.defaultCategory}
            takenSlugs={posts.filter((p) => p.id !== "").map((p) => p.slug)}
          />
        </Suspense>
      </div>
    </main>
  );
}
