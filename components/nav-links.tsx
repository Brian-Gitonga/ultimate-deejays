"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "./site-header";

export const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return links.map((link) => {
    const active = isActive(pathname, link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={`rounded-full px-3.5 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none ${
          active ? "bg-brand/10 text-brand-deep dark:text-brand" : "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground"
        }`}
      >
        {link.label}
      </Link>
    );
  });
}
