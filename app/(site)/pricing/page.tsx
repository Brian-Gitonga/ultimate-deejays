import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";
import { CheckIcon, CloseIcon, HeadphonesIcon, SparklesIcon, TrophyIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { allowanceHighlights, allowanceLabel, type PlanAllowance } from "@/lib/allowances";
import { getPlanAllowances } from "@/lib/db/allowances";
import { getSiteSettings } from "@/lib/db/settings";
import { currencyName, currencySymbol, moneyFormatter } from "@/lib/money";
import { planBilling, priceSuffix } from "@/lib/plan-tiers";
import { comparison, plans as basePlans, type Plan } from "@/lib/plans";

type Row = (typeof comparison)[number]["rows"][number];
import { siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for online DJ courses. Start free, go monthly with M-Pesa or card (nothing renews by itself), or pay once for Lifetime.",
  alternates: { canonical: "/pricing" },
};

const faqsFor = ({ upgradeCredit, guaranteeDays, lifetime }: { upgradeCredit: boolean; guaranteeDays: number; lifetime: string | null }): FaqItem[] => [
  {
    question: "How do the monthly plans work?",
    answer: `Each payment, by M-Pesa or card, gives you 30 days of your plan. Nothing renews by itself and there's nothing to cancel: when you want another month, renew from your account (paying early adds 30 days on top of the days you have left). If a month runs out, you go back to the free plan until you renew.${
      lifetime ? ` Rather not think about it? ${lifetime} is one payment, for good.` : ""
    }`,
  },
  {
    question: "Can I upgrade later?",
    answer: upgradeCredit
      ? `Any time. Moving up from a monthly plan, the days you haven't used come off the price${lifetime ? `, and ${lifetime} takes off what you've already paid once` : ""}.`
      : "Any time, from the pricing page or any locked lesson.",
  },
  {
    question: "What gear do I need to start?",
    answer:
      "Just a laptop and headphones to begin. Every course lists the exact gear it uses, and the free Warm-Up plan helps you choose your first controller before you spend anything.",
  },
  {
    question: "What if a plan isn't right for me?",
    answer: guaranteeDays
      ? `Paid plans come with a ${guaranteeDays}-day money-back guarantee. If it's not for you, contact us within ${guaranteeDays} days for a full refund.`
      : "Contact us and we'll help you find the right plan before you buy.",
  },
  {
    question: "What's a template edit?",
    answer:
      "No After Effects or Premiere? Open a template with a Request an edit button, tell us your name, socials and colours, and our team sends the finished files to your account (and lets you know when they're ready). Each plan includes a number of edits, shown in the table above.",
  },
  {
    question: "Do you have discount codes?",
    answer:
      "Sometimes. If a DJ or creator sent you here, their code is applied for you at checkout. You can also type a promo code on the checkout page before you pay.",
  },
  {
    question: "Do you offer discounts for students or groups?",
    answer:
      "Yes. DJ schools, youth programs and groups of five or more get special pricing. Get in touch and we'll set you up.",
  },
];

export default async function PricingPage() {
  // Plans, copy, currency and allowances come from Studio → Settings → Pricing.
  const [settings, allowances] = await Promise.all([getSiteSettings(), getPlanAllowances()]);
  const all: Plan[] = settings.plans.map((saved) => ({ ...basePlans.find((p) => p.slug === saved.slug)!, ...saved }));
  // A paid plan priced 0 isn't for sale yet (Lifetime until its price is set): not shown.
  const shown = all.map((p, i) => (p.slug === "warm-up" || p.price > 0 ? i : -1)).filter((i) => i >= 0);
  const plans = shown.map((i) => all[i]);
  const currency = settings.general.currency;
  const price = moneyFormatter(currency);
  const { heading, intro, guaranteeDays, showComparison, upgradeCredit } = settings.pricing;
  // "Less than 7 months of Headliner": a fact from the two prices, not a claim.
  const headlinerPlan = all.find((p) => p.slug === "headliner");
  const lifetimePlan = all.find((p) => p.slug === "lifetime");
  const months = headlinerPlan && lifetimePlan && headlinerPlan.price > 0 ? Math.ceil(lifetimePlan.price / headlinerPlan.price) : 0;
  const lifetimeNote = months >= 2 ? `Less than ${months} months of ${headlinerPlan!.name}` : null;
  const faqs = faqsFor({ guaranteeDays, upgradeCredit, lifetime: plans.find((p) => p.slug === "lifetime")?.name ?? null });
  // Downloads and edits per plan, from the same table the site enforces them with (none before migration 016).
  const allowanceOf = (slug: Plan["slug"]) => allowances.find((a) => a.plan === slug);
  const cell = (a: PlanAllowance | undefined, key: "downloads" | "edits") => (!a ? false : a[key] === 0 ? false : allowanceLabel(a[key], a.period));
  const groups = allowances.length
    ? [
        ...comparison,
        {
          group: "Store & edits",
          rows: [
            { label: "Store downloads", values: all.map((p) => cell(allowanceOf(p.slug), "downloads")) as Row["values"] },
            { label: "Template edits by our team", values: all.map((p) => cell(allowanceOf(p.slug), "edits")) as Row["values"] },
          ],
        },
      ]
    : comparison;
  // Only the columns of the plans on show.
  const table = groups.map((g) => ({ ...g, rows: g.rows.map((r) => ({ ...r, values: shown.map((i) => r.values[i]) })) }));
  const offers = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${siteName} online DJ courses`,
    url: new URL("/pricing", siteUrl).toString(),
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: `${plan.name} plan`,
      price: plan.price.toFixed(2),
      priceCurrency: settings.general.currency,
      availability: "https://schema.org/InStock",
      url: new URL(plan.href, siteUrl).toString(),
    })),
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offers).replace(/</g, "\\u003c") }} />
      <PageHeader title="Pricing" />

      <section aria-labelledby="plans-title" className="site-container -mt-4 pb-16 lg:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-deep dark:text-brand">
            <SparklesIcon className="size-4" />
            Monthly with M-Pesa or card · Nothing auto-renews
          </p>
          <h2 id="plans-title" className="mt-4 text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[2.25rem]">
            {heading}
          </h2>
          <p className="mt-3 text-base text-pretty text-muted-foreground sm:text-[1.0625rem]">{intro}</p>
        </div>

        {/*
          Each card takes four rows of this grid (name, price, button, features) through subgrid,
          so the prices, buttons and feature lists line up across cards whatever the text lengths.
        */}
        <ul className={`mt-14 grid gap-x-6 gap-y-12 ${plans.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3"}`}>
          {plans.map((plan) => (
            // The plan's downloads and edits come from Studio → Settings, after the hand-written lines.
            <PlanCard
              key={plan.slug}
              plan={{ ...plan, highlights: [...plan.highlights, ...allowanceHighlights(allowanceOf(plan.slug))] }}
              currency={currency}
              note={plan.slug === "lifetime" ? lifetimeNote : null}
            />
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {guaranteeDays > 0 && (
            <>
              All paid plans include a <span className="font-semibold text-foreground">{guaranteeDays}-day money-back guarantee</span>.{" "}
            </>
          )}
          Prices in {currencyName(currency)}.
        </p>
      </section>

      {showComparison && (
      <section aria-labelledby="compare-title" className="border-y border-border bg-cream py-16 lg:py-24">
        <div className="site-container">
          <h2 id="compare-title" className="text-center text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
            Compare plans
          </h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Features included in each plan</caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="w-2/5 p-4 font-medium text-muted-foreground sm:p-5">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.slug} scope="col" className="p-4 text-center sm:p-5">
                      <span className="block text-base font-semibold text-foreground">{plan.name}</span>
                      <span className="block font-normal text-muted-foreground">
                        {price(plan.price)}
                        {plan.price > 0 && ` ${priceSuffix(plan.slug)}`}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              {table.map((group) => (
                <tbody key={group.group}>
                  <tr>
                    <th colSpan={plans.length + 1} scope="colgroup" className="bg-muted/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-5">
                      {group.group}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <th scope="row" className="p-4 font-normal text-foreground sm:px-5">
                        {row.label}
                      </th>
                      {row.values.map((value, i) => (
                        <td key={i} className="p-4 text-center sm:px-5">
                          {value === true ? (
                            <CheckIcon className="mx-auto size-5 text-brand" aria-label="Included" role="img" />
                          ) : value === false ? (
                            <CloseIcon className="mx-auto size-4 text-foreground/25" aria-label="Not included" role="img" />
                          ) : (
                            <span className="text-foreground">{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </section>
      )}

      <section aria-labelledby="pricing-faq-title" className="site-container grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
        <div>
          <p className="text-base font-medium text-brand">FAQ</p>
          <h2 id="pricing-faq-title" className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
            Questions about pricing
          </h2>
          <p className="mt-3 text-muted-foreground">
            Still unsure which plan fits?{" "}
            <Link href="/contact" className="font-medium text-brand hover:underline">
              Ask a DJ coach
            </Link>{" "}
            and we&apos;ll point you in the right direction.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Assurance icon={<HeadphonesIcon className="size-5" />} title="Learn at your pace" text="Any device, any time, at your own pace." />
            <Assurance icon={<TrophyIcon className="size-5" />} title={`${guaranteeDays}-day guarantee`} text="Full refund if it's not for you." />
          </div>
        </div>
        <FaqAccordion items={faqs} />
      </section>
    </main>
  );
}

const billingLine = { free: "free forever", monthly: "per month", once: "one-time payment" } as const;

/*
 * One plan: name and tagline, price, button, what's included. The card is a
 * subgrid row-span of the list, so each part sits on the same line as the
 * other cards' (see the list above). The most popular plan's green panel is
 * drawn behind it, a little taller than the card, so it stands out without
 * squeezing anything inside.
 */
function PlanCard({ plan, currency, note }: { plan: Plan; currency: string; note: string | null }) {
  const featured = plan.featured;
  const muted = featured ? "text-white/80" : "text-muted-foreground";
  return (
    <li
      className={`relative isolate row-span-4 grid grid-rows-subgrid gap-y-0 rounded-3xl p-7 xl:p-6 2xl:p-7 ${
        featured
          ? "text-white before:absolute before:inset-x-0 before:-inset-y-4 before:-z-10 before:rounded-3xl before:bg-brand-deep before:shadow-[0_24px_60px_-20px_rgb(0_120_103/0.7)]"
          : "border border-black/[0.06] bg-card shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10"
      }`}
    >
      {featured && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-yellow px-3 py-1 text-xs font-semibold whitespace-nowrap text-neutral-900 shadow-[0_6px_16px_-6px_rgb(0_0_0/0.35)]">
          Most popular
        </span>
      )}

      {/* 1. Name and what it's for */}
      <div>
        <h3 className={`text-xl font-semibold ${featured ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
        <p className={`mt-2 text-[0.9375rem] leading-relaxed text-pretty ${muted}`}>{plan.tagline}</p>
      </div>

      {/* 2. Price, with how it's paid always on the line below. (The size container is here, not on the card: containment would stop the card being a subgrid.) */}
      <div className="@container mt-6">
        <p className={`flex items-baseline gap-1.5 whitespace-nowrap ${featured ? "text-white" : "text-foreground"}`}>
          <span className="text-lg font-semibold">{currencySymbol(currency)}</span>
          {/* Scales with the card, so "10,000" fits a narrow column. */}
          <span className="text-[min(3rem,16cqw)] leading-none font-bold tracking-tight tabular-nums">{plan.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
        </p>
        <p className={`mt-2 text-sm ${muted}`}>{billingLine[planBilling(plan.slug)]}</p>
        {note && <p className={`mt-1 text-sm font-medium ${featured ? "text-white" : "text-brand-deep dark:text-brand"}`}>{note}</p>}
      </div>

      {/* 3. The button */}
      <Link
        href={plan.href}
        className={`mt-6 flex h-12 items-center justify-center self-start rounded-xl px-4 text-[0.9375rem] font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
          featured
            ? "bg-white text-neutral-900 hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-brand-deep"
            : "bg-[#18181b] text-white hover:bg-[#27272a] focus-visible:ring-brand focus-visible:ring-offset-background dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
        }`}
      >
        {plan.cta}
      </Link>

      {/* 4. What's included */}
      <ul className={`mt-8 space-y-3 self-start border-t pt-8 text-[0.9375rem] ${featured ? "border-white/15" : "border-border"}`}>
        {plan.highlights.map((item) => (
          <li key={item} className="flex gap-3">
            <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${featured ? "bg-white/15 text-white" : "bg-brand/10 text-brand"}`}>
              <CheckIcon className="size-3" strokeWidth={3} />
            </span>
            <span className={featured ? "text-white/90" : "text-foreground/85"}>{item}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function Assurance({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">{icon}</span>
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}
