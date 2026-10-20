import { announceBootScript, announcementKey, announcementLive } from "@/lib/announcement";
import { getSiteSettings } from "@/lib/db/settings";
import { AnnouncementBar } from "./announcement-bar";
import { HeaderAuth } from "./header-auth";
import { HeaderShell } from "./header-shell";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export type NavLink = { label: string; href: string };

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Lower Thirds", href: "/lower-thirds" },
  { label: "Pricing", href: "/pricing" },
  { label: "Store", href: "/store" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

/*
 * Logo on the left, the links centred, actions on the right. The two sides
 * share the leftover space equally, so the links sit in the middle of the bar.
 * Below lg the links move into the menu button; the main call to action stays
 * visible from sm up.
 */
export async function SiteHeader({ sticky = true }: { sticky?: boolean }) {
  const settings = await getSiteSettings();
  const announcement = settings.announcement;
  const id = announcementKey(announcement);
  const live = announcementLive(announcement, new Date().getTime());

  return (
    <>
      {/* Above the menu, and scrolls away with the page (the menu stays). */}
      {live && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: announceBootScript(id, announcement.endsAt),
            }}
          />
          <AnnouncementBar announcement={announcement} phone={settings.general.phone} id={id} />
        </>
      )}
      <HeaderShell sticky={sticky}>
        <div className="flex min-w-0 flex-1 items-center">
          <Logo size="sm" />
        </div>

        <nav aria-label="Main" className="hidden shrink-0 items-center gap-0.5 lg:flex">
          <NavLinks links={navLinks} />
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1">
          <ThemeToggle className="size-10 rounded-full" />
          <button
            type="button"
            aria-label="Region: United States"
            className="hidden h-9 items-center rounded-full px-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground 2xl:inline-flex"
          >
            US
          </button>
          <HeaderAuth />
          <MobileNav links={navLinks} />
        </div>
      </HeaderShell>
    </>
  );
}
