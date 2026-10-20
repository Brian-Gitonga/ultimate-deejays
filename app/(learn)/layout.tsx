import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

/*
 * Course pages: the site's header (so the menu is the same everywhere), which
 * scrolls away; the player's own course bar then stays pinned at the top.
 */
export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader sticky={false} />
      {children}
    </>
  );
}
