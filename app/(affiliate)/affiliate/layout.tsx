import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AffiliateShell } from "@/components/affiliate/shell";
import { SIGNED_IN_AFFILIATE } from "@/lib/affiliate-portal";
import { getAffiliateApplications } from "@/lib/affiliates";

// The affiliate portal is private: never index it.
export const metadata: Metadata = {
  title: { template: "%s | Affiliate | Ultimate Deejays", default: "Affiliate Dashboard" },
  robots: { index: false, follow: false },
};

export default function AffiliateLayout({ children }: { children: ReactNode }) {
  // TODO: load the signed-in affiliate from the session; send people who aren't approved yet to the program landing page.
  const a = getAffiliateApplications().find((x) => x.code === SIGNED_IN_AFFILIATE)!;
  return <AffiliateShell affiliate={{ name: a.name, avatar: a.avatar, code: a.code, commission: a.commission }}>{children}</AffiliateShell>;
}
