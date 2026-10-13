import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { allowanceSummary, type MyAllowance, type PlanSlug } from "@/lib/allowances";
import type { LearningSummary } from "@/lib/db/learning";
import type { EditRequest } from "@/lib/edits";
import { formatMoney } from "@/lib/money";
import { resourcePath, type StoreResource } from "@/lib/store";
import { plansAbove, upgradeCredit, type UpgradeContext } from "@/lib/upgrade";
import { EditStatusChip } from "./edits/edit-status";
import { ArrowRightIcon, AwardIcon, CheckIcon, ClockIcon, LessonIcon, LockIcon, ShieldIcon, SparklesIcon } from "./icons";
import { DownloadAgain } from "./store/download-again";
import { StoreCover } from "./store/store-cover";

/* The sections of Account → Overview (app/(site)/account/page.tsx). */

const card = "rounded-2xl border border-black/[0.06] bg-card shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] dark:border-white/10";
const date = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const ago = (iso: string, now: number) => {
  const days = Math.floor((now - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return date.format(new Date(iso));
};

/* Their plan by name, and whether it's paid for. */
export function PlanCard({ plan, isAdmin, upgrade }: { plan: PlanSlug; isAdmin: boolean; upgrade: UpgradeContext }) {
  const name = upgrade.plans.find((p) => p.slug === plan)?.name ?? plan;
  const top = !isAdmin && plansAbove(upgrade.plans, plan).length === 0;
  return (
    <section aria-labelledby="plan-title" className={`${card} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          {isAdmin ? <ShieldIcon className="size-5" /> : <SparklesIcon className="size-5" />}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Your plan</p>
          <h2 id="plan-title" className="text-xl leading-tight font-bold tracking-tight text-foreground">
            {isAdmin ? "Admin" : name}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isAdmin
              ? "Everything is unlocked for admins."
              : top
                ? "Our top plan: you have everything. Paid once, yours for life."
                : plan === "warm-up"
                  ? "Free forever."
                  : "Paid once, yours for life. Nothing renews."}
          </p>
        </div>
      </div>
      {!isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Link href="/account/billing" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-foreground/5">
            Billing &amp; receipts
          </Link>
          <Link href="/pricing" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-foreground/5">
            Compare plans
          </Link>
        </div>
      )}
    </section>
  );
}

/* The plans above theirs, each with what it adds and what upgrading costs them. */
export function UpgradeSection({ current, upgrade }: { current: PlanSlug; upgrade: UpgradeContext }) {
  const options = plansAbove(upgrade.plans, current);
  if (!options.length) return null;
  const credit = upgradeCredit(upgrade, current);

  return (
    <section aria-labelledby="upgrade-title" className={`${card} p-5 sm:p-6`}>
      <h2 id="upgrade-title" className="text-lg font-semibold text-foreground">
        Want more?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pay once and it&apos;s yours for life{credit > 0 ? ". You only pay the difference from your current plan." : "."}
      </p>
      <ul className={`mt-4 grid gap-3 ${options.length > 1 ? "md:grid-cols-2" : ""}`}>
        {options.map((p) => {
          const unlimited = p.allowance?.downloads === null && p.allowance?.edits === null;
          return (
            <li
              key={p.slug}
              className={`flex flex-col gap-4 rounded-2xl border p-4 sm:p-5 ${options.length === 1 ? "sm:flex-row sm:items-center sm:justify-between" : ""} ${
                p.featured ? "border-brand/40 bg-brand/[0.05]" : "border-border"
              }`}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                  {unlimited ? `Go unlimited with ${p.name}` : `Upgrade to ${p.name}`}
                  {p.featured && <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[0.6875rem] font-semibold text-neutral-900">Most popular</span>}
                </p>
                {p.allowance && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CheckIcon className="size-4 shrink-0 text-brand" />{allowanceSummary(p.allowance)}</p>}
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CheckIcon className="size-4 shrink-0 text-brand" />Everything in your plan, plus more courses</p>
              </div>
              <div className={`flex items-center gap-4 ${options.length === 1 ? "sm:shrink-0" : "mt-auto justify-between"}`}>
                <p className="leading-tight">
                  <span className="block font-bold text-foreground tabular-nums">{formatMoney(Math.max(0, p.price - credit), upgrade.currency)}</span>
                  <span className="text-xs text-muted-foreground">{credit > 0 ? "to upgrade" : "one-time"}</span>
                </p>
                <Link
                  href={`/checkout?plan=${p.slug}`}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                    p.featured || options.length === 1
                      ? "bg-brand text-white hover:brightness-110"
                      : "bg-[#18181b] text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
                  }`}
                >
                  Upgrade
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* The course to pick up, with their progress. */
export function ContinueLearning({ learning, now }: { learning: LearningSummary; now: number }) {
  const course = learning.current;
  return (
    <section aria-labelledby="learning-title" className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="learning-title" className="text-lg font-semibold text-foreground">
          {course && course.percent < 100 ? "Continue learning" : "Your courses"}
        </h2>
        {(learning.inProgress > 0 || learning.completed > 0) && (
          <Link href="/account/courses" className="text-sm font-medium text-brand hover:underline">
            {learning.inProgress} in progress · {learning.completed} completed
          </Link>
        )}
      </div>

      {course ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative aspect-video shrink-0 overflow-hidden rounded-xl bg-muted sm:w-44">
            <Image src={course.image} alt="" fill sizes="(min-width: 640px) 176px, 90vw" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-brand">{course.instructor}</p>
            <h3 className="mt-0.5 line-clamp-2 font-semibold text-foreground">{course.title}</h3>
            <div className="mt-3 flex items-center gap-3">
              <div
                role="progressbar"
                aria-label={`${course.title} progress`}
                aria-valuenow={course.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10"
              >
                <div className="h-full rounded-full bg-brand" style={{ width: `${course.percent}%` }} />
              </div>
              <span className="text-sm font-medium text-foreground tabular-nums">{course.percent}%</span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {course.done} of {course.lessons} lessons
              </span>
              {course.lastActive && (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="size-3.5" /> Last watched {ago(course.lastActive, now)}
                </span>
              )}
            </p>
          </div>
          {course.included ? (
            <Link
              href={`/courses/${course.slug}${course.resume ? `?lesson=${course.resume}` : ""}`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white transition hover:bg-[#27272a] dark:bg-foreground dark:text-background"
            >
              {course.percent === 100 ? (
                <>
                  <AwardIcon className="size-4" /> Review
                </>
              ) : (
                <>
                  Continue <ArrowRightIcon className="size-4" />
                </>
              )}
            </Link>
          ) : (
            <Link href="/pricing" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
              <LockIcon className="size-4" /> See plans
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-border p-4">
          <p className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <LessonIcon className="size-5" />
            </span>
            You haven&apos;t started a course yet. Play your first lesson and your progress shows up here.
          </p>
          <Link href="/courses" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background">
            Browse courses <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

function ListCard({ id, title, link, children }: { id: string; title: string; link: { href: string; label: string }; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`${card} flex min-w-0 flex-col p-5 sm:p-6`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <Link href={link.href} className="text-sm font-medium text-brand hover:underline">
          {link.label}
        </Link>
      </div>
      {children}
    </section>
  );
}

/* Their three latest edit requests and where each one is. */
export function RecentEdits({ requests, allowance }: { requests: EditRequest[]; allowance: MyAllowance | null }) {
  const latest = requests.slice(0, 3);
  const noEdits = allowance && !allowance.admin && allowance.edits.limit === 0;
  return (
    <ListCard id="edits-title" title="Edit requests" link={{ href: "/account/edits", label: "See all" }}>
      {latest.length ? (
        <ul className="mt-3 divide-y divide-border">
          {latest.map((r) => (
            <li key={r.id}>
              <Link href={`/account/edits/${r.id}`} className="group flex items-center gap-3 py-3">
                <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <StoreCover resource={{ title: r.resource.title, thumbnail: r.resource.thumbnail, category: "templates", lowerThird: r.resource.lowerThird }} sizes="80px" compact />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground group-hover:text-brand">{r.resource.title || "Template"}</span>
                    {r.status === "delivered" && !r.seenAt && <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[0.6875rem] font-semibold text-white">New</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    #{r.number} · {date.format(new Date(r.createdAt))}
                  </span>
                  {/* Under the title on phones, where the row is narrow. */}
                  <span className="mt-1 flex sm:hidden">
                    <EditStatusChip status={r.status} />
                  </span>
                </span>
                <span className="hidden sm:flex">
                  <EditStatusChip status={r.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex-1 text-sm text-muted-foreground">
          {noEdits ? (
            <>
              No editing software? Our team can edit templates for you; edits come with a paid plan.{" "}
              <Link href="/pricing" className="font-medium text-brand hover:underline">
                See plans
              </Link>
            </>
          ) : (
            <>
              No editing software? Open a template with a <span className="font-medium text-foreground">Request an edit</span> button and our team edits it for you.{" "}
              <Link href="/lower-thirds" className="font-medium text-brand hover:underline">
                Browse lower thirds
              </Link>
            </>
          )}
        </p>
      )}
    </ListCard>
  );
}

/* The templates they downloaded lately, to take again. */
export function RecentDownloads({ downloads, allowance }: { downloads: { resource: StoreResource; lastAt: string }[]; allowance: MyAllowance | null }) {
  const limited = allowance && !allowance.admin && allowance.downloads.limit !== null && allowance.downloads.limit > 0;
  return (
    <ListCard id="downloads-title" title="Your downloads" link={{ href: "/store", label: "Browse the store" }}>
      {downloads.length ? (
        <>
          <ul className="mt-3 divide-y divide-border">
            {downloads.map(({ resource, lastAt }) => (
              <li key={resource.slug} className="flex items-center gap-3 py-3">
                <Link href={resourcePath(resource.slug, resource.lowerThird)} className="group flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    <StoreCover resource={resource} sizes="80px" compact />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground group-hover:text-brand">{resource.title}</span>
                    <span className="block text-xs text-muted-foreground">Downloaded {date.format(new Date(lastAt))}</span>
                  </span>
                </Link>
                <DownloadAgain slug={resource.slug} title={resource.title} />
              </li>
            ))}
          </ul>
          {limited && (
            <p className="mt-2 text-xs text-muted-foreground">
              {allowance.period === "month" ? "Getting one again this month doesn't use a download." : "Getting these again doesn't use a download."}
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Templates, practice tracks and sample packs you download show up here, ready to get again.</p>
      )}
    </ListCard>
  );
}
