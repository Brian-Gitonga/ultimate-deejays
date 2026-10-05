"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { useToggleSetting } from "@/lib/profile-store";
import { BellIcon, CloseIcon, MenuIcon, PanelLeftIcon } from "./icons";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

/*
 * Shared frame for the signed-in dashboards (instructor studio, affiliate
 * portal): collapsible sidebar on desktop, slide-in drawer on phones, and a
 * sticky top bar. Each dashboard supplies its own nav, actions and user.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
  children?: { href: string; label: string }[];
  /** Only active on an exact match (for a section's home page) */
  exact?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

export function DashboardShell({
  name,
  homeHref,
  navGroups,
  user,
  headerStart,
  headerActions,
  sidebarFooter,
  notificationsHref,
  notificationCount,
  notices,
  children,
}: {
  /** Used in labels: "Studio menu", "Studio home" */
  name: string;
  homeHref: string;
  navGroups: NavGroup[];
  user: { name: string; image: string | null; role: string; href: string };
  headerStart?: ReactNode;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  notificationsHref: string;
  /** Unread count on the bell; undefined shows a plain bell */
  notificationCount?: number;
  /** Rendered above the page content (e.g. the studio's error banner) */
  notices?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useToggleSetting(`${name.toLowerCase()}-sidebar-collapsed`, false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the phone drawer on navigation and with Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 shrink-0 items-center ${compact ? "justify-center" : "px-5"}`}>
        {compact ? (
          <Link href={homeHref} aria-label={`${name} home`} className="text-[#037164] dark:text-brand">
            <span aria-hidden="true" className="logo-mark-mask block size-9" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Logo size="xs" />
          </div>
        )}
      </div>

      <nav aria-label={name} className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mt-4 first:mt-2">
            {compact ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border first:hidden" />
            ) : (
              <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">{group.title}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge, children, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      title={compact ? label : undefined}
                      className={`group relative flex h-10 items-center gap-3 rounded-lg text-[0.9375rem] font-medium transition ${
                        compact ? "justify-center" : "px-3"
                      } ${active ? "bg-foreground text-background" : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground"}`}
                    >
                      <Icon className="size-[1.125rem] shrink-0" />
                      {compact ? <span className="sr-only">{label}</span> : <span className="flex-1 truncate">{label}</span>}
                      {badge && (
                        <span
                          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-semibold ${
                            active ? "bg-brand text-white" : "bg-brand/15 text-brand-deep dark:text-brand"
                          } ${compact ? "absolute -top-1 -right-1" : ""}`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                    {children && !compact && pathname.startsWith(href) && (
                      <ul className="mt-0.5 ml-5 space-y-0.5 border-l border-border pl-3">
                        {children.map((child) => {
                          // "Create" children match exactly; the first child covers the rest of the section (list and edit pages).
                          const exactChild = children.some((c) => c.href !== href && pathname === c.href);
                          const childActive = child.href === href ? !exactChild : pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                aria-current={childActive ? "page" : undefined}
                                className={`flex h-9 items-center rounded-lg px-3 text-sm transition ${
                                  childActive ? "bg-foreground/[0.07] font-semibold text-foreground" : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!compact && sidebarFooter}
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-muted/50 dark:bg-background">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-background transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block ${
          collapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        {sidebar(collapsed)}
      </aside>

      {/* Phone/tablet drawer */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-[2px] transition-opacity lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        aria-label={`${name} menu`}
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background shadow-2xl transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          className="absolute top-3.5 right-3 flex size-9 items-center justify-center rounded-lg hover:bg-foreground/5"
        >
          <CloseIcon className="size-5" />
        </button>
        {sidebar(false)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-foreground/5 lg:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className="hidden size-10 items-center justify-center rounded-lg text-foreground/70 hover:bg-foreground/5 hover:text-foreground lg:flex"
          >
            <PanelLeftIcon className="size-5" />
          </button>

          {headerStart}

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {headerActions}
            <ThemeToggle />
            <Link
              href={notificationsHref}
              aria-label={notificationCount ? `Notifications, ${notificationCount} unread` : "Notifications"}
              className="relative flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-foreground/5"
            >
              <BellIcon className="size-5" />
              {!!notificationCount && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-rose px-1 text-[0.625rem] font-bold text-white ring-2 ring-background">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>
            <Link href={user.href} className="ml-1 flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 hover:bg-foreground/5 sm:pr-3">
              <span className="relative">
                {user.image ? (
                  <Image src={user.image} alt="" width={72} height={72} className="size-9 rounded-full object-cover object-top" />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-foreground/[0.08] text-xs font-semibold text-foreground/80">{initials}</span>
                )}
                <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-brand ring-2 ring-background" />
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold text-foreground">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{user.role}</span>
              </span>
            </Link>
          </div>
        </header>

        {notices}
        {children}
      </div>
    </div>
  );
}
