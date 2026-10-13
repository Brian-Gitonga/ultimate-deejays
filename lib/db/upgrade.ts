import "server-only";
import type { UpgradeContext } from "@/lib/upgrade";
import { getPlanAllowances } from "./allowances";
import { getSiteSettings } from "./settings";

/** Every plan with its price and allowance, for the upgrade prompt (cached with the settings). */
export async function getUpgradeContext(): Promise<UpgradeContext> {
  const [settings, allowances] = await Promise.all([getSiteSettings(), getPlanAllowances()]);
  return {
    plans: settings.plans.map((p) => ({ slug: p.slug, name: p.name, price: p.price, featured: p.featured, allowance: allowances.find((a) => a.plan === p.slug) ?? null })),
    currency: settings.general.currency,
    upgradeCredit: settings.pricing.upgradeCredit,
  };
}
