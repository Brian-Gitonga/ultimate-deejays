/*
 * Checkout shapes shared by the server (lib/checkout.server.ts, which does
 * the pricing) and the checkout pages. Nothing here decides a price: the
 * server works the total out again on every step.
 */

import type { PaidPlan } from "./plan-tiers";

export { PAID_PLANS, isAbove, isPaidPlan, type PaidPlan, type PlanSlug } from "./plan-tiers";

/** What buyers type: "djkaya " → "DJKAYA". Promo and affiliate codes are A–Z and 0–9. */
export const normalizeCode = (value: string | null | undefined) =>
  (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);

export type AppliedCode = {
  code: string;
  /** coupon = a promo code from Studio → Coupons; affiliate = an affiliate's referral code */
  kind: "coupon" | "affiliate";
  /** "20% off", "$10 off" */
  label: string;
  /** Applied for them because they came through the affiliate's link */
  automatic: boolean;
};

export type Quote = {
  plan: PaidPlan;
  planName: string;
  /** renewal = the monthly plan they're on, again (30 more days) */
  kind: "purchase" | "upgrade" | "renewal";
  /** monthly (Resident, Headliner) or once (Lifetime) */
  billing: "monthly" | "once";
  /** Monthly plans: the date it runs to once paid; null for Lifetime */
  accessUntil: string | null;
  currency: string;
  /** The plan's price */
  price: number;
  /** Taken off (Settings → Pricing → upgrade credit): unused days of a monthly plan, and for Lifetime what they paid once before */
  credit: number;
  /** What the credit is for, e.g. "Unused days of Resident" */
  creditLabel: string;
  discount: number;
  /** What they pay */
  total: number;
  code: AppliedCode | null;
  /** Why a typed code wasn't applied */
  codeError: string | null;
  /** The affiliate who referred them, shown as "Referred by …" */
  referredBy: string | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Percent or fixed discount on an amount, never more than the amount. */
export function discountOf(amount: number, type: "percent" | "fixed", value: number) {
  const off = type === "percent" ? (amount * value) / 100 : value;
  return round2(Math.min(Math.max(off, 0), amount));
}

export { formatMoney } from "./money";
