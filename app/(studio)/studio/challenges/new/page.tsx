import type { Metadata } from "next";
import { Suspense } from "react";
import { ChallengeEditor } from "@/components/studio/challenge-editor";
import { StudioPageHeader } from "@/components/studio/ui";
import { getStudioChallengeSeed } from "@/lib/studio";

export const metadata: Metadata = { title: "Create challenge" };

export default function NewChallengePage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Create challenge" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Challenges", href: "/studio/challenges" }, { label: "New challenge" }]} />
        {/* The editor reads ?saved= on the client */}
        <Suspense>
          <ChallengeEditor seed={getStudioChallengeSeed()} />
        </Suspense>
      </div>
    </main>
  );
}
