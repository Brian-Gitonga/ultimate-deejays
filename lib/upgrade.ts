import type { AllowancePeriod, PlanAllowance, PlanSlug } from "./allowances";

/*
 * The upgrade prompt: when a member taps Download or Request an edit and
 * their plan doesn't allow it (yet), they get a friendly explanation and the
 * plans that would, instead of a refusal. This file decides which plans to
 * offer and what to say; components/upgrade draws it.
 */

export type UpgradePlan = { slug: PlanSlug; name: string; price: number; featured: boolean; allowance: PlanAllowance | null };

/** What the prompt needs from the server: every plan with its price and allowance. */
export type UpgradeContext = { plans: UpgradePlan[]; currency: string; upgradeCredit: boolean };

export type UpgradeReason =
  /** Their plan has no downloads */
  | { kind: "downloads-none" }
  /** They've used them all */
  | { kind: "downloads-used"; limit: number; period: AllowancePeriod; resetsAt: string | null }
  /** Their plan has no edits */
  | { kind: "edits-none" }
  | { kind: "edits-used"; limit: number; period: AllowancePeriod; resetsAt: string | null }
  /** As many requests waiting as their plan allows at once */
  | { kind: "edits-busy"; openLimit: number }
  /** The template belongs to a higher plan */
  | { kind: "template-plan"; plan: PlanSlug };

const RANK: Record<PlanSlug, number> = { "warm-up": 0, resident: 1, headliner: 2 };

/** Taken off an upgrade's price: what their current plan cost, when upgrade credit is on (as at checkout). */
export const upgradeCredit = (context: UpgradeContext, current: PlanSlug) => (context.upgradeCredit ? (context.plans.find((p) => p.slug === current)?.price ?? 0) : 0);

/** Every plan above theirs, cheapest first. */
export const plansAbove = (plans: UpgradePlan[], current: PlanSlug) => plans.filter((p) => RANK[p.slug] > RANK[current]).sort((a, b) => RANK[a.slug] - RANK[b.slug]);

const more = (value: number | null | undefined, than: number) => value === null || value === undefined || value > than;

/** The plans above theirs that would let them do it. */
export function upgradeOptions(plans: UpgradePlan[], current: PlanSlug, reason: UpgradeReason): UpgradePlan[] {
  const above = plans.filter((p) => RANK[p.slug] > RANK[current]);
  switch (reason.kind) {
    case "downloads-none":
      return above.filter((p) => more(p.allowance?.downloads, 0));
    case "downloads-used":
      return above.filter((p) => more(p.allowance?.downloads, reason.limit));
    case "edits-none":
      return above.filter((p) => more(p.allowance?.edits, 0));
    case "edits-used":
      return above.filter((p) => more(p.allowance?.edits, reason.limit));
    case "edits-busy":
      return above.filter((p) => more(p.allowance?.openEdits, reason.openLimit));
    case "template-plan":
      return above.filter((p) => RANK[p.slug] >= RANK[reason.plan]);
  }
}

const day = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", timeZone: "UTC" });
const per = (period: AllowancePeriod) => (period === "month" ? "a month" : "in total");
const names = (list: string[]) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);
const resets = (r: { period: AllowancePeriod; resetsAt: string | null }) =>
  r.period === "month" && r.resetsAt ? ` More arrive on ${day.format(new Date(r.resetsAt))}.` : "";

/** The prompt's heading and words. `plan` is the member's plan name, `options` the plans offered. */
export function upgradeCopy(reason: UpgradeReason, plan: string, options: string[]): { title: string; text: string } {
  const offer = options.length ? ` ${names(options)} ${options.length === 1 ? "includes" : "include"} more.` : "";
  switch (reason.kind) {
    case "downloads-none":
      return { title: "Downloads come with a plan", text: `Your ${plan} plan doesn't include store downloads. Pick a plan to download this and the rest of the library.` };
    case "downloads-used":
      return {
        title: reason.period === "month" ? "You've used this month's downloads" : "You've used your downloads",
        text: `Your ${plan} plan includes ${reason.limit} ${reason.limit === 1 ? "download" : "downloads"} ${per(reason.period)}.${resets(reason)}${offer}`,
      };
    case "edits-none":
      return {
        title: "Let our team edit it for you",
        text: `No editing software? Send us your details and we send back the finished files. Edits aren't part of ${plan}${options.length ? `, but they come with ${names(options)}` : ""}.`,
      };
    case "edits-used":
      return {
        title: reason.period === "month" ? "You've used this month's edits" : "You've used your edits",
        text: `Your ${plan} plan includes ${reason.limit} template ${reason.limit === 1 ? "edit" : "edits"} ${per(reason.period)}.${resets(reason)}${offer}`,
      };
    case "edits-busy":
      return {
        title: `You have ${reason.openLimit} ${reason.openLimit === 1 ? "edit" : "edits"} on the go`,
        text: `Your plan lets you have ${reason.openLimit} ${reason.openLimit === 1 ? "request" : "requests"} open at a time. As soon as one is delivered you can send the next.`,
      };
    case "template-plan":
      return {
        title: `This one is part of ${options[0] ?? "a higher plan"}`,
        text: `Downloads and edits of this template come with ${options.length ? names(options) : "a higher plan"}. Everything in your ${plan} plan stays yours.`,
      };
  }
}
