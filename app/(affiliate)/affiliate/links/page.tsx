import type { Metadata } from "next";
import { connection } from "next/server";
import { LinkManager } from "@/components/affiliate/link-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getAffiliatePortal, linkDestinations } from "@/lib/affiliate-portal";

export const metadata: Metadata = { title: "Links & code" };

export default async function AffiliateLinksPage() {
  await connection();
  const today = new Date().toISOString().slice(0, 10);
  const { affiliate, links, program } = getAffiliatePortal(today);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Links & code" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Links & code" }]} />
        <LinkManager code={affiliate.code} seed={links} destinations={linkDestinations} cookieDays={program.cookieDays} today={today} />
      </div>
    </main>
  );
}
