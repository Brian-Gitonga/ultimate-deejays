import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CurrencyProvider } from "@/components/money-context";
import { StudioShell, type StudioCounts } from "@/components/studio-shell";
import { displayName, requireAdmin } from "@/lib/dal";
import { getSiteSettings } from "@/lib/db/settings";
import { getUnreadCount } from "@/lib/db/studio/activity";
import { createClient } from "@/lib/supabase/server";

// The studio is private: never index it.
export const metadata: Metadata = {
  title: { template: "%s | Studio | Ultimate Deejays", default: "Admin Studio" },
  robots: { index: false, follow: false },
};

/* Admins only: everyone else is sent back to their account (see lib/dal.ts). */
export default async function StudioLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [affiliates, mixes, reviews, notifications, settings] = await Promise.all([
    supabase.from("affiliate_applications").select("user_id", head).eq("status", "pending"),
    supabase.from("mix_submissions").select("id", head).eq("status", "pending"),
    supabase.from("course_reviews").select("id", head).eq("status", "published").eq("reply", ""),
    getUnreadCount(admin.id, supabase),
    getSiteSettings(),
  ]);
  const counts: StudioCounts = { affiliates: affiliates.count ?? 0, mixes: mixes.count ?? 0, reviews: reviews.count ?? 0, notifications };

  return (
    <StudioShell admin={{ name: displayName(admin), image: admin.profile.avatarUrl }} counts={counts}>
      {/* Money in the studio shows in the store currency, at the prices in Settings. */}
      <CurrencyProvider currency={settings.general.currency} plans={settings.plans.map(({ slug, name, price }) => ({ slug, name, price }))}>
        {children}
      </CurrencyProvider>
    </StudioShell>
  );
}
