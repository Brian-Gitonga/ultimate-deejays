import Link from "next/link";
import { HeaderShell } from "./header-shell";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export type NavLink = { label: string; href: string };

const navLinks: NavLink[] = [
  { label: "Courses", href: "/courses" },
  { label: "Challenges", href: "/challenges" },
  { label: "Pricing", href: "/pricing" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

export function SiteHeader() {
  return (
    <HeaderShell>
      <Logo />

      <nav aria-label="Main" className="hidden items-center gap-7 xl:flex">
        <NavLinks links={navLinks} />
      </nav>

      <div className="flex items-center gap-1 sm:gap-2.5">
        <ThemeToggle />
        <button
          type="button"
          aria-label="Region: United States"
          className="hidden h-10 items-center rounded-lg px-2.5 text-base text-foreground hover:bg-foreground/5 sm:inline-flex"
        >
          US
        </button>
        <Link
          href="/sign-up"
          className="hidden h-10 items-center rounded-lg border border-border bg-background px-4 text-base font-medium whitespace-nowrap text-foreground shadow-xs hover:bg-foreground/5 xl:inline-flex"
        >
          Sign up
        </Link>
        <Link
          href="/login"
          className="hidden h-10 items-center rounded-lg bg-[#18181b] px-4 text-base font-medium whitespace-nowrap text-white hover:bg-[#27272a] xl:inline-flex dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
        >
          Log in
        </Link>
        <MobileNav links={navLinks} />
      </div>
    </HeaderShell>
  );
}
