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
        className={`text-base transition-colors hover:text-brand ${active ? "font-medium text-brand" : "text-foreground"}`}
      >
        {link.label}
      </Link>
    );
  });
}
