/*
 * Promo codes (Studio → Coupons). Buyers type them at checkout; the server
 * checks them in lib/checkout.server.ts. Affiliate referral codes work as
 * codes too, but they live with the affiliate (Studio → Affiliates).
 */

export type CouponPlan = "resident" | "headliner";

export type Coupon = {
  id: string;
  code: string;
  /** Private note: what it's for */
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  /** Plans it works on; empty = every paid plan */
  plans: CouponPlan[];
  /** null = unlimited */
  maxRedemptions: number | null;
  redemptions: number;
  oncePerCustomer: boolean;
  /** YYYY-MM-DD, or null */
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
  /** Paid orders with this code: what buyers paid, and what they saved */
  revenue: number;
  discounted: number;
  updatedAt: string;
};

export type CouponState = "live" | "scheduled" | "expired" | "used-up" | "off";

export function couponState(c: Pick<Coupon, "active" | "startsOn" | "endsOn" | "maxRedemptions" | "redemptions">, today: string): CouponState {
  if (!c.active) return "off";
  if (c.endsOn && c.endsOn < today) return "expired";
  if (c.maxRedemptions !== null && c.redemptions >= c.maxRedemptions) return "used-up";
  if (c.startsOn && c.startsOn > today) return "scheduled";
  return "live";
}

export const couponStateLabel: Record<CouponState, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
  "used-up": "Used up",
  off: "Switched off",
};
