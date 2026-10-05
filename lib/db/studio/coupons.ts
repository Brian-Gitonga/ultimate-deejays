import "server-only";
import type { Coupon, CouponPlan } from "@/lib/coupons";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/* Studio → Coupons: promo codes with what they've brought in (paid payments that used them). */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function toCoupon(row: Tables<"coupons">, totals?: { revenue: number; discounted: number }): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type as Coupon["discountType"],
    discountValue: Number(row.discount_value),
    plans: row.plans.filter((p): p is CouponPlan => p === "resident" || p === "headliner"),
    maxRedemptions: row.max_redemptions,
    redemptions: row.redemptions,
    oncePerCustomer: row.once_per_customer,
    startsOn: row.starts_at?.slice(0, 10) ?? null,
    endsOn: row.expires_at?.slice(0, 10) ?? null,
    active: row.active,
    revenue: totals?.revenue ?? 0,
    discounted: totals?.discounted ?? 0,
    updatedAt: row.updated_at,
  };
}

export async function getCoupons(client?: Supabase): Promise<Coupon[]> {
  const supabase = client ?? (await createClient());
  const [coupons, payments] = await Promise.all([
    supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    supabase.from("payments").select("coupon_code, amount, discount").eq("status", "paid").neq("coupon_code", ""),
  ]);
  const error = coupons.error ?? payments.error;
  if (error) throw new Error(`Couldn't load coupons: ${error.message}. Run migration 013 (supabase/diagnostics/00_health_check.sql).`);

  const totals = new Map<string, { revenue: number; discounted: number }>();
  for (const p of payments.data ?? []) {
    const t = totals.get(p.coupon_code) ?? { revenue: 0, discounted: 0 };
    t.revenue += Number(p.amount);
    t.discounted += Number(p.discount);
    totals.set(p.coupon_code, t);
  }
  return (coupons.data ?? []).map((row) => toCoupon(row, totals.get(row.code)));
}
