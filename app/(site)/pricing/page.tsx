import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaqAccordion, type FaqItem } from "@/components/faq-accordion";
import { CheckIcon, CloseIcon, HeadphonesIcon, SparklesIcon, TrophyIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { comparison, plans, type Plan } from "@/lib/plans";
import { siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple one-time pricing for online DJ courses. Start free, then pay once for lifetime access: no subscriptions, no monthly fees.",
  alternates: { canonical: "/pricing" },
};

const faqs: FaqItem[] = [
  {
    question: "Is it really a one-time payment?",
    answer:
      "Yes. You pay once and keep lifetime access to everything in your plan, including updates to those courses. There are no subscriptions and nothing renews.",
  },
  {
    question: "Can I upgrade later?",
    answer:
      "Any time. You only pay the difference between your current plan and the new one, so moving from Resident to Headliner costs $70.",
  },
  {
    question: "What gear do I need to start?",
    answer:
      "Just a laptop and headphones to begin. Every course lists the exact gear it uses, and the free Warm-Up plan helps you choose your first controller before you spend anything.",
  },
  {
    question: "What if a plan isn't right for me?",
    answer: "Paid plans come with a 30-day money-back guarantee. If it's not for you, contact us within 30 days for a full refund.",
  },
  {
    question: "Do you offer discounts for students or groups?",
    answer:
      "Yes. DJ schools, youth programs and groups of five or more get special pricing. Get in touch and we'll set you up.",
  },
];

const price = (n: number) => (n === 0 ? "$0" : `$${n}`);

export default function PricingPage() {
  const offers = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${siteName} online DJ courses`,
    url: new URL("/pricing", siteUrl).toString(),
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: `${plan.name} plan`,
      price: plan.price.toFixed(2),
      priceCurrency: "USD",
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
            One-time payment · Lifetime access
          </p>
          <h2 id="plans-title" className="mt-4 text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[2.25rem]">
            Pay once. Keep mixing forever.
          </h2>
          <p className="mt-3 text-base text-pretty text-muted-foreground sm:text-[1.0625rem]">
            No subscriptions and no monthly fees. Start free, then unlock the courses you need when you&apos;re ready to
            level up.
          </p>
        </div>

        <ul className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.slug}>
              <PlanCard plan={plan} />
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All paid plans include a <span className="font-semibold text-foreground">30-day money-back guarantee</span>. Prices
          in USD.
        </p>
      </section>

      <section aria-labelledby="compare-title" className="border-y border-border bg-cream py-16 lg:py-24">
        <div className="site-container">
          <h2 id="compare-title" className="text-center text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
            Compare plans
          </h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card" data-lenis-prevent-horizontal>
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
                        {plan.price > 0 && " once"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              {comparison.map((group) => (
                <tbody key={group.group}>
                  <tr>
                    <th colSpan={4} scope="colgroup" className="bg-muted/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:px-5">
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
            <Assurance icon={<HeadphonesIcon className="size-5" />} title="Learn at your pace" text="Lifetime access, on any device." />
            <Assurance icon={<TrophyIcon className="size-5" />} title="30-day guarantee" text="Full refund if it's not for you." />
          </div>
        </div>
        <FaqAccordion items={faqs} />
      </section>
    </main>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.featured;
  return (
    <article
      className={`relative flex h-full flex-col rounded-3xl p-7 sm:p-8 ${
        featured
          ? "bg-brand-deep text-white shadow-[0_24px_60px_-20px_rgb(0_120_103/0.7)] lg:-my-4 lg:py-12"
          : "border border-black/[0.06] bg-card shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10"
      }`}
    >
      {featured && (
        <span className="absolute top-6 right-6 rounded-full bg-accent-yellow px-3 py-1 text-xs font-semibold text-neutral-900">
          Most popular
        </span>
      )}
      <h3 className={`text-xl font-semibold ${featured ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
      <p className={`mt-2 text-[0.9375rem] ${featured ? "text-white/80" : "text-muted-foreground"}`}>{plan.tagline}</p>

      <p className="mt-6 flex items-baseline gap-2">
        <span className={`text-5xl font-bold tracking-tight ${featured ? "text-white" : "text-foreground"}`}>{price(plan.price)}</span>
        <span className={`text-sm ${featured ? "text-white/75" : "text-muted-foreground"}`}>
          {plan.price === 0 ? "forever" : "one-time"}
        </span>
      </p>

      <Link
        href={plan.href}
        className={`mt-7 inline-flex h-12 items-center justify-center rounded-xl text-[0.9375rem] font-semibold transition ${
          featured
            ? "bg-white text-neutral-900 hover:bg-white/90"
            : "bg-[#18181b] text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
        }`}
      >
        {plan.cta}
      </Link>

      <ul className={`mt-8 space-y-3 border-t pt-8 text-[0.9375rem] ${featured ? "border-white/15" : "border-border"}`}>
        {plan.highlights.map((item) => (
          <li key={item} className="flex gap-3">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                featured ? "bg-white/15 text-white" : "bg-brand/10 text-brand"
              }`}
            >
              <CheckIcon className="size-3" strokeWidth={3} />
            </span>
            <span className={featured ? "text-white/90" : "text-foreground/85"}>{item}</span>
          </li>
        ))}
      </ul>
    </article>
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
