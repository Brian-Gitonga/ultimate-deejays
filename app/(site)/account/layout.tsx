import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountSidebar } from "@/components/account-sidebar";
import { requireViewer } from "@/lib/dal";
import { countReadyEdits } from "@/lib/db/edits";
import { getSiteSettings } from "@/lib/db/settings";
import { planStatus } from "@/lib/plan-status";

// Private pages: keep them out of search results.
export const metadata: Metadata = {
  title: { template: "%s | My account | Ultimate Deejays", default: "My account" },
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const [viewer, settings] = await Promise.all([requireViewer(), getSiteSettings()]);
  const { profile } = viewer;
  const readyEdits = viewer.role === "admin" ? 0 : await countReadyEdits(viewer.id);
  const status = planStatus(viewer, settings.plans, new Date().getTime());
  const planName = settings.plans.find((p) => p.slug === viewer.plan)?.name ?? viewer.plan;

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
            readyEdits,
          }}
        />
        <div className="min-w-0 space-y-6">
          {/* A monthly plan in its last days: renew in one tap (nothing renews by itself). */}
          {status.ending && status.renew && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c98200]/30 bg-[#c98200]/[0.07] px-4 py-3 sm:px-5">
              <p className="text-sm text-foreground">
                <span className="font-semibold">
                  Your {planName} plan {status.daysLeft === 0 ? "ends today" : `ends in ${status.daysLeft} ${status.daysLeft === 1 ? "day" : "days"}`}.
                </span>{" "}
                <span className="text-muted-foreground">Renew to keep everything; otherwise you go back to {status.after}.</span>
              </p>
              <Link href={status.renew.href} className="inline-flex h-9 shrink-0 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:brightness-110">
                {status.renew.label}
              </Link>
            </div>
          )}
          {children}
        </div>
      </div>
    </main>
  );
}
