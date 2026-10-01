"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { affiliateStatusLabel, balanceOf, type Affiliate, type AffiliateStatus } from "@/lib/affiliates";
import { plans } from "@/lib/plans";
import { settingsSeed } from "@/lib/site-settings";
import { useCollection } from "@/lib/studio-store";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  CopyIcon,
  EyeIcon,
  HandshakeIcon,
  LinkIcon,
  MailIcon,
  PauseIcon,
  SettingsIcon,
  TrendUpIcon,
  UsersIcon,
  WalletIcon,
} from "../icons";
import { Drawer } from "./drawer";
import { ConfirmDialog, ManageTable, RowMenu, useToast } from "./manage-table";
import { statusMeta } from "./status";
import { Avatar } from "./student-manager";
import { Kpi, Panel, Textarea, primaryButton, secondaryButton } from "./ui";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const referralBase = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ultimatedeejays.com"}/?ref=`;
const resident = plans.find((p) => p.slug === "resident")!;
const headliner = plans.find((p) => p.slug === "headliner")!;

// Affiliate states reuse the studio status colours; each badge carries an icon and a label.
const statusStyle: Record<AffiliateStatus, { pill: string; icon: typeof CheckIcon }> = {
  approved: { pill: statusMeta.published.pill, icon: CheckIcon },
  pending: { pill: statusMeta.review.pill, icon: ClockIcon },
  paused: { pill: statusMeta.draft.pill, icon: PauseIcon },
  rejected: { pill: "bg-red-500/10 text-red-700 dark:text-red-400", icon: CloseIcon },
};

function AffiliateBadge({ status }: { status: AffiliateStatus }) {
  const s = statusStyle[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${s.pill}`}>
      <s.icon className="size-3" strokeWidth={2.5} />
      {affiliateStatusLabel[status]}
    </span>
  );
}

const conversion = (a: Affiliate) => (a.clicks ? (a.sales / a.clicks) * 100 : 0);
const clampRate = (n: number) => Math.min(90, Math.max(1, Math.round(n || 0)));

function relative(iso: string, today: string) {
  const days = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return date.format(new Date(iso));
}

export function AffiliateManager({ seed, today }: { seed: Affiliate[]; today: string }) {
  const { items, save } = useCollection("affiliates", seed);
  const { items: settings } = useCollection("settings", settingsSeed);
  const defaultRate = settings[0]?.affiliates?.defaultCommission ?? 20;
  const [openId, setOpenId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Affiliate | null>(null);
  const [paying, setPaying] = useState<Affiliate | null>(null);
  const { show, toast } = useToast();

  const open = items.find((a) => a.id === openId) ?? null;
  const pending = items.filter((a) => a.status === "pending").sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  const active = items.filter((a) => a.status === "approved");
  const partners = items.filter((a) => a.approvedAt);
  const owed = partners.reduce((s, a) => s + balanceOf(a), 0);
  const revenue = partners.reduce((s, a) => s + a.revenue, 0);
  const sales = partners.reduce((s, a) => s + a.sales, 0);
  const earned = partners.reduce((s, a) => s + a.earned, 0);

  function update(a: Affiliate, patch: Partial<Affiliate>, message: string) {
    save({ ...a, ...patch });
    show(message);
  }

  const approve = (a: Affiliate, commission: number) =>
    update(a, { status: "approved", approvedAt: a.approvedAt ?? today, commission: clampRate(commission) }, `${a.name} approved at ${clampRate(commission)}%`);

  async function copyLink(a: Affiliate) {
    try {
      await navigator.clipboard.writeText(referralBase + a.code);
      show("Referral link copied");
    } catch {
      show("Couldn't copy the link");
    }
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={HandshakeIcon} label="Active affiliates" value={String(active.length)} note={`${items.filter((a) => a.status === "paused").length} paused`} />
        <Kpi icon={ClockIcon} label="Waiting for approval" value={String(pending.length)} note={pending.length ? `Newest ${relative(pending[0].appliedAt, today).toLowerCase()}` : "All caught up"} />
        <Kpi icon={TrendUpIcon} label="Referred sales" value={usd0.format(revenue)} note={`${sales} sales from affiliate links`} />
        <Kpi icon={WalletIcon} label="Commission owed" value={usd.format(owed)} note={`${usd0.format(earned)} earned in total`} />
      </ul>

      <Panel
        title="Applications"
        description="People asking to join the affiliate program. Set their commission, then approve or decline."
        actions={
          <Link href="/studio/settings?section=affiliates" className={`${secondaryButton} h-9 shrink-0`}>
            <SettingsIcon className="size-4" /> <span className="hidden sm:inline">Program settings</span>
          </Link>
        }
      >
        {pending.length ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {pending.map((a) => (
              <li key={a.id}>
                <ApplicationCard affiliate={a} today={today} defaultRate={defaultRate} onApprove={(rate) => approve(a, rate)} onReject={() => setRejecting(a)} onView={() => setOpenId(a.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <CheckIcon className="size-6" />
            </span>
            <p className="mt-3 font-semibold text-foreground">No applications waiting</p>
            <p className="mt-1 text-sm text-muted-foreground">New requests to join the program show up here.</p>
          </div>
        )}
      </Panel>

      <ManageTable
        title="Affiliates"
        items={items}
        getId={(a) => a.id}
        minWidth="64rem"
        searchText={(a) => [a.name, a.email, a.code, a.channel]}
        searchPlaceholder="Search name, email or code"
        initialSort={{ key: "revenue", dir: -1 }}
        onRowClick={(a) => setOpenId(a.id)}
        tabs={[
          { key: "all", label: "All", test: () => true },
          { key: "approved", label: "Active", test: (a) => a.status === "approved" },
          { key: "pending", label: "Pending", test: (a) => a.status === "pending" },
          { key: "paused", label: "Paused", test: (a) => a.status === "paused" },
          { key: "rejected", label: "Declined", test: (a) => a.status === "rejected" },
        ]}
        columns={[
          {
            key: "name",
            header: "Affiliate",
            sort: (a) => a.name,
            render: (a) => (
              <button type="button" onClick={() => setOpenId(a.id)} className="flex items-center gap-3 text-left">
                <Avatar student={a} />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground hover:text-brand">{a.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.channel} · {a.audience ? `${compact.format(a.audience)} audience` : a.email}
                  </span>
                </span>
              </button>
            ),
          },
          { key: "code", header: "Code", sort: (a) => a.code, render: (a) => <span className="rounded-md bg-foreground/[0.06] px-2 py-1 font-mono text-xs text-foreground/80">{a.code}</span> },
          { key: "commission", header: "Commission", align: "right", sort: (a) => a.commission, render: (a) => <span className="font-medium text-foreground tabular-nums">{a.commission}%</span> },
          { key: "clicks", header: "Clicks", align: "right", sort: (a) => a.clicks, render: (a) => <span className="tabular-nums">{a.clicks.toLocaleString("en-US")}</span> },
          { key: "sales", header: "Sales", align: "right", sort: (a) => a.sales, render: (a) => <span className="tabular-nums">{a.sales}</span> },
          {
            key: "conversion",
            header: "Conv.",
            align: "right",
            sort: conversion,
            render: (a) => <span className="text-muted-foreground tabular-nums">{a.clicks ? `${conversion(a).toFixed(1)}%` : "—"}</span>,
          },
          { key: "revenue", header: "Referred", align: "right", sort: (a) => a.revenue, render: (a) => <span className="tabular-nums">{usd0.format(a.revenue)}</span> },
          {
            key: "balance",
            header: "Owed",
            align: "right",
            sort: balanceOf,
            render: (a) => <span className={`tabular-nums ${balanceOf(a) > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{usd.format(balanceOf(a))}</span>,
          },
          { key: "status", header: "Status", sort: (a) => a.status, render: (a) => <AffiliateBadge status={a.status} /> },
        ]}
        actions={(a) => (
          <RowMenu
            label={`Actions for ${a.name}`}
            items={[
              { label: "View details", icon: EyeIcon, onSelect: () => setOpenId(a.id) },
              a.status === "pending" && { label: `Approve at ${defaultRate}%`, icon: CheckIcon, onSelect: () => approve(a, defaultRate) },
              !!a.approvedAt && { label: "Copy referral link", icon: LinkIcon, onSelect: () => copyLink(a) },
              balanceOf(a) > 0 && { label: `Mark ${usd.format(balanceOf(a))} paid`, icon: WalletIcon, onSelect: () => setPaying(a) },
              { label: "Email", icon: MailIcon, href: `mailto:${a.email}`, external: true },
              a.status === "approved" && { label: "Pause", icon: PauseIcon, onSelect: () => update(a, { status: "paused" }, `${a.name} paused`) },
              a.status === "paused" && { label: "Reactivate", icon: CheckIcon, onSelect: () => update(a, { status: "approved" }, `${a.name} reactivated`) },
              a.status === "pending" && { label: "Decline", icon: CloseIcon, danger: true, onSelect: () => setRejecting(a) },
            ]}
          />
        )}
        empty={<p className="text-sm text-muted-foreground">No affiliates match your search.</p>}
      />

      {open && (
        <AffiliateDrawer
          key={open.id}
          a={open}
          today={today}
          defaultRate={defaultRate}
          onClose={() => setOpenId(null)}
          onSave={(patch, message) => update(open, patch, message)}
          onApprove={(rate) => approve(open, rate)}
          onReject={() => setRejecting(open)}
          onPay={() => setPaying(open)}
          onCopy={() => copyLink(open)}
        />
      )}

      {rejecting && (
        <ConfirmDialog
          title={`Decline ${rejecting.name}?`}
          body="They won't get a referral link. You can still approve them later from the Declined tab."
          confirmLabel="Decline"
          onCancel={() => setRejecting(null)}
          onConfirm={() => {
            update(rejecting, { status: "rejected" }, `${rejecting.name} declined`);
            setRejecting(null);
          }}
        />
      )}

      {paying && (
        <PayDialog
          a={paying}
          onCancel={() => setPaying(null)}
          onConfirm={() => {
            update(paying, { paidOut: paying.earned }, `${usd.format(balanceOf(paying))} marked as paid to ${paying.name}`);
            setPaying(null);
          }}
        />
      )}

      {toast}
    </>
  );
}

function RateInput({ id, value, onChange, label = "Commission" }: { id: string; value: number; onChange: (n: number) => void; label?: string }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type="number"
          min={1}
          max={90}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={() => onChange(clampRate(value))}
          className="h-10 w-full rounded-lg border border-border bg-background pr-8 pl-3 text-sm font-semibold text-foreground tabular-nums outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function ApplicationCard({
  affiliate: a,
  today,
  defaultRate,
  onApprove,
  onReject,
  onView,
}: {
  affiliate: Affiliate;
  today: string;
  defaultRate: number;
  onApprove: (rate: number) => void;
  onReject: () => void;
  onView: () => void;
}) {
  const id = useId();
  const [rate, setRate] = useState(defaultRate);
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <Avatar student={a} size="size-11" />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onView} className="block w-full truncate text-left font-semibold text-foreground hover:text-brand">
            {a.name}
          </button>
          <p className="truncate text-sm text-muted-foreground">
            {a.channel}
            {a.audience > 0 && ` · ${compact.format(a.audience)} audience`}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{relative(a.appliedAt, today)}</span>
      </div>
      <p className="mt-3 line-clamp-3 flex-1 text-sm text-foreground/85">“{a.pitch}”</p>
      <a href={a.channelUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 self-start text-sm font-medium text-brand hover:underline">
        {a.channelUrl.replace(/^https?:\/\//, "")}
        <ArrowUpRightIcon className="size-3.5" />
      </a>
      <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
        <div className="w-20 shrink-0 sm:w-24">
          <RateInput id={`${id}-rate`} value={rate} onChange={setRate} />
        </div>
        <button type="button" onClick={() => onApprove(rate)} className={`${primaryButton} flex-1 px-3`}>
          <CheckIcon className="size-4" /> Approve
        </button>
        <button type="button" onClick={onReject} aria-label={`Decline ${a.name}`} className={`${secondaryButton} px-3`}>
          <CloseIcon className="size-4 sm:hidden" />
          <span className="hidden sm:inline">Decline</span>
        </button>
      </div>
    </article>
  );
}

function AffiliateDrawer({
  a,
  today,
  defaultRate,
  onClose,
  onSave,
  onApprove,
  onReject,
  onPay,
  onCopy,
}: {
  a: Affiliate;
  today: string;
  defaultRate: number;
  onClose: () => void;
  onSave: (patch: Partial<Affiliate>, message: string) => void;
  onApprove: (rate: number) => void;
  onReject: () => void;
  onPay: () => void;
  onCopy: () => void;
}) {
  const id = useId();
  const [rate, setRate] = useState(a.status === "pending" ? defaultRate : a.commission);
  const [note, setNote] = useState(a.note);
  const balance = balanceOf(a);
  const rateChanged = a.status !== "pending" && clampRate(rate) !== a.commission;

  return (
    <Drawer
      titleId={`${id}-name`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-4">
          <Avatar student={a} size="size-14" />
          <div className="min-w-0">
            <h2 id={`${id}-name`} className="truncate text-lg font-semibold text-foreground">
              {a.name}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{a.email}</p>
            <div className="mt-1.5">
              <AffiliateBadge status={a.status} />
            </div>
          </div>
        </div>
      }
      footer={
        a.status === "pending" || a.status === "rejected" ? (
          <div className="grid grid-cols-2 gap-2">
            {a.status === "pending" ? (
              <button type="button" onClick={onReject} className={secondaryButton}>
                Decline
              </button>
            ) : (
              <a href={`mailto:${a.email}`} className={secondaryButton}>
                <MailIcon className="size-4" /> Email
              </a>
            )}
            <button type="button" onClick={() => onApprove(rate)} className={primaryButton}>
              <CheckIcon className="size-4" /> Approve at {clampRate(rate)}%
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <a href={`mailto:${a.email}`} className={secondaryButton}>
              <MailIcon className="size-4" /> Email
            </a>
            {a.status === "approved" ? (
              <button type="button" onClick={() => onSave({ status: "paused" }, `${a.name} paused`)} className={secondaryButton}>
                <PauseIcon className="size-4" /> Pause
              </button>
            ) : (
              <button type="button" onClick={() => onSave({ status: "approved" }, `${a.name} reactivated`)} className={secondaryButton}>
                <CheckIcon className="size-4" /> Reactivate
              </button>
            )}
          </div>
        )
      }
    >
      {a.status === "paused" && (
        <p role="status" className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground">
          Paused: their link still works for visitors, but new sales don&apos;t earn commission.
        </p>
      )}

      {a.approvedAt && (
        <>
          <dl className="grid grid-cols-2 gap-3">
            {[
              { label: "Clicks", value: a.clicks.toLocaleString("en-US") },
              { label: "Sign-ups", value: a.signups.toLocaleString("en-US") },
              { label: "Paid sales", value: a.sales },
              { label: "Conversion", value: a.clicks ? `${conversion(a).toFixed(1)}%` : "—" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col-reverse rounded-xl border border-border p-3">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="text-xl font-bold text-foreground tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby={`${id}-money`}>
            <h3 id={`${id}-money`} className="text-sm font-semibold text-foreground">
              Earnings
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Referred revenue", usd.format(a.revenue)],
                ["Commission earned", usd.format(a.earned)],
                ["Paid out", usd.format(a.paidOut)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-foreground tabular-nums">{value}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
                <dt className="font-semibold text-foreground">Owed now</dt>
                <dd className="font-bold text-foreground tabular-nums">{usd.format(balance)}</dd>
              </div>
            </dl>
            {balance > 0 && (
              <button type="button" onClick={onPay} className={`${secondaryButton} mt-3 w-full`}>
                <WalletIcon className="size-4" /> Mark {usd.format(balance)} as paid
              </button>
            )}
          </section>

          <section aria-labelledby={`${id}-link`}>
            <h3 id={`${id}-link`} className="text-sm font-semibold text-foreground">
              Referral link
            </h3>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-1.5 pl-3">
              <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{referralBase + a.code}</span>
              <button type="button" onClick={onCopy} className={`${secondaryButton} h-8 px-3`}>
                <CopyIcon className="size-3.5" /> Copy
              </button>
            </div>
          </section>
        </>
      )}

      <section aria-labelledby={`${id}-rate-h`}>
        <h3 id={`${id}-rate-h`} className="text-sm font-semibold text-foreground">
          Commission
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">Share of each referred sale they keep.</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="w-24">
            <RateInput id={`${id}-rate`} value={rate} onChange={setRate} label="Rate" />
          </div>
          <div className="flex flex-wrap gap-1.5 pb-0.5" role="group" aria-label="Quick rates">
            {[10, 15, 20, 25, 30].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRate(n)}
                aria-pressed={clampRate(rate) === n}
                className={`h-9 rounded-lg px-2.5 text-sm font-medium tabular-nums transition ${clampRate(rate) === n ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground hover:bg-foreground/10"}`}
              >
                {n}%
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Earns <span className="font-semibold text-foreground">{usd.format((resident.price * clampRate(rate)) / 100)}</span> per {resident.name} sale and{" "}
          <span className="font-semibold text-foreground">{usd.format((headliner.price * clampRate(rate)) / 100)}</span> per {headliner.name} sale.
        </p>
        {rateChanged && (
          <button type="button" onClick={() => onSave({ commission: clampRate(rate) }, `Commission for ${a.name} set to ${clampRate(rate)}%`)} className={`${primaryButton} mt-3`}>
            Save {clampRate(rate)}% commission
          </button>
        )}
      </section>

      <section aria-labelledby={`${id}-app`}>
        <h3 id={`${id}-app`} className="text-sm font-semibold text-foreground">
          Application
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Promotes on</dt>
            <dd className="text-right text-foreground">{a.channel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Audience</dt>
            <dd className="text-right text-foreground tabular-nums">{a.audience ? a.audience.toLocaleString("en-US") : "Not given"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Applied</dt>
            <dd className="text-right text-foreground">{date.format(new Date(a.appliedAt))}</dd>
          </div>
          {a.approvedAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Approved</dt>
              <dd className="text-right text-foreground">{date.format(new Date(a.approvedAt))}</dd>
            </div>
          )}
        </dl>
        <blockquote className="mt-3 rounded-xl bg-muted/60 p-3 text-sm text-foreground/85">“{a.pitch}”</blockquote>
        <a href={a.channelUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          Visit {a.channelUrl.replace(/^https?:\/\//, "")}
          <ArrowUpRightIcon className="size-3.5" />
        </a>
        <p className="sr-only">Applied {relative(a.appliedAt, today)}</p>
      </section>

      <section aria-labelledby={`${id}-note`}>
        <h3 id={`${id}-note`} className="text-sm font-semibold text-foreground">
          Private note
        </h3>
        <Textarea
          aria-labelledby={`${id}-note`}
          rows={3}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Only you can see this"
          className="mt-2"
        />
        {note !== a.note && (
          <button type="button" onClick={() => onSave({ note }, "Note saved")} className={`${secondaryButton} mt-2 h-9`}>
            Save note
          </button>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UsersIcon className="size-3.5" /> Referral code {a.code}
      </p>
    </Drawer>
  );
}

function PayDialog({ a, onCancel, onConfirm }: { a: Affiliate; onCancel: () => void; onConfirm: () => void }) {
  const id = useId();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm" onClick={onCancel} onKeyDown={(e) => e.key === "Escape" && onCancel()}>
      <div role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
        <h2 id={`${id}-t`} className="text-lg font-semibold text-foreground">
          Mark {usd.format(balanceOf(a))} as paid?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Do this after you&apos;ve sent the money to {a.name}. Their balance goes back to $0 and they get an email receipt.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={primaryButton}>
            <CheckIcon className="size-4" /> Mark as paid
          </button>
        </div>
      </div>
    </div>
  );
}
