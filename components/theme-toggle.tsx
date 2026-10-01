"use client";

import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
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
      className="inline-flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-foreground/5"
    >
      <SunIcon className="size-[1.375rem] dark:hidden" />
      <MoonIcon className="hidden size-5 dark:block" />
    </button>
  );
}
