"use client";

import { MoonIcon, SunIcon } from "./icons";

/** `className` sets the button's size and shape (default: a 40px rounded square). */
export function ThemeToggle({ className = "size-10 rounded-lg" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  // Both icons are rendered and CSS picks one, so server and client markup always match.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`inline-flex shrink-0 items-center justify-center text-foreground hover:bg-foreground/5 ${className}`}
    >
      <SunIcon className="size-[1.375rem] dark:hidden" />
      <MoonIcon className="hidden size-5 dark:block" />
    </button>
  );
}
