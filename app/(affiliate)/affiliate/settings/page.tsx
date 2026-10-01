import type { Metadata } from "next";
import { connection } from "next/server";
import { AffiliateSettings } from "@/components/affiliate/affiliate-settings";
import { StudioPageHeader } from "@/components/studio/ui";
import { accountSeed } from "@/lib/affiliate-links";
import { getAffiliatePortal } from "@/lib/affiliate-portal";

export const metadata: Metadata = { title: "Settings" };

export default async function AffiliateSettingsPage() {
  await connection();
  const { affiliate: a, program } = getAffiliatePortal(new Date().toISOString().slice(0, 10));
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Settings" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Settings" }]} />
        <AffiliateSettings seed={accountSeed(a)} affiliate={{ code: a.code, commission: a.commission, avatar: a.avatar, approvedAt: a.approvedAt }} program={program} />
      </div>
    </main>
  );
}
