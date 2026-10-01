import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { BlogManager } from "@/components/studio/blog-manager";
import { StudioPageHeader, primaryButton } from "@/components/studio/ui";
import { getStudioPostSeed } from "@/lib/studio";

export const metadata: Metadata = { title: "Blog" };

export default function StudioBlogPage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader
          title="Blog"
          crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Blog" }]}
          actions={
            <Link href="/studio/blog/new" className={primaryButton}>
              <PlusIcon className="size-4" />
              Write a post
            </Link>
          }
        />
        <BlogManager seed={getStudioPostSeed()} />
      </div>
    </main>
  );
}
