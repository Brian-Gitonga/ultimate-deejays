"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";
import { isActive } from "./nav-links";
import type { NavLink } from "./site-header";

export function MobileNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-foreground/5"
      >
        {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-border bg-background p-4 shadow-xl shadow-black/5"
        >
          <nav className="flex flex-col">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 text-base font-medium hover:bg-foreground/5 ${
                    active ? "bg-brand/10 text-brand" : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Link
              href="/sign-up"
              onClick={close}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background text-base font-medium text-foreground hover:bg-foreground/5"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              onClick={close}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-foreground text-base font-medium text-background hover:bg-foreground/90"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
