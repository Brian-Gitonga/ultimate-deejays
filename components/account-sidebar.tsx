"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { logOut } from "@/app/(site)/account/actions";
import type { AffiliateStatus } from "@/lib/dal";
import { ArrowRightIcon, CreditCardIcon, DashboardIcon, HandshakeIcon, LessonIcon, LogOutIcon, MessageIcon, MicIcon, SettingsIcon, ShieldIcon, SparklesIcon, UserIcon } from "./icons";
import { UserAvatar } from "./user-avatar";

type SidebarUser = {
  fullName: string;
  djName: string;
  email: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  affiliateStatus: AffiliateStatus | null;
  /** Their plan's display name, e.g. "Resident" */
  planName: string;
};

type Section = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

const sections: Section[] = [
  { href: "/account/courses", label: "My courses", icon: LessonIcon },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/settings", label: "Settings", icon: SettingsIcon },
];

// Admins run the site: they review mixes in the studio and don't join the affiliate program.
const studentSections: Section[] = [
  { href: "/account/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/account/mixes", label: "Mix feedback", icon: MessageIcon },
  { href: "/account/affiliate", label: "Affiliate program", icon: HandshakeIcon },
];

/** The big button under the nav: where this person can go beyond their account. */
function dashboardLink(user: SidebarUser) {
  if (user.role === "admin") return { href: "/studio", label: "Admin studio", icon: ShieldIcon };
  if (user.affiliateStatus === "approved") return { href: "/affiliate", label: "Affiliate dashboard", icon: DashboardIcon };
  return null;
}

export function AccountSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const links = user.role === "admin" ? sections : [...sections, ...studentSections];
  const dashboard = dashboardLink(user);

  return (
    <aside aria-label="Account" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-black/[0.06] bg-card p-5 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10">
        <div className="flex items-center gap-4 lg:flex-col lg:text-center">
          <UserAvatar src={user.avatarUrl} name={user.fullName} className="size-16 text-lg ring-4 ring-brand/15 lg:size-24 lg:text-2xl" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{user.fullName}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex flex-wrap gap-1.5 lg:justify-center">
              {user.djName && (
                <p className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-deep dark:text-brand">
                  <MicIcon className="size-3" />
                  {user.djName}
                </p>
              )}
              {user.role !== "admin" && (
                <p className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-0.5 text-xs font-medium text-foreground">
                  <SparklesIcon className="size-3" />
                  {user.planName}
                </p>
              )}
              {user.role === "admin" && (
                <p className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-0.5 text-xs font-medium text-foreground">
                  <ShieldIcon className="size-3" />
                  Admin
                </p>
              )}
              {user.affiliateStatus === "approved" && (
                <p className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.07] px-2.5 py-0.5 text-xs font-medium text-foreground">
                  <HandshakeIcon className="size-3" />
                  Affiliate
                </p>
              )}
            </div>
          </div>
        </div>

        {dashboard && (
          <Link
            href={dashboard.href}
            className="group mt-5 flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18181b] text-sm font-semibold text-white transition hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
          >
            <dashboard.icon className="size-4" />
            {dashboard.label}
            <ArrowRightIcon className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
        )}

        <nav aria-label="Account sections" className="no-scrollbar mt-5 -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium whitespace-nowrap transition ${
                  active ? "bg-brand/10 text-brand-deep dark:text-brand" : "text-foreground/85 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="size-[1.125rem]" />
                {label}
              </Link>
            );
          })}
          <form action={logOut} className="shrink-0">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-foreground/85 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOutIcon className="size-[1.125rem]" />
              Log out
            </button>
          </form>
        </nav>

        {!dashboard && (
          <Link
            href="/careers"
            className="mt-5 hidden h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground transition hover:bg-muted lg:flex"
          >
            Teach with us
          </Link>
        )}
      </div>
    </aside>
  );
}
