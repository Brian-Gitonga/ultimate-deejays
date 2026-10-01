"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getAffiliateApplications } from "@/lib/affiliates";
import { useCollection } from "@/lib/studio-store";
import { DashboardShell, type NavGroup } from "./dashboard-shell";
import { DashboardIcon, HandshakeIcon, ImageIcon, LessonIcon, MessageIcon, PencilIcon, PlusIcon, SearchIcon, SettingsIcon, StarIcon, TrophyIcon, UsersIcon, WalletIcon } from "./icons";

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
      { href: "/studio/feedback", label: "Mix feedback", icon: MessageIcon, badge: "7" },
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
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/studio/earnings", label: "Earnings", icon: WalletIcon },
      { href: "/studio/affiliates", label: "Affiliates", icon: HandshakeIcon },
      { href: "/studio/media", label: "Media library", icon: ImageIcon },
      { href: "/studio/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const affiliateSeed = getAffiliateApplications();

export function StudioShell({ instructor, children }: { instructor: { name: string; image: string; specialty: string }; children: ReactNode }) {
  // Show how many affiliate applications are waiting next to "Affiliates".
  const { items: affiliates } = useCollection("affiliates", affiliateSeed);
  const pending = affiliates.filter((a) => a.status === "pending").length;
  const groups = navGroups.map((g) => ({
    ...g,
    items: g.items.map((item) => (item.href === "/studio/affiliates" ? { ...item, badge: pending ? String(pending) : undefined } : item)),
  }));

  return (
    <DashboardShell
      name="Studio"
      homeHref="/studio"
      navGroups={groups}
      notificationsHref="/studio/notifications"
      user={{ name: instructor.name, image: instructor.image, role: "Instructor", href: "/account/profile" }}
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
