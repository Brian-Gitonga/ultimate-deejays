import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountSidebar } from "@/components/account-sidebar";

// Private pages: keep them out of search results.
export const metadata: Metadata = {
  title: { template: "%s | My account | Ultimate Deejays", default: "My account" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1">
      <div className="site-container grid grid-cols-1 gap-8 pt-6 pb-20 sm:pt-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 lg:pb-28">
        <AccountSidebar />
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </main>
  );
}
