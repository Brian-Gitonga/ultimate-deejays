import type { Metadata } from "next";
import { Suspense } from "react";
import { ChallengeEditor } from "@/components/studio/challenge-editor";
import { StudioPageHeader } from "@/components/studio/ui";
import { getStudioChallenges } from "@/lib/db/studio/challenges";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create challenge" };

export default async function NewChallengePage() {
  const supabase = await createClient();
  const [all] = await Promise.all([getStudioChallenges(supabase)]);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Create challenge" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Challenges", href: "/studio/challenges" }, { label: "New challenge" }]} />
        {/* The editor reads ?saved= on the client */}
        <Suspense>
          <ChallengeEditor
            challenge={null}
            entries={[]}
            takenSlugs={all.filter((c) => c.id !== "").map((c) => c.slug)}
          />
        </Suspense>
      </div>
    </main>
  );
}
