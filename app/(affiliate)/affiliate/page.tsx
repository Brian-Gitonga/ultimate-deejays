import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyButton } from "@/components/affiliate/copy-button";
import { ReferralStatusBadge } from "@/components/affiliate/referral-status";
import { ArrowRightIcon, DownloadIcon, LightbulbIcon, LinkIcon, PlusIcon, TrendUpIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { RevenueChart } from "@/components/revenue-chart";
import { PlanBadge } from "@/components/studio/student-manager";
import { Kpi, Panel, primaryButton, secondaryButton } from "@/components/studio/ui";
import { nextPayoutDate, prettyUrl, referralUrl } from "@/lib/affiliate-links";
import { promoAssets } from "@/lib/affiliate-portal";
import { requireAffiliate } from "@/lib/dal";
import { getAffiliatePortal } from "@/lib/db/affiliate-portal";
import { moneyFormatter } from "@/lib/money";

export const metadata: Metadata = { title: { absolute: "Dashboard | Affiliate | Ultimate Deejays" } };

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
const MONTH_NAMES: Record<string, string> = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June", Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December" };

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  if (!before) return <>{label}</>;
  const change = Math.round(((now - before) / before) * 100);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className={`inline-flex items-center gap-0.5 font-medium ${change >= 0 ? "text-brand-deep dark:text-brand" : "text-red-600 dark:text-red-400"}`}>
        <TrendUpIcon className={`size-3.5 ${change < 0 ? "-scale-y-100" : ""}`} />
        {change >= 0 ? "+" : ""}
        {change}%
      </span>
      {label}
    </span>
  );
}

export default async function AffiliateDashboardPage() {
  const viewer = await requireAffiliate();
  const today = new Date().toISOString().slice(0, 10);
  const { affiliate: a, monthly, referrals, links, balance, program, year } = await getAffiliatePortal(viewer);
  const money = moneyFormatter(program.currency);

  const months = monthly.filter((m) => m.clicks !== null);
  const latest = months.at(-1)!;
  const previous = months.at(-2);
  const vs = previous ? `vs ${MONTH_NAMES[previous.month]}` : "";
  const link = referralUrl(a.code);
  const firstName = (viewer.profile.fullName || a.name).split(" ")[0];
  const topLinks = [...links].sort((x, y) => y.earned - x.earned).slice(0, 3);
  const funnel = [
    { label: "Clicks", value: a.clicks },
    { label: "Sign-ups", value: a.signups, rate: a.clicks ? (a.signups / a.clicks) * 100 : 0, of: "of clicks" },
    { label: "Paid sales", value: a.sales, rate: a.signups ? (a.sales / a.signups) * 100 : 0, of: "of sign-ups" },
  ];
  const share = encodeURIComponent(`Learn to DJ online with Ultimate Deejays. Start free: ${link}`);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Affiliate dashboard</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">Welcome back, {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Here&apos;s how your link did in {MONTH_NAMES[latest.month]}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/affiliate/resources" className={secondaryButton}>
              <DownloadIcon className="size-4" /> Promo files
            </Link>
            <Link href="/affiliate/links" className={primaryButton}>
              <PlusIcon className="size-4" /> Create a link
            </Link>
          </div>
        </div>

        <section aria-labelledby="ref-title" className="relative isolate overflow-hidden rounded-2xl bg-neutral-900 p-5 text-white sm:p-6 dark:bg-card dark:ring-1 dark:ring-border">
          <div aria-hidden="true" className="absolute -top-24 -right-10 -z-10 size-72 rounded-full bg-brand/40 blur-3xl" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <h2 id="ref-title" className="text-sm font-medium text-white/70">
                Your referral link
              </h2>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 truncate rounded-xl bg-white/10 px-4 py-3 font-mono text-sm sm:text-base">{prettyUrl(link)}</p>
                <CopyButton text={link} label="Copy link" className="h-11 border-white/0 bg-white px-4 text-neutral-900 hover:bg-white/90" />
              </div>
              <p className="mt-3 text-sm text-white/70">
                Anyone who buys a plan within {program.cookieDays} days of clicking earns you <span className="font-semibold text-white">{a.commission}%</span>
                {a.customerDiscount ? <>, and they get {a.customerDiscount}% off</> : null}. Code at checkout:{" "}
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">{a.code}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "WhatsApp", href: `https://wa.me/?text=${share}` },
                { label: "X", href: `https://x.com/intent/post?text=${share}` },
                { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-lg border border-white/20 px-3.5 text-sm font-medium hover:bg-white/10">
                  Share on {s.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi icon={LinkIcon} label={`Clicks in ${latest.month}`} value={(latest.clicks ?? 0).toLocaleString("en-US")} note={<Delta now={latest.clicks ?? 0} before={previous?.clicks ?? 0} label={vs} />} />
          <Kpi icon={UsersIcon} label={`Sign-ups in ${latest.month}`} value={String(latest.signups ?? 0)} note={<Delta now={latest.signups ?? 0} before={previous?.signups ?? 0} label={vs} />} />
          <Kpi icon={TrendUpIcon} label={`Paid sales in ${latest.month}`} value={String(latest.sales ?? 0)} note={<Delta now={latest.sales ?? 0} before={previous?.sales ?? 0} label={vs} />} />
          <Kpi icon={WalletIcon} label={`Earned in ${latest.month}`} value={money(latest.earnings ?? 0)} note={<Delta now={latest.earnings ?? 0} before={previous?.earnings ?? 0} label={vs} />} />
        </ul>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Panel title="Your earnings" description={`Commission earned each month, ${year}`}>
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{money(balance.lifetime)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Earned{a.approvedAt ? ` since you joined on ${longDate.format(new Date(a.approvedAt))}` : ""}, from {a.sales} paid {a.sales === 1 ? "sale" : "sales"}
            </p>
            <div className="mt-6">
              <RevenueChart data={monthly.map((m) => ({ month: m.month, value: m.earnings }))} year={year} label="commission" />
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-6 text-white">
              <div aria-hidden="true" className="absolute -right-12 -bottom-16 -z-10 size-48 rounded-full bg-white/10 blur-2xl" />
              <p className="text-sm text-white/75">Owed to you</p>
              <p className="mt-1 text-[2rem] font-bold tracking-tight tabular-nums">{money(balance.owed)}</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-white/75">Cleared, ready to pay</dt>
                  <dd className="font-medium tabular-nums">{money(balance.approved)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/75">Pending (refund window)</dt>
                  <dd className="font-medium tabular-nums">{money(balance.pending)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-white/70">
                Next payout on {longDate.format(new Date(nextPayoutDate(today)))} for cleared commission over {money(program.minPayout)}.
              </p>
              <Link href="/affiliate/payouts" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-900 hover:bg-white/90">
                Payouts & payment method
              </Link>
            </div>

            <Panel title="How people get to a sale" description="All time">
              <ol className="space-y-4">
                {funnel.map((f, i) => (
                  <li key={f.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="text-foreground tabular-nums">
                        <span className="font-semibold">{f.value.toLocaleString("en-US")}</span>
                        {f.rate !== undefined && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {f.rate.toFixed(1)}% {f.of}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-foreground/[0.06]">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${funnel[0].value ? Math.max(2, (f.value / funnel[0].value) * 100) : 2}%`, opacity: 1 - i * 0.2 }} />
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel
            title="Recent referrals"
            actions={
              <Link href="/affiliate/referrals" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline">
                View all <ArrowRightIcon className="size-4" />
              </Link>
            }
          >
            {!referrals.length && (
              <p className="text-sm text-muted-foreground">
                No sales yet. When someone buys through your link or code, it shows here straight away (first name and initial only).
              </p>
            )}
            <ul className="-my-3 divide-y divide-border">
              {referrals.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/[0.07] text-xs font-semibold text-foreground/75" aria-hidden="true">
                    {r.customer.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {r.customer} <span className="font-normal text-muted-foreground">· {r.country}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <PlanBadge plan={r.plan} />
                      <span className="text-xs text-muted-foreground">{date.format(new Date(r.date))}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground tabular-nums">+{money(r.commission)}</span>
                    <ReferralStatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Your best links"
            description="Which places send you the most sales."
            actions={
              <Link href="/affiliate/links" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline">
                All links <ArrowRightIcon className="size-4" />
              </Link>
            }
          >
            {!topLinks.length && (
              <p className="text-sm text-muted-foreground">
                No tracking links yet. <Link href="/affiliate/links" className="font-medium text-brand hover:underline">Make one</Link> for each place you post to see which sells best.
              </p>
            )}
            <ul className="space-y-3">
              {topLinks.map((l, i) => (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{l.label}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {l.clicks.toLocaleString("en-US")} clicks · {l.sales} sales
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{money(l.earned)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-3 rounded-xl bg-accent-yellow/15 p-3 text-sm text-foreground">
              <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-[#9a6400] dark:text-accent-yellow" />
              <p>
                Links in video descriptions convert best. Make a separate link for each video so you can see which one sells.
              </p>
            </div>
          </Panel>
        </div>

        <Panel
          title="New promo files"
          description="Banners and posts ready to share. Your link isn't baked in, so add it in your caption or bio."
          actions={
            <Link href="/affiliate/resources" className={`${secondaryButton} h-9 shrink-0`}>
              Browse all
            </Link>
          }
        >
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {promoAssets
              .filter((x) => ["s-square", "s-story", "b-og", "b-rect"].includes(x.id))
              .map((x) => (
                <li key={x.id} className="group">
                  <a href={x.file} download className="block">
                    <span className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted p-3">
                      <Image src={x.file} alt={`${x.title} banner preview`} width={400} height={400} unoptimized className="max-h-full w-auto max-w-full rounded-md object-contain shadow-sm transition group-hover:scale-[1.03]" />
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">{x.title}</span>
                      <DownloadIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-brand" />
                    </span>
                    <span className="block text-xs text-muted-foreground">{x.size}</span>
                  </a>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
