import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountCard } from "@/components/account-card";
import { AffiliateApplicationForm } from "@/components/affiliate-application-form";
import { ArrowRightIcon, CheckIcon, ClockIcon, PauseIcon } from "@/components/icons";
import { programTerms as termsFrom } from "@/lib/affiliate-program";
import { requireViewer } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";

export const metadata: Metadata = { title: "Affiliate program" };

const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

const darkButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white transition hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90";

/*
 * The affiliate program from the member's side: apply, then see where the
 * application stands. Approval unlocks the "Affiliate dashboard" button.
 */
export default async function AffiliateProgramPage() {
  const [viewer, settings] = await Promise.all([requireViewer("/account/affiliate"), getSiteSettings()]);
  const application = viewer.affiliate;
  const programTerms = termsFrom(settings);

  return (
    <>
      <div>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">Affiliate program</h1>
        <p className="mt-1 text-muted-foreground">
          Earn {programTerms.commission}% on every plan bought through your link. Paid monthly once you pass ${programTerms.minPayout}.
        </p>
      </div>

      {viewer.role === "admin" ? (
        <AccountCard title="You're an admin">
          <p className="text-[0.9375rem] text-muted-foreground">Admins don&apos;t join the affiliate program. Review applications and partners in the studio.</p>
          <Link href="/studio/affiliates" className={`${darkButton} mt-5`}>
            Manage affiliates <ArrowRightIcon className="size-4" />
          </Link>
        </AccountCard>
      ) : !application && !programTerms.open ? (
        <AccountCard title="Applications are closed">
          <p className="text-[0.9375rem] text-muted-foreground">The affiliate program isn&apos;t taking new applications right now. Check back soon.</p>
        </AccountCard>
      ) : !application ? (
        <>
          <AccountCard title="How it works">
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                ["Apply", "Tell us where you'll share Ultimate Deejays. It takes two minutes."],
                ["Get approved", "We review every application within 2 business days."],
                ["Earn", `Share your link. Anyone who buys within ${programTerms.cookieDays} days earns you ${programTerms.commission}%.`],
              ].map(([title, body], i) => (
                <li key={title} className="rounded-xl bg-muted/60 p-4">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
                  <p className="mt-3 font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-muted-foreground">{programTerms.rules}</p>
          </AccountCard>
          <AccountCard title="Apply to become an affiliate">
            <AffiliateApplicationForm />
          </AccountCard>
        </>
      ) : application.status === "pending" ? (
        <StatusCard icon={<ClockIcon className="size-5" />} tone="amber" title="Application under review">
          We received your application on {date.format(new Date(application.appliedAt))} and will review it within 2 business days. Once you&apos;re
          approved, an &ldquo;Affiliate dashboard&rdquo; button appears in your account.
        </StatusCard>
      ) : application.status === "approved" ? (
        <StatusCard icon={<CheckIcon className="size-5" strokeWidth={2.5} />} tone="brand" title="You're an approved affiliate">
          <span className="block">
            Your referral code is <span className="font-mono font-semibold text-foreground">{application.code}</span> and you earn{" "}
            {application.commission}% on every sale.
          </span>
          <Link href="/affiliate" className={`${darkButton} mt-5`}>
            Go to your affiliate dashboard <ArrowRightIcon className="size-4" />
          </Link>
        </StatusCard>
      ) : application.status === "paused" ? (
        <StatusCard icon={<PauseIcon className="size-5" />} tone="muted" title="Your affiliate account is paused">
          Your link isn&apos;t earning commission right now. {application.note || "Contact us to find out more."}
        </StatusCard>
      ) : (
        <StatusCard icon={<span className="text-lg leading-none">×</span>} tone="red" title="Not approved this time">
          {application.note || "Thanks for applying. Your application wasn't a fit for the program right now."}
        </StatusCard>
      )}
    </>
  );
}

const tones = {
  brand: "bg-brand/10 text-brand-deep dark:text-brand",
  amber: "bg-accent-amber/15 text-amber-700 dark:text-amber-400",
  muted: "bg-foreground/[0.07] text-foreground",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function StatusCard({ icon, tone, title, children }: { icon: ReactNode; tone: keyof typeof tones; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] bg-card p-5 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] sm:p-7 dark:border-white/10">
      <div className="flex gap-4">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <div className="mt-1 text-[0.9375rem] leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    </section>
  );
}
