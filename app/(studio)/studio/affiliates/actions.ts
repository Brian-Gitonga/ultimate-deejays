"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import type { Affiliate } from "@/lib/affiliates";
import { getAffiliate } from "@/lib/db/studio/affiliates";
import { adminAction, must, StudioError } from "@/lib/studio-action";

const schema = z.object({
  status: z.enum(["pending", "approved", "paused", "rejected"]),
  commission: z.number().int().min(0).max(90),
  note: z.string().max(2000),
  code: z.union([z.literal(""), z.string().regex(/^[A-Z0-9]{3,20}$/, "Codes are 3–20 capital letters or numbers.")]),
  paidOut: z.number().min(0),
  customerDiscount: z.number().int().min(0, "Buyer discount must be 0–90%.").max(90, "Buyer discount must be 0–90%.").nullable(),
  leaveRequestedAt: z.string().nullable(),
});

/**
 * Saves an affiliate: status (approve, pause, decline), commission, buyer
 * discount, note and referral code (giving them the code they asked for
 * clears the request). Raising paidOut records an affiliate payout for the
 * difference ("Mark paid"), sent to their payout method. Approving generates
 * a code if there isn't one. Clearing leaveRequestedAt dismisses a request
 * to leave.
 */
export async function saveAffiliate(affiliate: Affiliate): Promise<ActionResult<Affiliate>> {
  return adminAction("update the affiliate", async ({ supabase }) => {
    const parsed = schema.safeParse({ ...affiliate, code: affiliate.code.toUpperCase() });
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    const next = parsed.data;
    const current = await getAffiliate(affiliate.id, supabase);
    if (!current) throw new StudioError("Affiliate not found.");

    const changes: { status?: typeof next.status; commission?: number; note?: string; code?: string | null; customer_discount?: number | null } = {};
    if (next.status !== current.status) changes.status = next.status;
    if (next.commission !== current.commission) changes.commission = next.commission;
    if (next.note !== current.note) changes.note = next.note;
    if (next.code !== current.code) changes.code = next.code || null;
    if (next.customerDiscount !== current.customerDiscount) changes.customer_discount = next.customerDiscount;
    if (Object.keys(changes).length) {
      const { error } = await supabase.from("affiliate_applications").update(changes).eq("user_id", affiliate.id);
      if (error?.code === "23505") throw new StudioError(`The code ${next.code} is already used by another affiliate or promo code.`);
      if (error) throw error;
    }
    if (current.leaveRequestedAt && !next.leaveRequestedAt) {
      must(await supabase.from("affiliate_accounts").update({ leave_requested_at: null }).eq("affiliate_id", affiliate.id));
    }

    const owed = Math.round((next.paidOut - current.paidOut) * 100) / 100;
    if (owed > 0) {
      if (owed > current.earned - current.paidOut + 0.005) throw new StudioError("That's more than the affiliate is owed.");
      const period = new Date().toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      must(await supabase.from("affiliate_payouts").insert({ affiliate_id: affiliate.id, amount: owed, method: current.payoutTo || "Manual", period }));
    }

    const saved = await getAffiliate(affiliate.id, supabase);
    if (!saved) throw new StudioError("Affiliate not found.");
    return saved;
  });
}
