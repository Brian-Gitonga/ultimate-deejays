"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const SCROLL_THRESHOLD = 8;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > SCROLL_THRESHOLD;

/*
 * The site's navigation bar: full width and sticky. At the top of the page it
 * is clear and sits on the hero; once the page scrolls it fades into frosted
 * glass (translucent background, blur, a hairline border and a soft shadow).
 * Only colours and shadows animate, so nothing on the page moves.
 *
 * Its height is fixed (h-20, lg 5.5rem), which the heroes pull up under
 * (-mt-20) so their background shows through at the top.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={`sticky top-0 z-50 h-20 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:h-[5.5rem] ${
        scrolled
          ? "border-black/[0.07] bg-background/70 shadow-[0_8px_32px_-12px_rgb(0_0_0/0.18)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-[#0a0a0a]/65 dark:shadow-[0_8px_32px_-12px_rgb(0_0_0/0.8)]"
          : "border-transparent bg-transparent shadow-none backdrop-blur-none"
      }`}
    >
      <div className="site-container relative flex h-full items-center gap-2">{children}</div>
    </header>
  );
}
