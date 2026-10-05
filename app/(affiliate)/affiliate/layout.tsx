import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AffiliateShell } from "@/components/affiliate/shell";
import { CurrencyProvider } from "@/components/money-context";
import { displayName, requireAffiliate } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";

// The affiliate portal is private: never index it.
export const metadata: Metadata = {
  title: { template: "%s | Affiliate | Ultimate Deejays", default: "Affiliate Dashboard" },
  robots: { index: false, follow: false },
};

/*
 * Approved affiliates only: everyone else lands on /account/affiliate, which
 * shows how to apply or where their application stands. Each page loads the
 * signed-in affiliate's own numbers (lib/db/affiliate-portal.ts).
 */
export default async function AffiliateLayout({ children }: { children: ReactNode }) {
  const [viewer, settings] = await Promise.all([requireAffiliate(), getSiteSettings()]);
  const { code, commission } = viewer.affiliate;
  return (
    <AffiliateShell affiliate={{ name: displayName(viewer), avatar: viewer.profile.avatarUrl, code: code ?? "", commission }}>
      <CurrencyProvider currency={settings.general.currency} plans={settings.plans.map(({ slug, name, price }) => ({ slug, name, price }))}>
        {children}
      </CurrencyProvider>
    </AffiliateShell>
  );
}
