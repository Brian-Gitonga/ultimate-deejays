import type { Metadata } from "next";
import { Suspense } from "react";
import { PostEditor } from "@/components/studio/post-editor";
import { StudioPageHeader } from "@/components/studio/ui";
import { instructors } from "@/lib/content";
import { getStudioPostSeed } from "@/lib/studio";

export const metadata: Metadata = { title: "Write a post" };

export default function NewPostPage() {
  // TODO: use the signed-in author.
  const marcus = instructors.find((i) => i.slug === "marcus-reid")!;
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Write a post" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Blog", href: "/studio/blog" }, { label: "New post" }]} />
        {/* The editor reads ?saved= on the client */}
        <Suspense>
          <PostEditor seed={getStudioPostSeed()} author={{ name: marcus.name, email: "marcus.reid@ultimatedeejays.com", image: marcus.image }} />
        </Suspense>
      </div>
    </main>
  );
}
