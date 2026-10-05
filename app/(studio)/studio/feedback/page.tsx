import type { Metadata } from "next";
import { FeedbackManager } from "@/components/studio/feedback-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getMixes } from "@/lib/db/studio/mixes";

export const metadata: Metadata = { title: "Mix feedback" };

export default async function StudioFeedbackPage() {
  const mixes = await getMixes();
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Mix feedback" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Mix feedback" }]} />
        <FeedbackManager seed={mixes} />
      </div>
    </main>
  );
}
