import type { Metadata } from "next";
import { EarningsManager } from "@/components/studio/earnings-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getPayouts, getTransactions } from "@/lib/db/studio/payments";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Earnings" };

export default async function StudioEarningsPage({ searchParams }: PageProps<"/studio/earnings">) {
  const supabase = await createClient();
  const [{ payout }, transactions, payouts] = await Promise.all([searchParams, getTransactions(supabase), getPayouts(supabase)]);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Earnings" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Earnings" }]} />
        <EarningsManager seed={transactions} payoutSeed={payouts} today={new Date().toISOString().slice(0, 10)} openPayout={payout === "1"} />
      </div>
    </main>
  );
}
