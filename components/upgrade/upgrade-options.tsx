import Link from "next/link";
import { allowanceSummary } from "@/lib/allowances";
import { formatMoney } from "@/lib/money";
import type { UpgradePlan } from "@/lib/upgrade";
import { ArrowRightIcon } from "../icons";

/* The plans that would let the member do what they tried, each with its price and a way to get it. */
export function UpgradeOptions({ options, currency, credit }: { options: UpgradePlan[]; currency: string; /** Taken off each price (see upgradeCredit) */ credit: number }) {
  if (!options.length) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        You&apos;re on our biggest plan already. Need more?{" "}
        <Link href="/contact" className="font-medium text-brand hover:underline">
          Get in touch
        </Link>{" "}
        and we&apos;ll sort it out.
      </p>
    );
  }
  return (
    <div>
      <ul className="space-y-3">
        {options.map((p) => (
          <li key={p.slug} className={`rounded-2xl border p-4 ${p.featured ? "border-brand/40 bg-brand/[0.05]" : "border-border"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                  {p.name}
                  {p.featured && <span className="rounded-full bg-accent-yellow px-2 py-0.5 text-[0.6875rem] font-semibold text-neutral-900">Most popular</span>}
                </p>
                {p.allowance && <p className="mt-0.5 text-sm text-muted-foreground">{allowanceSummary(p.allowance)}</p>}
              </div>
              <p className="shrink-0 text-right">
                <span className="block font-semibold text-foreground tabular-nums">{formatMoney(Math.max(0, p.price - credit), currency)}</span>
                <span className="text-xs text-muted-foreground">{credit > 0 ? "to upgrade" : "one-time"}</span>
              </p>
            </div>
            <Link
              href={`/checkout?plan=${p.slug}`}
              className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${
                p.featured ? "bg-brand text-white hover:brightness-110" : "bg-[#18181b] text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
              }`}
            >
              Upgrade to {p.name}
              <ArrowRightIcon className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
      {credit > 0 && <p className="mt-3 text-center text-xs text-muted-foreground">You only pay the difference from your current plan.</p>}
    </div>
  );
}
