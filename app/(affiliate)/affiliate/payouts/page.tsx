import type { Metadata } from "next";
import { connection } from "next/server";
import { PayoutsManager } from "@/components/affiliate/payouts-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { accountSeed } from "@/lib/affiliate-links";
import { getAffiliatePortal } from "@/lib/affiliate-portal";

export const metadata: Metadata = { title: "Payouts" };

export default async function AffiliatePayoutsPage() {
  await connection();
  const today = new Date().toISOString().slice(0, 10);
  const { affiliate, payouts, balance, program } = getAffiliatePortal(today);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Payouts" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Payouts" }]} />
        <PayoutsManager seed={accountSeed(affiliate)} payouts={payouts} balance={balance} minPayout={program.minPayout} today={today} />
      </div>
    </main>
  );
}
