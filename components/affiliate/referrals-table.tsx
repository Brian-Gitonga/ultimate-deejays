"use client";

import type { Referral, TrackedLink } from "@/lib/affiliate-portal";
import { DownloadIcon } from "../icons";
import { ManageTable } from "../studio/manage-table";
import { PlanBadge, planName } from "../studio/student-manager";
import { secondaryButton } from "../studio/ui";
import { ReferralStatusBadge, referralStatus } from "./referral-status";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function exportCsv(rows: Referral[], linkName: (id: string) => string) {
  const header = ["Date", "Customer", "Country", "Plan", "Sale USD", "Commission USD", "Status", "Clears on", "Link"];
  const body = rows.map((r) => [r.date, r.customer, r.country, planName(r.plan), r.sale, r.commission, referralStatus[r.status].label, r.clearsOn, linkName(r.linkId)]);
  const csv = [header, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `referrals-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

export function ReferralsTable({ referrals, links, rate }: { referrals: Referral[]; links: Pick<TrackedLink, "id" | "label">[]; rate: number }) {
  const linkName = (id: string) => links.find((l) => l.id === id)?.label ?? "Referral code";
  return (
    <ManageTable
      title="Referrals"
      items={referrals}
      getId={(r) => r.id}
      minWidth="56rem"
      searchText={(r) => [r.customer, r.country, linkName(r.linkId), planName(r.plan)]}
      searchPlaceholder="Search name, country or link"
      initialSort={{ key: "date", dir: -1 }}
      toolbar={
        <button type="button" onClick={() => exportCsv(referrals, linkName)} className={`${secondaryButton} h-10`}>
          <DownloadIcon className="size-4" /> Export CSV
        </button>
      }
      tabs={[
        { key: "all", label: "All", test: () => true },
        ...(["pending", "approved", "paid", "refunded"] as const).map((s) => ({ key: s, label: referralStatus[s].label, test: (r: Referral) => r.status === s })),
      ]}
      columns={[
        { key: "date", header: "Date", sort: (r) => r.date, render: (r) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(r.date))}</span> },
        {
          key: "customer",
          header: "Student",
          sort: (r) => r.customer,
          render: (r) => (
            <span className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-xs font-semibold text-foreground/75" aria-hidden="true">
                {r.customer.charAt(0)}
              </span>
              <span>
                <span className="block font-medium text-foreground">{r.customer}</span>
                <span className="block text-xs text-muted-foreground">{r.country}</span>
              </span>
            </span>
          ),
        },
        {
          key: "plan",
          header: "Plan",
          sort: (r) => r.plan,
          render: (r) => (
            <span className="flex items-center gap-2">
              <PlanBadge plan={r.plan} />
              {r.kind === "upgrade" && <span className="text-xs text-muted-foreground">Upgrade</span>}
            </span>
          ),
        },
        { key: "sale", header: "Sale", align: "right", sort: (r) => r.sale, render: (r) => <span className="tabular-nums">{usd.format(r.sale)}</span> },
        {
          key: "commission",
          header: "You earn",
          align: "right",
          sort: (r) => r.commission,
          render: (r) => (
            <span className={`font-semibold tabular-nums ${r.status === "refunded" ? "text-muted-foreground line-through" : "text-foreground"}`}>{usd.format(r.status === "refunded" ? (r.sale * rate) / 100 : r.commission)}</span>
          ),
        },
        { key: "link", header: "From", sort: (r) => linkName(r.linkId), render: (r) => <span className="whitespace-nowrap text-muted-foreground">{linkName(r.linkId)}</span> },
        {
          key: "status",
          header: "Status",
          sort: (r) => r.status,
          render: (r) => (
            <span className="flex flex-col items-start gap-0.5">
              <ReferralStatusBadge status={r.status} />
              {r.status === "pending" && <span className="text-xs whitespace-nowrap text-muted-foreground">Clears {date.format(new Date(r.clearsOn))}</span>}
            </span>
          ),
        },
      ]}
      empty={<p className="text-sm text-muted-foreground">No referrals match your search.</p>}
    />
  );
}
