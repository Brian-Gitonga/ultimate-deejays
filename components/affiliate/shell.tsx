"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { prettyUrl, referralUrl } from "@/lib/affiliate-links";
import { DashboardShell, type NavGroup } from "../dashboard-shell";
import { ArrowUpRightIcon, DashboardIcon, ImageIcon, LinkIcon, SettingsIcon, UsersIcon, WalletIcon } from "../icons";
import { CopyButton } from "./copy-button";

const navGroups: NavGroup[] = [
  { title: "Overview", items: [{ href: "/affiliate", label: "Dashboard", icon: DashboardIcon, exact: true }] },
  {
    title: "Promote",
    items: [
      { href: "/affiliate/links", label: "Links & code", icon: LinkIcon },
      { href: "/affiliate/resources", label: "Promo files", icon: ImageIcon },
    ],
  },
  {
    title: "Earnings",
    items: [
      { href: "/affiliate/referrals", label: "Referrals", icon: UsersIcon },
      { href: "/affiliate/payouts", label: "Payouts", icon: WalletIcon },
    ],
  },
  { title: "Account", items: [{ href: "/affiliate/settings", label: "Settings", icon: SettingsIcon }] },
];

export function AffiliateShell({ affiliate, children }: { affiliate: { name: string; avatar: string | null; code: string; commission: number }; children: ReactNode }) {
  const link = referralUrl(affiliate.code);
  return (
    <DashboardShell
      name="Affiliate"
      homeHref="/affiliate"
      navGroups={navGroups}
      notificationsHref="/affiliate/referrals"
      user={{ name: affiliate.name, image: affiliate.avatar, role: "Affiliate", href: "/affiliate/settings" }}
      headerStart={
        <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/60 py-1 pr-1 pl-3 md:flex">
          <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-xs text-foreground">{prettyUrl(link)}</span>
          <CopyButton text={link} label="Copy link" className="h-8" />
        </div>
      }
      headerActions={
        <Link href="/" className="hidden h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground/75 hover:bg-foreground/5 hover:text-foreground sm:inline-flex">
          Back to site <ArrowUpRightIcon className="size-4" />
        </Link>
      }
      sidebarFooter={
        <div className="m-3 rounded-2xl bg-brand-deep p-4 text-white">
          <p className="text-xs text-white/70">Your commission</p>
          <p className="text-2xl font-bold tracking-tight">{affiliate.commission}%</p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">On every plan bought through your link. Paid monthly.</p>
          <Link href="/affiliate/settings#program" className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-neutral-900 hover:bg-white/90">
            Program terms
          </Link>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
