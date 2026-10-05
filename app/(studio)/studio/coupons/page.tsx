import type { Metadata } from "next";
import { connection } from "next/server";
import { CouponManager } from "@/components/studio/coupon-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getSiteSettings } from "@/lib/db/settings";
import { getCoupons } from "@/lib/db/studio/coupons";

export const metadata: Metadata = { title: "Coupons" };

export default async function StudioCouponsPage() {
  // Per request, so "live" and "expired" use today's date.
  await connection();
  const [coupons, settings] = await Promise.all([getCoupons(), getSiteSettings()]);
  const prices = Object.fromEntries(settings.plans.map((p) => [p.slug, { name: p.name, price: p.price }]));
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Coupons" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Coupons" }]} />
        <CouponManager
          seed={coupons}
          today={new Date().toISOString().slice(0, 10)}
          currency={settings.general.currency}
          plans={{ resident: prices.resident, headliner: prices.headliner }}
          affiliateDiscount={settings.affiliates.customerDiscount}
        />
      </div>
    </main>
  );
}
