import { planBilling, type PlanSlug } from "./plan-tiers";

/*
 * How a member's plan stands, in words, for the account pages: free,
 * monthly (when it ends, how many days are left, and a way to renew), paid
 * once, or Lifetime.
 */

const DAY = 86_400_000;
/** From this many days left, the account pages remind them to renew. */
export const REMIND_DAYS = 5;

const longDate = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export type PlanStatus = {
  /** "Monthly · ends 12 November 2026 (9 days left)" */
  line: string;
  /** Monthly plans: renew (adds 30 days) */
  renew: { href: string; label: string } | null;
  /** Monthly plan in its last REMIND_DAYS days */
  ending: boolean;
  daysLeft: number | null;
  /** The plan they keep when the month ends, by name */
  after: string | null;
};

export function planStatus(
  viewer: { plan: PlanSlug; basePlan: PlanSlug; planEndsAt: string | null; role: "user" | "admin" },
  plans: { slug: PlanSlug; name: string }[],
  now: number,
): PlanStatus {
  const nameOf = (slug: PlanSlug) => plans.find((p) => p.slug === slug)?.name ?? slug;
  const none = { renew: null, ending: false, daysLeft: null, after: null };
  if (viewer.role === "admin") return { line: "Everything is unlocked for admins.", ...none };
  if (viewer.planEndsAt) {
    const ends = Date.parse(viewer.planEndsAt);
    const daysLeft = Math.max(0, Math.ceil((ends - now) / DAY));
    const left = daysLeft === 0 ? "ends today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
    return {
      line: `Monthly · ends ${longDate.format(ends)} (${left})`,
      renew: { href: `/checkout?plan=${viewer.plan}`, label: `Renew ${nameOf(viewer.plan)}` },
      ending: daysLeft <= REMIND_DAYS,
      daysLeft,
      after: nameOf(viewer.basePlan),
    };
  }
  if (viewer.plan === "warm-up") return { line: "Free forever.", ...none };
  if (planBilling(viewer.plan) === "once") return { line: "Paid once, yours for good. Nothing to renew.", ...none };
  // Bought before plans went monthly: kept for good.
  return { line: "Paid once, yours for good. Nothing to renew.", ...none };
}
