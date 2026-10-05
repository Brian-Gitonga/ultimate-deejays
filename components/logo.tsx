"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

/*
 * The logo, which is also the way home: it opens the landing page, or on the
 * landing page itself, takes you back to the top. It's the wordmark from
 * public/brand/logo.svg, drawn in the deep green on light pages and the
 * site's bright green on dark ones.
 *
 * Sizes (height; the width follows the logo's proportions):
 *   sm  the header: 40px, 44px from sm up
 *   md  footer and sign-in pages: 48px, 56px from sm up
 *   xs  compact bars (course player, studio sidebar): 36px
 */
const sizes = { xs: "h-9", sm: "h-10 sm:h-11", md: "h-12 sm:h-14" } as const;

export function Logo({ size = "md" }: { size?: keyof typeof sizes }) {
  const pathname = usePathname();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    // Ctrl/Cmd/Shift-click still opens a new tab or window as usual.
    if (pathname !== "/" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.scrollTo({ top: 0 });
  }

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Ultimate Deejays home"
      className="inline-flex shrink-0 items-center rounded-lg focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <span aria-hidden="true" className={`logo-mask block text-[#037164] dark:text-brand ${sizes[size]}`} />
    </Link>
  );
}
