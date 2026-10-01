import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { ChallengeManager } from "@/components/studio/challenge-manager";
import { StudioPageHeader, primaryButton } from "@/components/studio/ui";
import { getStudioChallengeSeed } from "@/lib/studio";

export const metadata: Metadata = { title: "Challenges" };

export default function StudioChallengesPage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader
          title="Challenges"
          crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Challenges" }]}
          actions={
            <Link href="/studio/challenges/new" className={primaryButton}>
              <PlusIcon className="size-4" />
              Create challenge
            </Link>
          }
        />
        <ChallengeManager seed={getStudioChallengeSeed()} />
      </div>
    </main>
  );
}
