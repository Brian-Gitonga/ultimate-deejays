"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSignedIn } from "@/lib/use-signed-in";
import { ArrowRightIcon, CloseIcon, MenuIcon } from "./icons";
import { isActive } from "./nav-links";
import type { NavLink } from "./site-header";

/*
 * The menu button below lg. The panel drops down under the header, inset from
 * the screen edges. It's solid rather than frosted: a blur nested inside the
 * header's own blur lets the page show through.
 */
export function MobileNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();
  const root = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  // Going to another page (back/forward included) closes it.
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(false);
  }

  // Escape, a tap outside the header, or a link elsewhere in the header (the logo, "Start free") closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element;
      const header = root.current?.closest("header");
      if (!header) return;
      if (!header.contains(target) || (target.closest("a") && !root.current?.contains(target))) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06]"
      >
        {open ? <CloseIcon className="size-[1.375rem]" /> : <MenuIcon className="size-[1.375rem]" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-3 top-[calc(100%-0.25rem)] z-50 rounded-3xl sm:inset-x-4 border border-black/[0.06] bg-background p-3 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.3)] dark:border-white/10 dark:bg-[#151515]"
        >
          <nav aria-label="Main" className="flex flex-col">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 text-base font-medium transition-colors ${
                    active ? "bg-brand/10 text-brand-deep dark:text-brand" : "text-foreground hover:bg-foreground/[0.05]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {signedIn ? (
            <div className="mt-2 border-t border-border p-1 pt-3">
              <Link
                href="/account/profile"
                onClick={close}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
              >
                My account
              </Link>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border p-1 pt-3">
              <Link
                href="/login"
                onClick={close}
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background text-base font-medium text-foreground hover:bg-foreground/5"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                onClick={close}
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-foreground text-base font-semibold text-background hover:bg-foreground/90"
              >
                Start free
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
