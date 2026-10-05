import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CreditCardIcon, SparklesIcon } from "@/components/icons";
import { formatMoney } from "@/lib/checkout";
import { requireViewer } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";
import { paymentMethodLabel } from "@/lib/earnings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Billing" };

const card = "rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10";
/** Orders started in the last two days that are still waiting for payment. */
const recentCutoff = () => new Date(Date.now() - 2 * 86_400_000).toISOString();
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function BillingPage() {
  const viewer = await requireViewer("/account/billing");
  const supabase = await createClient();
  const [settings, payments, pending] = await Promise.all([
    getSiteSettings(),
    // RLS: students only ever see their own.
    supabase.from("payments").select("reference, plan, kind, amount, discount, coupon_code, currency, method, source, status, paid_at, refunded_at").eq("user_id", viewer.id).order("paid_at", { ascending: false }),
    supabase.from("checkouts").select("reference, plan, amount, currency, created_at").eq("user_id", viewer.id).eq("status", "pending").gt("created_at", recentCutoff()),
  ]);

  const planName = (slug: string) => settings.plans.find((p) => p.slug === slug)?.name ?? slug;
  const current = settings.plans.find((p) => p.slug === viewer.plan);
  const next = settings.plans.find((p) => p.slug === (viewer.plan === "warm-up" ? "resident" : viewer.plan === "resident" ? "headliner" : ""));
  const rows = payments.data ?? [];

  return (
    <>
      <section className={card} aria-labelledby="plan-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Your plan</p>
            <h1 id="plan-title" className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {viewer.role === "admin" ? "Admin: every course" : (current?.name ?? viewer.plan)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{viewer.plan === "warm-up" ? "Free forever." : "Paid once, yours for life. Nothing renews."}</p>
          </div>
          {next && viewer.role !== "admin" && (
            <Link
              href={`/checkout?plan=${next.slug}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <SparklesIcon className="size-4" />
              Upgrade to {next.name}
            </Link>
          )}
        </div>
        {current && (
          <ul className="mt-5 grid gap-2 border-t border-border pt-5 text-sm sm:grid-cols-2">
            {current.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-foreground/85">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!!pending.data?.length && (
        <p role="status" className="rounded-xl border border-[#c98200]/30 bg-[#c98200]/[0.07] px-4 py-3 text-sm text-foreground">
          {pending.data.length === 1 ? "An order is" : `${pending.data.length} orders are`} waiting for payment confirmation.{" "}
          <Link href={`/checkout/complete?reference=${pending.data[0].reference}`} className="font-medium text-brand hover:underline">
            Check its status
          </Link>
          . If you closed the payment page, you can start again from the pricing page; you&apos;re only charged once a payment goes through.
        </p>
      )}

      <section className={card} aria-labelledby="history-title">
        <h2 id="history-title" className="text-lg font-semibold text-foreground">
          Payment history
        </h2>
        {rows.length ? (
          <div className="mt-4 -mx-6 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-2.5 font-medium">Date</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Plan</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Paid with</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Order</th>
                  <th scope="col" className="px-6 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.reference}>
                    <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">{date.format(new Date(p.paid_at))}</td>
                    <td className="px-3 py-3 text-foreground">
                      {planName(p.plan)}
                      {p.kind === "upgrade" && <span className="text-muted-foreground"> (upgrade)</span>}
                      {p.coupon_code && <span className="block text-xs text-muted-foreground">Code {p.coupon_code}: −{formatMoney(Number(p.discount), p.currency)}</span>}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{p.source || paymentMethodLabel[p.method]}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{p.reference}</td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <span className="font-semibold text-foreground tabular-nums">{formatMoney(Number(p.amount), p.currency)}</span>
                      {p.status === "refunded" && <span className="block text-xs text-muted-foreground">Refunded {p.refunded_at ? date.format(new Date(p.refunded_at)) : ""}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
              <CreditCardIcon className="size-5" />
            </span>
            <p className="mt-3 font-semibold text-foreground">No payments yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">When you buy or upgrade a plan, your receipts show up here.</p>
            <Link href="/pricing" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              See plans <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Questions about a payment or a refund? Email {settings.general.supportEmail} with the order number.
          {settings.pricing.guaranteeDays > 0 && ` Every paid plan has a ${settings.pricing.guaranteeDays}-day money-back guarantee.`}
        </p>
      </section>
    </>
  );
}
