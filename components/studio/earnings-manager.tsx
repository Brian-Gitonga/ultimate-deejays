"use client";

import { useId, useState, type ReactNode } from "react";
import { RevenueChart } from "@/components/revenue-chart";
import { markPayoutPaid, refundPayment, requestPayout } from "@/app/(studio)/studio/earnings/actions";
import { netOf, paymentMethodLabel, type PaymentMethod, type Payout, type Transaction } from "@/lib/earnings";
import { plans } from "@/lib/plans";
import { runAction, useServerCollection } from "@/lib/studio-store";
import { CheckIcon, ClockIcon, CopyIcon, CreditCardIcon, DownloadIcon, EyeIcon, MailIcon, RefundIcon, TrendUpIcon, UsersIcon, WalletIcon } from "../icons";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { StatusBadge } from "./status";
import { Avatar, PlanBadge, planName, planTone } from "./student-manager";
import { Field, Input, Kpi, Panel, Select, primaryButton, secondaryButton } from "./ui";
import { useMoney } from "../money-context";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const round = (n: number) => Math.round(n * 100) / 100;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Payment-method hues, validated for colour-blind separation and contrast in both themes; always shown with a label.
const methodTone: Record<PaymentMethod, { label: string; bar: string }> = {
  card: { label: paymentMethodLabel.card, bar: "bg-[#00a76f] dark:bg-[#1aa874]" },
  paypal: { label: paymentMethodLabel.paypal, bar: "bg-[#1f57bf] dark:bg-[#5b87f0]" },
  mobile_money: { label: paymentMethodLabel.mobile_money, bar: "bg-[#c98200] dark:bg-[#ffb938]" },
  bank_transfer: { label: paymentMethodLabel.bank_transfer, bar: "bg-[#7a4fd6] dark:bg-[#a98bff]" },
  free: { label: paymentMethodLabel.free, bar: "bg-[#71717a] dark:bg-[#a1a1aa]" },
};

const periods = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "ytd", label: "Year to date", days: 0 },
  { key: "all", label: "All time", days: -1 },
] as const;

type PeriodKey = (typeof periods)[number]["key"];

function inPeriod(t: Transaction, period: PeriodKey, today: string) {
  const p = periods.find((x) => x.key === period)!;
  if (p.days < 0) return true;
  if (p.days === 0) return t.date.slice(0, 4) === today.slice(0, 4);
  return Date.parse(today) - Date.parse(t.date) < p.days * 86_400_000;
}

function exportCsv(rows: Transaction[], currency: string) {
  const header = ["Transaction", "Date", "Customer", "Email", "Country", "Plan", "Type", `Amount ${currency}`, `Fee ${currency}`, `Commission ${currency}`, `Net ${currency}`, "Method", "Status", "Refunded", "Affiliate", `Discount ${currency}`, "Code"];
  const body = rows.map((t) => [t.id, t.date, t.customer, t.email, t.country, planName(t.plan), t.kind, t.amount, t.fee, t.commission, netOf(t), t.source, t.status, t.refundedAt ?? "", t.affiliate ?? "", t.discount, t.couponCode]);
  const csv = [header, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `payments-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

function PaymentStatus({ t }: { t: Transaction }) {
  if (t.status === "paid") return <StatusBadge status="published" label="Paid" />;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-foreground/75">
      <RefundIcon className="size-3" strokeWidth={2.5} />
      Refunded
    </span>
  );
}

function Method({ t }: { t: Transaction }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span className={`size-2 shrink-0 rounded-full ${methodTone[t.method].bar}`} aria-hidden="true" />
      {t.method === "card" || t.method === "mobile_money" ? t.source || methodTone[t.method].label : methodTone[t.method].label}
    </span>
  );
}

export function EarningsManager({ seed, payoutSeed, today, openPayout = false }: { seed: Transaction[]; payoutSeed: Payout[]; today: string; openPayout?: boolean }) {
  const { exact: money, whole: wholeMoney, currency } = useMoney();
  const { items, save } = useServerCollection(seed, { save: refundPayment });
  const { items: payouts, save: savePayout } = useServerCollection(payoutSeed, { save: markPayoutPaid });
  const [period, setPeriod] = useState<PeriodKey>("ytd");
  const [chartMetric, setChartMetric] = useState<"gross" | "net">("gross");
  const [openId, setOpenId] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<Transaction | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(openPayout);
  const { show, toast } = useToast();

  const open = items.find((t) => t.id === openId) ?? null;
  const scoped = items.filter((t) => inPeriod(t, period, today));
  const paid = scoped.filter((t) => t.status === "paid");
  const refunded = scoped.filter((t) => t.status === "refunded");
  const gross = scoped.reduce((s, t) => s + t.amount, 0);
  const fees = round(scoped.reduce((s, t) => s + t.fee, 0));
  const commissions = round(paid.reduce((s, t) => s + t.commission, 0));
  const refundTotal = refunded.reduce((s, t) => s + t.amount, 0);
  const net = round(scoped.reduce((s, t) => s + netOf(t), 0));
  const referred = paid.filter((t) => t.affiliate);

  // Balance: everything earned minus everything already paid out (or on its way).
  const lifetimeNet = items.reduce((s, t) => s + netOf(t), 0);
  const available = Math.max(0, round(lifetimeNet - payouts.reduce((s, p) => s + p.amount, 0)));
  const inTransit = round(payouts.filter((p) => p.status === "in-transit").reduce((s, p) => s + p.amount, 0));

  const year = Number(today.slice(0, 4));
  const thisMonth = Number(today.slice(5, 7));
  const monthly = MONTHS.map((month, m) => {
    const rows = items.filter((t) => t.date.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`));
    const value = Math.round(rows.reduce((s, t) => s + (chartMetric === "gross" ? t.amount : netOf(t)), 0));
    return { month, value: m + 1 > thisMonth || (m + 1 === thisMonth && !rows.length) ? null : value };
  });
  const known = monthly.filter((m): m is { month: string; value: number } => m.value !== null);
  const change = known.length > 1 && known.at(-2)!.value ? Math.round(((known.at(-1)!.value - known.at(-2)!.value) / known.at(-2)!.value) * 100) : 0;

  const byPlan = plans
    .filter((p) => p.price > 0)
    .map((p) => {
      const rows = paid.filter((t) => t.plan === p.slug);
      return { plan: p, total: rows.reduce((s, t) => s + t.amount, 0), count: rows.length, upgrades: rows.filter((t) => t.kind === "upgrade") };
    });
  const planMax = Math.max(1, ...byPlan.map((b) => b.total));

  const byMethod = (Object.keys(methodTone) as PaymentMethod[]).map((m) => {
    const rows = paid.filter((t) => t.method === m);
    return { method: m, total: rows.reduce((s, t) => s + t.amount, 0), count: rows.length };
  });
  const methodTotal = byMethod.reduce((s, m) => s + m.total, 0);
  const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

  function refund(t: Transaction) {
    setRefunding(null);
    save({ ...t, status: "refunded", refundedAt: today, commission: 0, updatedAt: new Date().toISOString() }).then(
      (saved) => saved && show(`Marked ${money(t.amount)} to ${t.customer} as refunded`),
    );
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      show(`${what} copied`);
    } catch {
      show(`Couldn't copy ${what.toLowerCase()}`);
    }
  }

  const periodLabel = periods.find((p) => p.key === period)!.label.toLowerCase();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          One-time plan payments from students. Figures below cover <span className="font-medium text-foreground">{periodLabel}</span>.
        </p>
        <div className="flex gap-2">
          <div className="w-44">
            <Select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="h-10 text-sm">
              {periods.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <button type="button" onClick={() => exportCsv(scoped, currency)} className={secondaryButton}>
            <DownloadIcon className="size-4" /> <span className="hidden sm:inline">Export</span> CSV
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={WalletIcon} label="Gross sales" value={wholeMoney(gross)} note={`${scoped.length} payments`} />
        <Kpi icon={TrendUpIcon} label="Net earnings" value={wholeMoney(net)} note="After fees, commissions and refunds" />
        <Kpi icon={RefundIcon} label="Refunds" value={wholeMoney(refundTotal)} note={`${refunded.length} refunds · ${pct(refunded.length, scoped.length)}% of payments`} />
        <Kpi icon={UsersIcon} label="Affiliate commissions" value={wholeMoney(commissions)} note={`${referred.length} referred sales`} />
      </ul>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Revenue"
          description={`Monthly ${chartMetric === "gross" ? "gross sales" : "net earnings"}, ${year}`}
          actions={
            <div role="radiogroup" aria-label="Chart metric" className="flex shrink-0 rounded-lg bg-muted p-0.5 text-sm">
              {(["gross", "net"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={chartMetric === m}
                  onClick={() => setChartMetric(m)}
                  className={`h-8 rounded-md px-3 font-medium capitalize transition ${chartMetric === m ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        >
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{wholeMoney(known.reduce((s, m) => s + m.value, 0))}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className={`inline-flex items-center gap-1 font-medium ${change >= 0 ? "text-brand-deep dark:text-brand" : "text-red-600 dark:text-red-400"}`}>
              <TrendUpIcon className={`size-4 ${change < 0 ? "-scale-y-100" : ""}`} />
              {change >= 0 ? "+" : ""}
              {change}%
            </span>
            {known.at(-1)?.month} vs {known.at(-2)?.month}
          </p>
          <div className="mt-6">
            <RevenueChart data={monthly} year={year} />
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <div className="relative isolate overflow-hidden rounded-2xl bg-neutral-900 p-6 text-white dark:bg-card dark:ring-1 dark:ring-border">
            <div aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-brand/40 blur-3xl" />
            <p className="text-sm text-white/70">Available balance</p>
            <p className="mt-1 text-[2rem] font-bold tracking-tight tabular-nums">{money(available)}</p>
            <p className="mt-1 text-xs text-white/60">{inTransit ? `${money(inTransit)} on its way to your account` : "Nothing in transit"}</p>
            <button
              type="button"
              onClick={() => setPayoutOpen(true)}
              disabled={available < 1}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-900 hover:bg-white/90 disabled:opacity-50"
            >
              Request payout
            </button>
          </div>

          <Panel title="Where the money goes">
            <dl className="space-y-2.5 text-sm">
              {[
                { label: "Gross sales", value: gross },
                { label: "Refunds", value: -refundTotal },
                { label: "Processing fees", value: -fees },
                { label: "Affiliate commissions", value: -commissions },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium text-foreground tabular-nums">{row.value < 0 ? `−${money(-row.value)}` : money(row.value)}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
                <dt className="font-semibold text-foreground">You keep</dt>
                <dd className="text-base font-bold text-foreground tabular-nums">{money(net)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Sales by plan" description="Paid plans only; Warm-Up is free.">
          <ul className="space-y-5">
            {byPlan.map((b) => (
              <li key={b.plan.slug}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{b.plan.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">{wholeMoney(b.total)}</span> · {b.count} sales
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-foreground/[0.06]">
                  <div className={`h-full rounded-full ${planTone[b.plan.slug].bar}`} style={{ width: `${(b.total / planMax) * 100}%` }} />
                </div>
                {b.upgrades.length > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Includes {b.upgrades.length} upgrades from Resident ({wholeMoney(b.upgrades.reduce((s, t) => s + t.amount, 0))})
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Payment methods" description="Share of paid sales by how students paid.">
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={byMethod.map((m) => `${methodTone[m.method].label} ${pct(m.total, methodTotal)}%`).join(", ")}>
            {byMethod.map((m) => (m.total ? <span key={m.method} className={methodTone[m.method].bar} style={{ flexGrow: m.total }} /> : null))}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3">
            {byMethod.map((m) => (
              <li key={m.method} className="rounded-xl border border-border p-4">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`size-2.5 rounded-full ${methodTone[m.method].bar}`} aria-hidden="true" />
                  {methodTone[m.method].label}
                </p>
                <p className="mt-1.5 text-xl font-bold text-foreground tabular-nums">{pct(m.total, methodTotal)}%</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {wholeMoney(m.total)} · {m.count} payments
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <ManageTable
        title="Payments"
        items={items}
        getId={(t) => t.id}
        minWidth="62rem"
        searchText={(t) => [t.customer, t.email, t.id, t.affiliate ?? "", t.country]}
        searchPlaceholder="Search name, email, ID or code"
        initialSort={{ key: "date", dir: -1 }}
        onRowClick={(t) => setOpenId(t.id)}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "paid", label: "Paid", test: (t) => t.status === "paid" },
          { key: "refunded", label: "Refunded", test: (t) => t.status === "refunded" },
          { key: "referred", label: "Referred", test: (t) => !!t.affiliate },
        ]}
        columns={[
          {
            key: "customer",
            header: "Customer",
            sort: (t) => t.customer,
            render: (t) => (
              <button type="button" onClick={() => setOpenId(t.id)} className="flex items-center gap-3 text-left">
                <Avatar student={{ name: t.customer, avatar: t.avatar }} />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground hover:text-brand">{t.customer}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.email}</span>
                </span>
              </button>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            sort: (t) => t.plan,
            render: (t) => (
              <span className="flex items-center gap-2">
                <PlanBadge plan={t.plan} />
                {t.kind === "upgrade" && <span className="text-xs text-muted-foreground">Upgrade</span>}
              </span>
            ),
          },
          { key: "amount", header: "Amount", align: "right", sort: (t) => t.amount, render: (t) => <span className="font-medium text-foreground tabular-nums">{money(t.amount)}</span> },
          {
            key: "net",
            header: "Net",
            align: "right",
            sort: (t) => netOf(t),
            render: (t) => <span className="text-muted-foreground tabular-nums">{netOf(t) < 0 ? `−${money(-netOf(t))}` : money(netOf(t))}</span>,
          },
          { key: "method", header: "Method", sort: (t) => t.method, render: (t) => <Method t={t} /> },
          {
            key: "affiliate",
            header: "Referral",
            sort: (t) => t.affiliate ?? "",
            render: (t) =>
              t.affiliate ? <span className="rounded-md bg-foreground/[0.06] px-2 py-1 font-mono text-xs text-foreground/80">{t.affiliate}</span> : <span className="text-muted-foreground">—</span>,
          },
          { key: "status", header: "Status", sort: (t) => t.status, render: (t) => <PaymentStatus t={t} /> },
          { key: "date", header: "Date", sort: (t) => t.date, render: (t) => <span className="whitespace-nowrap text-muted-foreground">{date.format(new Date(t.date))}</span> },
        ]}
        actions={(t) => (
          <RowMenu
            label={`Actions for ${t.id}`}
            items={[
              { label: "View details", icon: EyeIcon, onSelect: () => setOpenId(t.id) },
              { label: "Email customer", icon: MailIcon, href: `mailto:${t.email}`, external: true },
              { label: "Copy payment ID", icon: CopyIcon, onSelect: () => copy(t.id, "Payment ID") },
              t.status === "paid" && { label: "Refund payment", icon: RefundIcon, danger: true, onSelect: () => setRefunding(t) },
            ]}
          />
        )}
        empty={<p className="text-sm text-muted-foreground">No payments match your search.</p>}
      />

      <Panel title="Payouts" description="Money sent from your balance to your bank or PayPal account.">
        <div id="payouts" className="relative -mx-5 -my-5 overflow-x-auto sm:-mx-6 sm:-my-6">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3 font-medium sm:px-6">Payout</th>
                <th className="px-3 py-3 font-medium">For</th>
                <th className="px-3 py-3 font-medium">Destination</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium sm:px-6">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...payouts]
                .sort((a, b) => b.date.localeCompare(a.date) || b.reference.localeCompare(a.reference))
                .map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5 font-mono text-xs text-foreground sm:px-6">
                      {p.reference}
                      {p.isDemo && <span className="ml-2 rounded bg-foreground/[0.06] px-1.5 py-0.5 font-sans text-[0.6875rem] text-muted-foreground">demo</span>}
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{p.period}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{p.destination}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">{date.format(new Date(p.date))}</td>
                    <td className="px-3 py-3.5">
                      {p.status === "paid" ? (
                        <StatusBadge status="published" label="Paid" />
                      ) : (
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusBadge status="review" label="In transit" />
                          <button
                            type="button"
                            onClick={() => savePayout({ ...p, status: "paid" }).then((saved) => saved && show(`${p.reference} marked as arrived`))}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            Mark arrived
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground tabular-nums sm:px-6">{money(p.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {open && (
        <PaymentDrawer
          t={open}
          onClose={() => setOpenId(null)}
          onRefund={() => setRefunding(open)}
          onCopy={() => copy(open.id, "Payment ID")}
        />
      )}

      {refunding && (
        <ConfirmDialog
          title={`Refund ${money(refunding.amount)}?`}
          body={
            <>
              {refunding.viaPaystack
                ? `Paystack sends ${money(refunding.amount)} back to ${refunding.customer} (${methodTone[refunding.method].label.toLowerCase()}), usually within a few days, and any affiliate commission is cancelled.`
                : `This marks the payment refunded and cancels any affiliate commission. It wasn't paid through checkout, so send any money back to ${refunding.customer} yourself.`}
              The {money(refunding.fee)} processing fee isn&apos;t returned{refunding.commission ? `, and the ${money(refunding.commission)} affiliate commission is cancelled` : ""}.
            </>
          }
          confirmLabel="Refund payment"
          onCancel={() => setRefunding(null)}
          onConfirm={() => refund(refunding)}
        />
      )}

      {payoutOpen && (
        <PayoutDialog
          available={available}
          onCancel={() => setPayoutOpen(false)}
          onConfirm={(amount, destination) => {
            setPayoutOpen(false);
            runAction(() => requestPayout({ amount, destination, available })).then((result) => result.ok && show(`Payout of ${money(amount)} requested`));
          }}
        />
      )}

      {toast}
    </>
  );
}

function PaymentDrawer({ t, onClose, onRefund, onCopy }: { t: Transaction; onClose: () => void; onRefund: () => void; onCopy: () => void }) {
  const { exact: money } = useMoney();
  const rate = t.commission && t.amount ? Math.round((t.commission / t.amount) * 100) : 0;
  return (
    <Drawer
      titleId="payment-title"
      onClose={onClose}
      header={
        <>
          <p className="text-sm text-muted-foreground">Payment</p>
          <h2 id="payment-title" className="mt-0.5 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {money(t.amount)}
          </h2>
          <div className="mt-2">
            <PaymentStatus t={t} />
          </div>
        </>
      }
      footer={
        <div className="grid grid-cols-2 gap-2">
          <a href={`mailto:${t.email}`} className={secondaryButton}>
            <MailIcon className="size-4" /> Email
          </a>
          {t.status === "paid" ? (
            <button type="button" onClick={onRefund} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400">
              <RefundIcon className="size-4" /> Refund
            </button>
          ) : (
            <button type="button" onClick={onCopy} className={secondaryButton}>
              <CopyIcon className="size-4" /> Copy ID
            </button>
          )}
        </div>
      }
    >
      <div className="flex items-center gap-3 rounded-xl border border-border p-3">
        <Avatar student={{ name: t.customer, avatar: t.avatar }} size="size-11" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">{t.customer}</p>
          <p className="truncate text-sm text-muted-foreground">
            {t.email} · {t.country}
          </p>
        </div>
      </div>

      <section aria-labelledby="breakdown-heading">
        <h3 id="breakdown-heading" className="text-sm font-semibold text-foreground">
          Breakdown
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label={`${planName(t.plan)} plan${t.kind === "upgrade" ? " (upgrade)" : ""}`} value={money(t.amount + t.discount)} />
          {t.discount > 0 && <Row label={`Discount${t.couponCode ? ` · ${t.couponCode}` : ""}`} value={`−${money(t.discount)}`} />}
          {t.discount > 0 && <Row label="Customer paid" value={money(t.amount)} />}
          <Row label="Processing fee" value={t.fee ? `−${money(t.fee)}` : money(0)} />
          {t.affiliate && <Row label={`Affiliate commission · ${t.affiliate}${rate ? ` (${rate}%)` : ""}`} value={t.commission ? `−${money(t.commission)}` : "Cancelled"} />}
          {t.status === "refunded" && <Row label="Refunded to customer" value={`−${money(t.amount)}`} />}
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-semibold text-foreground">Net</dt>
            <dd className="font-bold text-foreground tabular-nums">{netOf(t) < 0 ? `−${money(-netOf(t))}` : money(netOf(t))}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="details-heading">
        <h3 id="details-heading" className="text-sm font-semibold text-foreground">
          Details
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Payment ID" value={<span className="font-mono text-xs">{t.id}</span>} />
          <Row label="Date" value={date.format(new Date(t.date))} />
          <Row
            label="Paid with"
            value={
              <span className="inline-flex items-center gap-1.5">
                {t.method === "card" ? <CreditCardIcon className="size-4 text-muted-foreground" /> : <WalletIcon className="size-4 text-muted-foreground" />}
                {t.source}
              </span>
            }
          />
          <Row label="Access" value="Lifetime (one-time payment)" />
        </dl>
      </section>

      <section aria-labelledby="timeline-heading">
        <h3 id="timeline-heading" className="text-sm font-semibold text-foreground">
          Timeline
        </h3>
        <ol className="mt-3 space-y-3 border-l border-border pl-4 text-sm">
          {t.refundedAt && (
            <li className="relative">
              <RefundIcon className="absolute top-0.5 -left-[1.4rem] size-3.5 rounded-full bg-background text-muted-foreground" />
              <span className="text-foreground">Refunded {money(t.amount)}</span>
              <span className="block text-xs text-muted-foreground">{date.format(new Date(t.refundedAt))}</span>
            </li>
          )}
          <li className="relative">
            <CheckIcon className="absolute top-0.5 -left-[1.4rem] size-3.5 rounded-full bg-background text-brand" />
            <span className="text-foreground">Payment succeeded</span>
            <span className="block text-xs text-muted-foreground">{date.format(new Date(t.date))}</span>
          </li>
          <li className="relative">
            <ClockIcon className="absolute top-0.5 -left-[1.4rem] size-3.5 rounded-full bg-background text-muted-foreground" />
            <span className="text-foreground">
              Checkout started{t.couponCode ? ` with code ${t.couponCode}` : t.affiliate ? ` from ${t.affiliate}'s link` : ""}
            </span>
            <span className="block text-xs text-muted-foreground">{date.format(new Date(t.date))}</span>
          </li>
        </ol>
      </section>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground tabular-nums">{value}</dd>
    </div>
  );
}

function PayoutDialog({ available, onCancel, onConfirm }: { available: number; onCancel: () => void; onConfirm: (amount: number, destination: string) => void }) {
  const { exact: money, currency } = useMoney();
  const id = useId();
  const [amount, setAmount] = useState(String(Math.floor(available)));
  const [destination, setDestination] = useState("Bank •••• 4821");
  const value = Number(amount);
  const error = !amount || Number.isNaN(value) ? "Enter an amount" : value < 1 ? "Minimum payout is $1" : value > available ? `You can pay out up to ${money(available)}` : "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!error) onConfirm(round(value), destination);
        }}
        className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold text-foreground">
          Request a payout
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Available now: <span className="font-medium text-foreground">{money(available)}</span>. Bank transfers arrive in 2–3 business days, PayPal within a day.
        </p>
        <div className="mt-5 space-y-4">
          <Field label={`Amount (${currency})`} htmlFor={`${id}-amount`} error={amount ? error : undefined}>
            <Input id={`${id}-amount`} type="number" min={1} step="0.01" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus aria-invalid={!!error && !!amount} />
          </Field>
          <Field label="Send to" htmlFor={`${id}-dest`}>
            <Select id={`${id}-dest`} value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option>Bank •••• 4821</option>
              <option>PayPal · studio@ultimatedeejays.com</option>
            </Select>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={!!error} className={primaryButton}>
            Request {value > 0 && !error ? money(value) : "payout"}
          </button>
        </div>
      </form>
    </div>
  );
}
