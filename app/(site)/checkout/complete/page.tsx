import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRightIcon, AwardIcon, ClockIcon, CloseIcon } from "@/components/icons";
import { formatMoney } from "@/lib/checkout";
import { AmountMismatchError, fulfillOrder } from "@/lib/checkout.server";
import { requireViewer } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";
import { describePayment, isPaystackConfigured, verifyTransaction } from "@/lib/paystack";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

/*
 * Where Paystack sends buyers after paying (?reference=…). Confirms the
 * payment with Paystack and records it (fulfill_checkout is idempotent, so it
 * doesn't matter whether this page or the webhook gets there first).
 */

const card = "rounded-2xl border border-black/[0.06] bg-card p-8 text-center shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10";
const primary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background";
const secondary = "inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted";

export default async function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const reference = one(params.reference) ?? one(params.trxref);
  if (!reference) redirect("/account/billing");

  await requireViewer(`/checkout/complete?reference=${encodeURIComponent(reference)}`);
  const supabase = await createClient();
  // RLS: buyers only see their own orders.
  const { data: order } = await supabase.from("checkouts").select("*").eq("reference", reference).maybeSingle();
  if (!order) notFound();

  let status: "paid" | "pending" | "failed" = order.status === "paid" ? "paid" : order.status === "pending" ? "pending" : "failed";
  let problem = order.failure;

  if (status === "pending" && isPaystackConfigured()) {
    try {
      const transaction = await verifyTransaction(reference);
      if (transaction.status === "success") {
        if (transaction.currency !== order.currency) {
          status = "failed";
          problem = "The payment came through in a different currency. Contact support and we'll sort it out.";
        } else {
          const paid = describePayment(transaction);
          await fulfillOrder({ reference, ...paid });
          status = "paid";
        }
      } else if (["failed", "abandoned", "reversed"].includes(transaction.status)) {
        status = "failed";
        problem = transaction.status === "abandoned" ? "The payment wasn't finished." : transaction.gateway_response || "The payment didn't go through.";
      }
    } catch (error) {
      console.error("[checkout/complete]", error);
      if (error instanceof AmountMismatchError) {
        status = "failed";
        problem = `The amount paid didn't match this order. Email ${(await getSiteSettings()).general.supportEmail} with order ${reference} and we'll sort it out.`;
      }
      // Otherwise leave it pending: the webhook records it, and "Check again" retries.
    }
  }

  const settings = await getSiteSettings();
  const planName = settings.plans.find((p) => p.slug === order.plan)?.name ?? order.plan;
  const money = (n: number) => formatMoney(n, order.currency);

  return (
    <main className="flex-1">
      <div className="site-container max-w-xl pt-10 pb-24 sm:pt-16">
        {status === "paid" && (
          <div className={card}>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <AwardIcon className="size-8" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome to {planName}!</h1>
            <p className="mt-2 text-muted-foreground">Every course in your plan is unlocked. Pick up where you left off, or start something new.</p>
            <dl className="mx-auto mt-6 max-w-xs space-y-2 rounded-xl bg-muted/60 p-4 text-left text-sm">
              {Number(order.discount) > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
                  <dd className="font-medium text-foreground tabular-nums">−{money(Number(order.discount))}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-semibold text-foreground tabular-nums">{money(Number(order.amount))}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Order</dt>
                <dd className="font-mono text-xs text-foreground">{order.reference}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/account/courses" className={primary}>
                Go to my courses
                <ArrowRightIcon className="size-4" />
              </Link>
              <Link href="/courses" className={secondary}>
                Browse courses
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Your receipt is in <Link href="/account/billing" className="underline underline-offset-2">Billing</Link>. Paystack also emails one.
            </p>
          </div>
        )}

        {status === "pending" && (
          <div className={card}>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent-amber/15 text-accent-amber">
              <ClockIcon className="size-8" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Confirming your payment</h1>
            <p className="mt-2 text-muted-foreground">
              This usually takes a few seconds. Mobile money and bank payments can take a few minutes. You don&apos;t need to pay again.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href={`/checkout/complete?reference=${encodeURIComponent(order.reference)}`} className={primary}>
                Check again
              </Link>
              <Link href="/account/billing" className={secondary}>
                Billing
              </Link>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className={card}>
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-500/10 text-red-600">
              <CloseIcon className="size-8" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">Payment not completed</h1>
            <p className="mt-2 text-muted-foreground">{problem || "The payment didn't go through."}
              {problem?.startsWith("The amount paid") ? "" : " You haven't been charged for this order."}</p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href={`/checkout?plan=${order.plan}${order.coupon_code ? `&code=${order.coupon_code}` : ""}`} className={primary}>
                Try again
              </Link>
              <Link href="/pricing" className={secondary}>
                See plans
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
