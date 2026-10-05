"use client";

import Link from "next/link";
import { useSignedIn } from "@/lib/use-signed-in";
import { ArrowRightIcon, UserIcon } from "./icons";

const primary =
  "group h-10 items-center gap-1.5 rounded-full bg-[#18181b] px-4 text-[0.9375rem] font-semibold whitespace-nowrap text-white shadow-[0_6px_16px_-8px_rgb(0_0_0/0.6)] transition hover:bg-[#27272a] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none dark:bg-foreground dark:text-background dark:shadow-none dark:hover:bg-foreground/90";

/*
 * The header's actions: "Log in" (quiet) and "Start free" (the main call to
 * action), or "My account" once signed in. The call to action shows from sm
 * up; on phones it lives in MobileNav's menu.
 */
export function HeaderAuth() {
  const signedIn = useSignedIn();

  if (signedIn) {
    return (
      <Link href="/account/profile" className={`${primary} hidden sm:inline-flex`}>
        <UserIcon className="size-4" />
        My account
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="hidden h-10 items-center rounded-full px-4 text-[0.9375rem] font-medium whitespace-nowrap text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none lg:inline-flex"
      >
        Log in
      </Link>
      <Link href="/sign-up" className={`${primary} hidden sm:inline-flex`}>
        Start free
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </>
  );
}
