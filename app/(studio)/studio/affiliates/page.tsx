import type { Metadata } from "next";
import { connection } from "next/server";
import { AffiliateManager } from "@/components/studio/affiliate-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getAffiliateAccounts } from "@/lib/earnings";

export const metadata: Metadata = { title: "Affiliates" };

export default async function StudioAffiliatesPage() {
  // Rendered per request so "today" (used for "applied 3 days ago") is current.
  await connection();
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Affiliates" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Affiliates" }]} />
        <AffiliateManager seed={getAffiliateAccounts()} today={new Date().toISOString().slice(0, 10)} />
      </div>
    </main>
  );
}
