"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { logOut } from "@/app/(site)/account/actions";
import { useProfile } from "@/lib/profile-store";
import { LessonIcon, LogOutIcon, MicIcon, SettingsIcon, UserIcon } from "./icons";

const links: { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { href: "/account/courses", label: "My courses", icon: LessonIcon },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/settings", label: "Settings", icon: SettingsIcon },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const [profile] = useProfile();

  return (
    <aside aria-label="Account" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-black/[0.06] bg-card p-5 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10">
        <div className="flex items-center gap-4 lg:flex-col lg:text-center">
          <Image
            src={profile.avatar}
            alt=""
            width={112}
            height={112}
            unoptimized={profile.avatar.startsWith("data:")}
            className="size-16 shrink-0 rounded-full object-cover ring-4 ring-brand/15 lg:size-24"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{profile.fullName}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            {profile.djName && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-deep dark:text-brand">
                <MicIcon className="size-3" />
                {profile.djName}
              </p>
            )}
          </div>
        </div>

        <nav aria-label="Account sections" className="no-scrollbar mt-5 -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col" data-lenis-prevent-horizontal>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium whitespace-nowrap transition ${
                  active ? "bg-brand/10 text-brand-deep dark:text-brand" : "text-foreground/85 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="size-[1.125rem]" />
                {label}
              </Link>
            );
          })}
          <form action={logOut} className="shrink-0">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-foreground/85 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOutIcon className="size-[1.125rem]" />
              Log out
            </button>
          </form>
        </nav>

        <Link
          href="/careers"
          className="mt-5 hidden h-11 items-center justify-center rounded-lg border border-border text-sm font-semibold text-foreground transition hover:bg-muted lg:flex"
        >
          Teach with us
        </Link>
      </div>
    </aside>
  );
}
