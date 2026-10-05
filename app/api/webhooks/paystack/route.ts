import { AmountMismatchError, fulfillOrder } from "@/lib/checkout.server";
import { describePayment, verifyPaystackSignature, verifyTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Paystack webhook. Set this URL in Paystack → Settings → API Keys & Webhooks:
 *   <NEXT_PUBLIC_SITE_URL>/api/webhooks/paystack
 * Paystack retries until it gets a 200, so every handler is idempotent (keyed
 * on the reference) and answers quickly.
 *
 * charge.success records the payment, even if the buyer closed the tab before
 * returning to the site. Refunds are marked in Studio → Earnings.
 */

type PaystackEvent = { event: string; data: { reference?: string } & Record<string, unknown> };

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaystackEvent;

  if (event.event === "charge.success" && typeof event.data.reference === "string") {
    const reference = event.data.reference;
    try {
      const admin = createAdminClient();
      const { data: order } = await admin.from("checkouts").select("currency").eq("reference", reference).maybeSingle();
      // Not one of our checkouts (e.g. a payment made in the Paystack dashboard).
      if (!order) return new Response(null, { status: 200 });

      // Ask Paystack directly rather than trusting the event body alone.
      const transaction = await verifyTransaction(reference);
      if (transaction.status !== "success") return new Response(null, { status: 200 });
      if (transaction.currency !== order.currency) {
        await admin.from("checkouts").update({ status: "failed", failure: `Paid in ${transaction.currency}, expected ${order.currency}` }).eq("reference", reference);
        return new Response(null, { status: 200 });
      }
      await fulfillOrder({ reference, ...describePayment(transaction) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[paystack webhook]", message);
      // A wrong amount won't fix itself (the order is marked failed); anything else is worth a retry.
      if (!(error instanceof AmountMismatchError)) return new Response("Try again later", { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
