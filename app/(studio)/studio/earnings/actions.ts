"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { PAYMENT_COLUMNS, toPayout, toTransaction } from "@/lib/db/studio/payments";
import type { Payout, Transaction } from "@/lib/earnings";
import { isPaystackConfigured, paystack } from "@/lib/paystack";
import { adminAction, must, StudioError } from "@/lib/studio-action";

/**
 * Refunds a payment. Paid through checkout: Paystack sends the money back to
 * the buyer's card or wallet first (a full refund), then it's marked here.
 * Anything else (demo rows, 100%-off orders, payments made outside checkout)
 * is only marked. Either way the database cancels the affiliate's commission.
 */
export async function refundPayment(transaction: Transaction): Promise<ActionResult<Transaction>> {
  return adminAction("refund the payment", async ({ supabase }) => {
    const { data: current } = await supabase.from("payments").select("status, checkout_id, method, is_demo").eq("reference", transaction.id).maybeSingle();
    if (!current || current.status !== "paid") throw new StudioError("That payment was already refunded or doesn't exist.");
    if (current.checkout_id && current.method !== "free" && !current.is_demo) {
      if (!isPaystackConfigured()) throw new StudioError("Add PAYSTACK_SECRET_KEY to refund through Paystack, or refund it in the Paystack dashboard first.");
      try {
        await paystack("/refund", { body: { transaction: transaction.id } });
      } catch (error) {
        const message = error instanceof Error ? error.message.replace(/^Paystack \/refund failed \(\d+\): /, "") : "no response";
        throw new StudioError(`Paystack couldn't refund it: ${message}`);
      }
    }
    const row = must(
      await supabase.from("payments").update({ status: "refunded" }).eq("reference", transaction.id).eq("status", "paid").select(PAYMENT_COLUMNS).maybeSingle(),
    );
    if (!row) throw new StudioError("That payment was already refunded or doesn't exist.");
    return toTransaction(row as Parameters<typeof toTransaction>[0]);
  });
}

const payoutSchema = z.object({
  amount: z.number().positive("Enter an amount above zero.").max(1_000_000),
  destination: z.string().trim().min(2, "Choose where the money goes.").max(120),
});

/** Records a withdrawal of earnings. It shows as "In transit" until you mark it paid. */
export async function requestPayout(input: { amount: number; destination: string; available: number }): Promise<ActionResult<Payout>> {
  return adminAction("request the payout", async ({ supabase }) => {
    const parsed = payoutSchema.safeParse(input);
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    if (parsed.data.amount > input.available + 0.005) throw new StudioError("That's more than the available balance.");
    const period = new Date().toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    return toPayout(must(await supabase.from("payouts").insert({ ...parsed.data, period, status: "in-transit" }).select("*").single()));
  });
}

/** Marks an in-transit payout as arrived. */
export async function markPayoutPaid(payout: Payout): Promise<ActionResult<Payout>> {
  return adminAction("update the payout", async ({ supabase }) => {
    const today = new Date().toISOString().slice(0, 10);
    return toPayout(must(await supabase.from("payouts").update({ status: "paid", paid_at: today }).eq("id", payout.id).select("*").single()));
  });
}
