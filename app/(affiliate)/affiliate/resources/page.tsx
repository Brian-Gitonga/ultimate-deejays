import type { Metadata } from "next";
import { PromoLibrary } from "@/components/affiliate/promo-library";
import { StudioPageHeader } from "@/components/studio/ui";
import { brandColors, promoAssets, SIGNED_IN_AFFILIATE, swipeCopy } from "@/lib/affiliate-portal";

export const metadata: Metadata = { title: "Promo files" };

export default function AffiliateResourcesPage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Promo files" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Promo files" }]} />
        <PromoLibrary code={SIGNED_IN_AFFILIATE} assets={promoAssets} copy={swipeCopy} colors={brandColors} />
      </div>
    </main>
  );
}
