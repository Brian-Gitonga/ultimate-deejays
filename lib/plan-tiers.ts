/*
 * The plans, in order (migrations 020 and 021):
 *
 *   Warm-Up    free
 *   Resident   monthly: each payment gives 30 days
 *   Headliner  monthly: each payment gives 30 days
 *   Lifetime   paid once: everything, for good
 *
 * A higher plan includes everything a lower one does. Courses and store
 * items need at most Headliner, so Lifetime opens everything.
 *
 * Members who bought Resident or Headliner before plans went monthly keep
 * them for good: that's their base plan, the one they go back to when a
 * monthly plan ends.
 */

export type PlanSlug = "warm-up" | "resident" | "headliner" | "lifetime";
/** What a course or store item can require (Lifetime gets everything). */
export type ContentPlan = "warm-up" | "resident" | "headliner";
export type PaidPlan = Exclude<PlanSlug, "warm-up">;

export const PLAN_SLUGS: PlanSlug[] = ["warm-up", "resident", "headliner", "lifetime"];
export const PAID_PLANS: PaidPlan[] = ["resident", "headliner", "lifetime"];
export const isPlanSlug = (value: unknown): value is PlanSlug => PLAN_SLUGS.includes(value as PlanSlug);
export const isPaidPlan = (value: unknown): value is PaidPlan => PAID_PLANS.includes(value as PaidPlan);

export const PLAN_RANK: Record<PlanSlug, number> = { "warm-up": 0, resident: 1, headliner: 2, lifetime: 3 };
/** Whether `plan` includes what `required` does. */
export const includesPlan = (plan: PlanSlug, required: PlanSlug) => PLAN_RANK[plan] >= PLAN_RANK[required];
/** Whether `plan` is above `current` (an upgrade). */
export const isAbove = (plan: PlanSlug, current: PlanSlug) => PLAN_RANK[plan] > PLAN_RANK[current];

export type Billing = "free" | "monthly" | "once";
export const planBilling = (slug: PlanSlug): Billing => (slug === "warm-up" ? "free" : slug === "lifetime" ? "once" : "monthly");
/** Days one monthly payment covers. */
export const MONTH_DAYS = 30;

/** Under the price: "/month", "one-time", "forever". */
export const priceSuffix = (slug: PlanSlug) => ({ free: "forever", monthly: "/month", once: "one-time" })[planBilling(slug)];

/** A course or store item can't usefully need more than Headliner: Lifetime counts as that. */
export const asContentPlan = (plan: PlanSlug): ContentPlan => (plan === "lifetime" ? "headliner" : plan);
