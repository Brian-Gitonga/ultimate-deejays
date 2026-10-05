"use server";

import { z } from "zod";
import { isUuid, type ActionResult } from "@/lib/action-result";
import type { Coupon } from "@/lib/coupons";
import { toCoupon } from "@/lib/db/studio/coupons";
import { adminAction, must, StudioError } from "@/lib/studio-action";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.").nullable();

const schema = z
  .object({
    code: z.string().regex(/^[A-Z0-9]{3,20}$/, "Codes are 3–20 capital letters or numbers."),
    description: z.string().trim().max(200, "Keep the note to 200 characters."),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().positive("Enter a discount above 0."),
    plans: z.array(z.enum(["resident", "headliner"])),
    maxRedemptions: z.number().int().positive("Use a limit of at least 1, or leave it empty.").nullable(),
    oncePerCustomer: z.boolean(),
    startsOn: day,
    endsOn: day,
    active: z.boolean(),
  })
  .refine((c) => c.discountType !== "percent" || c.discountValue <= 100, "A percentage discount can't be over 100%.")
  .refine((c) => !c.startsOn || !c.endsOn || c.endsOn >= c.startsOn, "The end date must be after the start date.");

/** Creates or updates a promo code. Starts at the beginning of its first day and ends at the end of its last (UTC). */
export async function saveCoupon(coupon: Coupon): Promise<ActionResult<Coupon>> {
  return adminAction("save the coupon", async ({ supabase }) => {
    const parsed = schema.safeParse({ ...coupon, code: coupon.code.toUpperCase().replace(/[^A-Z0-9]/g, "") });
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    const c = parsed.data;
    const values = {
      code: c.code,
      description: c.description,
      discount_type: c.discountType,
      discount_value: Math.round(c.discountValue * 100) / 100,
      plans: c.plans,
      max_redemptions: c.maxRedemptions,
      once_per_customer: c.oncePerCustomer,
      starts_at: c.startsOn ? `${c.startsOn}T00:00:00Z` : null,
      expires_at: c.endsOn ? `${c.endsOn}T23:59:59Z` : null,
      active: c.active,
    };
    const query = isUuid(coupon.id) ? supabase.from("coupons").update(values).eq("id", coupon.id) : supabase.from("coupons").insert(values);
    const { data, error } = await query.select("*").single();
    if (error?.code === "23505") throw new StudioError(`The code ${c.code} is already taken by another coupon or an affiliate.`);
    if (error) throw error;
    return toCoupon(data, { revenue: coupon.revenue, discounted: coupon.discounted });
  });
}

/** Past orders keep the code they used; it just stops working. */
export async function deleteCoupon(id: string): Promise<ActionResult> {
  return adminAction("delete the coupon", async ({ supabase }) => {
    if (isUuid(id)) must(await supabase.from("coupons").delete().eq("id", id));
    return null;
  });
}
