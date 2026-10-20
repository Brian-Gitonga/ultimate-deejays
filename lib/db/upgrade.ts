import "server-only";
import type { UpgradeContext } from "@/lib/upgrade";
import { getPlanAllowances } from "./allowances";
import { getSiteSettings } from "./settings";

/** Every plan with its price and allowance, for the upgrade prompt (cached with the settings). */
export async function getUpgradeContext(): Promise<UpgradeContext> {
  const [settings, allowances] = await Promise.all([getSiteSettings(), getPlanAllowances()]);
  return {
    // A paid plan priced 0 isn't for sale (Lifetime until its price is set).
    plans: settings.plans.filter((p) => p.slug === "warm-up" || p.price > 0).map((p) => ({ slug: p.slug, name: p.name, price: p.price, featured: p.featured, allowance: allowances.find((a) => a.plan === p.slug) ?? null })),
    currency: settings.general.currency,
    upgradeCredit: settings.pricing.upgradeCredit,
  };
}
