import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountSidebar } from "@/components/account-sidebar";
import { requireViewer } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";

// Private pages: keep them out of search results.
export const metadata: Metadata = {
  title: { template: "%s | My account | Ultimate Deejays", default: "My account" },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const [viewer, settings] = await Promise.all([requireViewer(), getSiteSettings()]);
  const { profile } = viewer;

  return (
    <main className="flex-1">
      <div className="site-container grid grid-cols-1 gap-8 pt-6 pb-20 sm:pt-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 lg:pb-28">
        <AccountSidebar
          user={{
            fullName: profile.fullName || viewer.email,
            djName: profile.djName,
            email: viewer.email,
            avatarUrl: profile.avatarUrl,
            role: viewer.role,
            affiliateStatus: viewer.affiliate?.status ?? null,
            planName: settings.plans.find((p) => p.slug === viewer.plan)?.name ?? viewer.plan,
          }}
        />
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </main>
  );
}
