import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { left, type MyAllowance, type PlanSlug } from "@/lib/allowances";
import { upgradeOptions, type UpgradeContext, type UpgradeReason } from "@/lib/upgrade";
import { ArrowRightIcon, ClockIcon, DownloadIcon, PencilIcon } from "../icons";

const day = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

type Meter = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** null = unlimited */
  limit: number | null;
  used: number;
  /** What a used-up meter's link offers */
  reason: UpgradeReason;
  /** Counted per period (downloads, edits) rather than at once (open requests) */
  periodic: boolean;
};

/*
 * What the member has left on their plan: store downloads, template edits and
 * edit requests open at once, each with a bar and, when it runs out, the plan
 * that gives more. On Account → Overview and My edits.
 */
export function AllowanceMeters({ allowance, upgrade, current }: { allowance: MyAllowance; upgrade: UpgradeContext; current: PlanSlug }) {
  const { downloads, edits, period, resetsAt } = allowance;
  const meters: Meter[] = [
    {
      label: "Store downloads",
      icon: DownloadIcon,
      ...downloads,
      periodic: true,
      reason: downloads.limit === 0 ? { kind: "downloads-none" } : { kind: "downloads-used", limit: downloads.limit ?? 0, period, resetsAt },
    },
    {
      label: "Template edits",
      icon: PencilIcon,
      limit: edits.limit,
      used: edits.used,
      periodic: true,
      reason: edits.limit === 0 ? { kind: "edits-none" } : { kind: "edits-used", limit: edits.limit ?? 0, period, resetsAt },
    },
  ];
  // Open requests only matter on plans with edits.
  if (edits.limit !== 0) {
    meters.push({ label: "Edits in progress", icon: ClockIcon, limit: edits.openLimit, used: edits.open, periodic: false, reason: { kind: "edits-busy", openLimit: edits.openLimit ?? 0 } });
  }
  const when = period === "month" ? " this month" : " in total";

  return (
    <section aria-label="What you have left" className={`grid gap-3 sm:grid-cols-2 ${meters.length === 3 ? "lg:grid-cols-3" : ""}`}>
      {meters.map((m) => {
        const remaining = left(m);
        const out = m.limit !== null && m.limit > 0 && remaining === 0;
        const low = m.limit !== null && m.limit > 0 && remaining > 0 && remaining / m.limit <= 0.2;
        const next = m.periodic && (out || m.limit === 0) ? upgradeOptions(upgrade.plans, current, m.reason)[0] : undefined;
        return (
          <div key={m.label} className="flex flex-col rounded-2xl border border-black/[0.06] bg-card p-5 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] dark:border-white/10">
            <p className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <m.icon className="size-4" />
              </span>
              {m.label}
            </p>

            {m.limit === null ? (
              <>
                <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">Unlimited</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {m.periodic ? "No limit on your plan" : `${m.used} open · no limit on how many at once`}
                </p>
              </>
            ) : m.limit === 0 ? (
              <>
                <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">Not included</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Your plan doesn&apos;t include these yet.</p>
              </>
            ) : m.periodic ? (
              <>
                <p className="mt-4 text-foreground">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">{remaining}</span>
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">left</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  {m.used} of {m.limit} used{when}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-foreground">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">{m.used}</span>
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">of {m.limit} open</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{out ? "Send the next one when one is delivered" : "Requests our team can work on at once"}</p>
              </>
            )}

            {m.limit !== null && m.limit > 0 && (
              <div
                role="progressbar"
                aria-label={`${m.label} used`}
                aria-valuenow={m.used}
                aria-valuemin={0}
                aria-valuemax={m.limit}
                className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]"
              >
                <div className={`h-full rounded-full ${out || low ? "bg-accent-amber" : "bg-brand"}`} style={{ width: `${Math.min(1, m.used / m.limit) * 100}%` }} />
              </div>
            )}

            <div className="mt-auto pt-4 text-sm">
              {next ? (
                <Link href={`/checkout?plan=${next.slug}`} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                  {m.limit === 0 ? `Get them with ${next.name}` : `Get more with ${next.name}`}
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              ) : !m.periodic && out ? (
                <Link href="/account/edits" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                  See my edits <ArrowRightIcon className="size-3.5" />
                </Link>
              ) : m.periodic && m.limit !== null && period === "month" && resetsAt ? (
                <span className="text-muted-foreground">Resets {day.format(new Date(resetsAt))}</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}
