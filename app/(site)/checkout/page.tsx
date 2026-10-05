import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutPayForm } from "@/components/checkout-pay-form";
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon, HandshakeIcon, TagIcon } from "@/components/icons";
import { formatMoney, isPaidPlan, normalizeCode } from "@/lib/checkout";
import { priceOrder } from "@/lib/checkout.server";
import { requireViewer } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";
import { isPaystackConfigured } from "@/lib/paystack";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

const card = "rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10";

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const plan = one(params.plan);
  if (!isPaidPlan(plan)) redirect("/pricing");
  const typedCode = normalizeCode(one(params.code));

  const viewer = await requireViewer(`/checkout?plan=${plan}`);
  const [settings, result] = await Promise.all([getSiteSettings(), priceOrder(viewer, plan, typedCode)]);
  const planSettings = settings.plans.find((p) => p.slug === plan)!;

  if (!result.ok) {
    const next =
      result.reason === "admin"
        ? { href: "/studio", label: "Go to the studio" }
        : result.reason === "owned"
          ? { href: "/account/courses", label: "Go to my courses" }
          : { href: "/pricing", label: "See plans" };
    return (
      <main className="flex-1">
        <div className="site-container max-w-xl pt-10 pb-24 sm:pt-16">
          <div className={`${card} text-center`}>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{result.reason === "owned" ? "You're all set" : "Checkout"}</h1>
            <p className="mt-2 text-muted-foreground">{result.error}</p>
            <Link
              href={next.href}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
            >
              {next.label}
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { quote } = result.priced;
  const money = (n: number) => formatMoney(n, quote.currency);
  const currentPlanName = settings.plans.find((p) => p.slug === viewer.plan)?.name ?? viewer.plan;
  const paymentsReady = quote.total === 0 || isPaystackConfigured();
  const typedApplied = quote.code && !quote.code.automatic;

  return (
    <main className="flex-1">
      <div className="site-container pt-6 pb-20 sm:pt-10 lg:pb-28">
        <Link href="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ChevronLeftIcon className="size-4" />
          Back to plans
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Checkout</h1>
        <p className="mt-1 text-muted-foreground">
          {quote.kind === "upgrade" ? `Upgrade from ${currentPlanName} to ${quote.planName}.` : `Unlock the ${quote.planName} plan.`} One payment, lifetime access.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-8">
          <section aria-labelledby="plan-title" className={card}>
            <p className="text-sm font-medium text-brand">Your plan</p>
            <h2 id="plan-title" className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {quote.planName}
            </h2>
            <p className="mt-1 text-muted-foreground">{planSettings.tagline}</p>
            <ul className="mt-6 space-y-3">
              {planSettings.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.9375rem] text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Access</dt>
                <dd className="mt-0.5 font-semibold text-foreground">Lifetime, no renewals</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Starts</dt>
                <dd className="mt-0.5 font-semibold text-foreground">Straight after payment</dd>
              </div>
              {settings.pricing.guaranteeDays > 0 && (
                <div>
                  <dt className="text-muted-foreground">Guarantee</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{settings.pricing.guaranteeDays}-day money back</dd>
                </div>
              )}
            </dl>
          </section>

          <aside aria-labelledby="summary-title" className={`${card} h-fit lg:sticky lg:top-24`}>
            <h2 id="summary-title" className="text-lg font-semibold text-foreground">
              Order summary
            </h2>
            <dl className="mt-4 space-y-2.5 text-[0.9375rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{quote.planName} plan</dt>
                <dd className="font-medium text-foreground tabular-nums">{money(quote.price)}</dd>
              </div>
              {quote.credit > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Credit for {currentPlanName}</dt>
                  <dd className="font-medium text-foreground tabular-nums">−{money(quote.credit)}</dd>
                </div>
              )}
              {quote.code && quote.discount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Discount <span className="rounded-md bg-brand/10 px-1.5 py-0.5 font-mono text-xs text-brand-deep dark:text-brand">{quote.code.code}</span>{" "}
                    <span className="text-xs">({quote.code.label})</span>
                  </dt>
                  <dd className="font-medium text-brand-deep tabular-nums dark:text-brand">−{money(quote.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="text-xl font-bold text-foreground tabular-nums">{money(quote.total)}</dd>
              </div>
            </dl>

            {quote.referredBy && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand/[0.07] px-3 py-2.5 text-sm text-foreground">
                <HandshakeIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  Referred by <span className="font-semibold">{quote.referredBy}</span>
                  {quote.code?.automatic ? ". Their discount is applied." : "."}
                </span>
              </p>
            )}

            <div className="mt-5 border-t border-border pt-5">
              {typedApplied ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <TagIcon className="size-4 text-brand" />
                    <span className="font-mono font-semibold">{quote.code!.code}</span> applied
                  </span>
                  <Link href={`/checkout?plan=${plan}`} className="font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Remove
                  </Link>
                </div>
              ) : (
                <Form action="/checkout" className="space-y-2">
                  <input type="hidden" name="plan" value={plan} />
                  <label htmlFor="checkout-code" className="text-sm font-medium text-foreground">
                    Have a code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="checkout-code"
                      name="code"
                      defaultValue={typedCode}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={20}
                      placeholder="Promo or referral code"
                      aria-invalid={!!quote.codeError}
                      aria-describedby={quote.codeError ? "checkout-code-error" : undefined}
                      className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm uppercase outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15"
                    />
                    <button type="submit" className="h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
                      Apply
                    </button>
                  </div>
                  {quote.codeError && (
                    <p id="checkout-code-error" className="text-sm text-red-600 dark:text-red-400">
                      {quote.codeError}
                    </p>
                  )}
                </Form>
              )}
            </div>

            <div className="mt-5">
              {!paymentsReady && (
                <p className="mb-3 rounded-lg bg-accent-amber/15 px-3 py-2 text-sm text-foreground">
                  Online payments aren&apos;t switched on yet.
                  {process.env.NODE_ENV === "development" && " Add PAYSTACK_SECRET_KEY to .env.local."}
                </p>
              )}
              <CheckoutPayForm
                plan={plan}
                code={typedApplied ? quote.code!.code : ""}
                total={quote.total}
                label={quote.total > 0 ? `Pay ${money(quote.total)}` : `Get ${quote.planName} free`}
                disabled={!paymentsReady}
              />
              <p className="mt-3 text-center text-xs text-muted-foreground">Signed in as {viewer.email}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
