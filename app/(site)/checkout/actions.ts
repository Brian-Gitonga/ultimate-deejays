"use server";

import { redirect } from "next/navigation";
import { isPaidPlan } from "@/lib/checkout";
import { fulfillOrder, newReference, priceOrder } from "@/lib/checkout.server";
import { requireViewer } from "@/lib/dal";
import { initializeTransaction, isPaystackConfigured } from "@/lib/paystack";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { withDetail } from "@/lib/supabase/errors";

/*
 * Places an order. The price is worked out again here (never taken from the
 * browser), saved as a checkout row, and then:
 *   total 0 (a 100%-off code) → fulfilled straight away
 *   otherwise                 → off to Paystack, back to /checkout/complete
 * The payment itself is recorded by fulfill_checkout() once Paystack confirms
 * it (on the return page and by the webhook, whichever comes first).
 */

export type CheckoutState = { error: string | null };

export async function startCheckout(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const plan = formData.get("plan");
  if (!isPaidPlan(plan)) return { error: "Choose a plan first." };
  const viewer = await requireViewer(`/checkout?plan=${plan}`);

  const result = await priceOrder(viewer, plan, String(formData.get("code") ?? ""));
  if (!result.ok) return { error: result.error };
  const { quote, order } = result.priced;

  // The total they saw must still be the total (a code may have run out meanwhile).
  const shown = Number(formData.get("total"));
  if (!Number.isFinite(shown) || Math.abs(shown - quote.total) > 0.005) {
    return { error: "The price changed since this page loaded. Refresh the page to see the new total." };
  }
  if (quote.total > 0 && !isPaystackConfigured()) {
    return { error: "Online payments aren't switched on yet. Please try again later." };
  }

  const admin = createAdminClient();
  const reference = newReference();
  const { data: checkout, error } = await admin
    .from("checkouts")
    .insert({
      reference,
      user_id: viewer.id,
      plan,
      kind: quote.kind,
      list_price: Math.round((quote.price - quote.credit) * 100) / 100,
      discount: quote.discount,
      amount: quote.total,
      currency: quote.currency,
      coupon_code: order.couponCode,
      coupon_id: order.couponId,
      affiliate_id: order.affiliateId,
      commission_rate: order.commissionRate,
      ref_sub: order.refSub,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[startCheckout]", error);
    // "relation public.checkouts does not exist" = migration 013 hasn't been run.
    return { error: withDetail("We couldn't start your order. Please try again.", error) };
  }

  if (quote.total === 0) {
    try {
      await fulfillOrder({ reference, amount: 0, fee: 0, method: "free", source: `Code ${order.couponCode}`, country: "", paidAt: null });
    } catch (fulfillError) {
      console.error("[startCheckout] free order", fulfillError);
      return { error: "We couldn't complete your order. Please try again." };
    }
    redirect(`/checkout/complete?reference=${reference}`);
  }

  let paymentPage: string;
  try {
    const transaction = await initializeTransaction({
      email: viewer.email,
      amount: quote.total,
      currency: quote.currency,
      reference,
      callbackUrl: `${siteUrl}/checkout/complete`,
      metadata: { checkout_id: checkout.id, plan, user_id: viewer.id, cancel_action: `${siteUrl}/checkout?plan=${plan}` },
    });
    paymentPage = transaction.authorization_url;
  } catch (paystackError) {
    const detail = paystackError instanceof Error ? paystackError.message : String(paystackError);
    console.error("[startCheckout] Paystack", detail);
    await admin.from("checkouts").update({ status: "failed", failure: detail.slice(0, 500) }).eq("id", checkout.id);
    const hint = process.env.NODE_ENV === "development" ? ` [${detail}]` : "";
    return { error: `We couldn't reach the payment page. Please try again in a moment.${hint}` };
  }
  redirect(paymentPage);
}
