import type { Metadata } from "next";
import { SettingsManager, type SectionKey } from "@/components/studio/settings-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getSiteSettings } from "@/lib/db/settings";
import { getStudioPosts } from "@/lib/db/studio/posts";

export const metadata: Metadata = { title: "Settings" };

const sectionKeys: SectionKey[] = ["general", "pricing", "blog", "payments", "affiliates", "notifications"];

export default async function StudioSettingsPage({ searchParams }: PageProps<"/studio/settings">) {
  const [{ section }, settings, allPosts] = await Promise.all([searchParams, getSiteSettings(), getStudioPosts()]);
  const initial = sectionKeys.find((k) => k === section) ?? "general";
  const posts = allPosts.filter((p) => p.status === "published").map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Settings" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Settings" }]} />
        {/* key: start from the saved settings again after each save */}
        <SettingsManager key={settings.updatedAt} settings={settings} initialSection={initial} posts={posts} />
      </div>
    </main>
  );
}
