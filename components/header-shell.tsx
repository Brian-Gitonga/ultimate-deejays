"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const SCROLL_THRESHOLD = 12;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const isScrolled = () => window.scrollY > SCROLL_THRESHOLD;

/*
 * Sticky header that sits flush over the hero, then shrinks into a floating,
 * frosted card once the page scrolls. The outer box keeps a fixed height so
 * the morph never shifts the content below; it ignores pointer events so the
 * transparent strip around the card doesn't block clicks.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="pointer-events-none sticky top-0 z-50 h-20 lg:h-[5.5rem]"
    >
      <div className="site-container h-full">
        <div
          className={`pointer-events-auto relative mx-auto flex items-center justify-between gap-6 border transition-[max-width,height,margin,padding,background-color,border-color,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? "mt-3 h-16 max-w-[73.75rem] rounded-2xl border-black/[0.06] bg-background/80 px-3 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.18)] backdrop-blur-xl sm:px-5 dark:border-white/10 dark:shadow-[0_12px_40px_-12px_rgb(0_0_0/0.7)]"
              : "mt-0 h-20 max-w-full rounded-none border-transparent bg-transparent px-0 lg:h-[5.5rem]"
          }`}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
