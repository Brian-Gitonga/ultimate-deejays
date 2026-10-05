import type { Metadata } from "next";
import { ReferralsTable } from "@/components/affiliate/referrals-table";
import { ReferralStatusBadge, referralStatus } from "@/components/affiliate/referral-status";
import { CheckIcon, ClockIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { Kpi, Panel, StudioPageHeader } from "@/components/studio/ui";
import { requireAffiliate } from "@/lib/dal";
import { getAffiliatePortal } from "@/lib/db/affiliate-portal";
import { moneyFormatter } from "@/lib/money";

export const metadata: Metadata = { title: "Referrals" };


export default async function AffiliateReferralsPage() {
  const viewer = await requireAffiliate();
  const { affiliate, referrals, links, balance, program } = await getAffiliatePortal(viewer);
  const money = moneyFormatter(program.currency);
  const count = (s: string) => referrals.filter((r) => r.status === s).length;

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Referrals" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Referrals" }]} />

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon={UsersIcon} label="Paid referrals" value={String(referrals.length - count("refunded"))} note={`${count("refunded")} refunded`} />
          <Kpi icon={ClockIcon} label="Pending" value={money(balance.pending)} note={`${count("pending")} sales in the ${program.refundWindow}-day refund window`} />
          <Kpi icon={CheckIcon} label="Cleared" value={money(balance.approved)} note="Goes out in your next payout" />
          <Kpi icon={WalletIcon} label="Paid to you" value={money(balance.paidOut)} note={`${money(balance.lifetime)} earned in total`} />
        </ul>

        <ReferralsTable referrals={referrals} links={links.map(({ id, label }) => ({ id, label }))} rate={affiliate.commission} />

        <Panel title="What the statuses mean">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(["pending", "approved", "paid", "refunded"] as const).map((s) => (
              <div key={s}>
                <dt>
                  <ReferralStatusBadge status={s} />
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">{referralStatus[s].hint}.</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            You only see a student&apos;s first name and initial. We never share emails or payment details.
          </p>
        </Panel>
      </div>
    </main>
  );
}
