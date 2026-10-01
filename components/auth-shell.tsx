import type { ReactNode } from "react";
import { AuthIllustration } from "./auth-illustration";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

/*
 * Split-screen layout for the auth pages: a welcome message and illustration
 * on the left (large screens only), the form on the right.
 */
export function AuthShell({
  tagline,
  subline,
  title,
  description,
  children,
}: {
  /** Large welcome line on the illustration side */
  tagline: string;
  subline: string;
  /** The form's heading (the page's h1) */
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <aside className="relative isolate hidden flex-col items-center justify-center overflow-hidden border-r border-border px-10 py-16 lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_30%_20%,var(--glow-violet),transparent_70%),radial-gradient(50%_45%_at_80%_85%,var(--glow-mint),transparent_70%)]"
        />
        <div className="max-w-md text-center">
          <p className="text-[2.125rem] leading-tight font-bold tracking-tight text-balance text-foreground xl:text-[2.375rem]">
            {tagline}
          </p>
          <p className="mt-3 text-lg text-pretty text-muted-foreground">{subline}</p>
        </div>
        <div className="mt-10 w-full max-w-[32.5rem]">
          <AuthIllustration />
        </div>
      </aside>

      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-[27.5rem] flex-1 flex-col justify-center py-10">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[1.875rem]">{title}</h1>
          <p className="mt-2 text-[0.9375rem] text-pretty text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
