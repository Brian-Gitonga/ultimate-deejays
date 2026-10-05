"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardShell, type NavGroup } from "./dashboard-shell";
import { DashboardIcon, DownloadIcon, HandshakeIcon, ImageIcon, LessonIcon, MailIcon, MessageIcon, MicIcon, PencilIcon, PlusIcon, SearchIcon, SettingsIcon, StarIcon, TagIcon, TrophyIcon, UsersIcon, WalletIcon } from "./icons";
import { StudioNotices } from "./studio/studio-notices";

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/studio", label: "Dashboard", icon: DashboardIcon, exact: true }],
  },
  {
    title: "Teaching",
    items: [
      {
        href: "/studio/courses",
        label: "Courses",
        icon: LessonIcon,
        children: [
          { href: "/studio/courses", label: "Manage courses" },
          { href: "/studio/courses/new", label: "Create course" },
        ],
      },
      { href: "/studio/students", label: "Students", icon: UsersIcon },
      { href: "/studio/instructors", label: "Instructors", icon: MicIcon },
      { href: "/studio/feedback", label: "Mix feedback", icon: MessageIcon },
      {
        href: "/studio/challenges",
        label: "Challenges",
        icon: TrophyIcon,
        children: [
          { href: "/studio/challenges", label: "Manage challenges" },
          { href: "/studio/challenges/new", label: "Create challenge" },
        ],
      },
      { href: "/studio/reviews", label: "Reviews", icon: StarIcon },
    ],
  },
  {
    title: "Content",
    items: [
      {
        href: "/studio/blog",
        label: "Blog",
        icon: PencilIcon,
        children: [
          { href: "/studio/blog", label: "Manage posts" },
          { href: "/studio/blog/new", label: "Write a post" },
        ],
      },
      { href: "/studio/store", label: "Store", icon: DownloadIcon },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/studio/earnings", label: "Earnings", icon: WalletIcon },
      { href: "/studio/affiliates", label: "Affiliates", icon: HandshakeIcon },
      { href: "/studio/coupons", label: "Coupons", icon: TagIcon },
      { href: "/studio/subscribers", label: "Subscribers", icon: MailIcon },
      { href: "/studio/media", label: "Media library", icon: ImageIcon },
      { href: "/studio/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

export type StudioCounts = { affiliates: number; mixes: number; reviews: number; notifications: number };

export function StudioShell({ admin, counts, children }: { admin: { name: string; image: string | null }; counts: StudioCounts; children: ReactNode }) {
  // Waiting items next to their section: applications, mixes to review, reviews to answer.
  const badges: Record<string, number> = { "/studio/affiliates": counts.affiliates, "/studio/feedback": counts.mixes, "/studio/reviews": counts.reviews };
  const groups = navGroups.map((g) => ({
    ...g,
    items: g.items.map((item) => (item.href in badges ? { ...item, badge: badges[item.href] ? String(badges[item.href]) : undefined } : item)),
  }));

  return (
    <DashboardShell
      name="Studio"
      homeHref="/studio"
      navGroups={groups}
      notificationsHref="/studio/notifications"
      notificationCount={counts.notifications}
      notices={<StudioNotices />}
      user={{ name: admin.name, image: admin.image, role: "Admin", href: "/account/profile" }}
      headerStart={
        <form role="search" action="/studio/search" className="relative hidden max-w-sm flex-1 md:block">
          <label htmlFor="studio-search" className="sr-only">
            Search your courses and students
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="studio-search"
            name="q"
            type="search"
            placeholder="Search courses, students…"
            className="h-10 w-full rounded-lg border border-border bg-muted/60 pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:bg-background focus:ring-4 focus:ring-brand/15"
          />
        </form>
      }
      headerActions={
        <Link
          href="/studio/courses/new"
          className="hidden h-10 items-center gap-1.5 rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] sm:inline-flex dark:bg-foreground dark:text-background"
        >
          <PlusIcon className="size-4" />
          New course
        </Link>
      }
      sidebarFooter={
        <div className="m-3 rounded-2xl bg-brand-deep p-4 text-white">
          <p className="text-sm font-semibold">Record your next course</p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">Paste YouTube links, add lessons and publish when ready.</p>
          <Link
            href="/studio/courses/new"
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white text-sm font-semibold text-neutral-900 hover:bg-white/90"
          >
            <PlusIcon className="size-4" />
            New course
          </Link>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
