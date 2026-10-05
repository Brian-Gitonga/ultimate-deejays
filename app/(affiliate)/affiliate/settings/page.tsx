import type { Metadata } from "next";
import { AffiliateSettings } from "@/components/affiliate/affiliate-settings";
import { StudioPageHeader } from "@/components/studio/ui";
import { requireAffiliate } from "@/lib/dal";
import { getAffiliatePortal } from "@/lib/db/affiliate-portal";

export const metadata: Metadata = { title: "Settings" };

export default async function AffiliateSettingsPage() {
  const viewer = await requireAffiliate();
  const { affiliate: a, account, program } = await getAffiliatePortal(viewer);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Settings" crumbs={[{ label: "Dashboard", href: "/affiliate" }, { label: "Settings" }]} />
        <AffiliateSettings
          initial={account}
          affiliate={{ code: a.code, commission: a.commission, customerDiscount: a.customerDiscount, avatar: a.avatar, approvedAt: a.approvedAt }}
          program={program}
        />
      </div>
    </main>
  );
}
