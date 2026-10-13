import type { Metadata } from "next";
import { LowerThirdsHero } from "@/components/lower-thirds-hero";
import { StoreBrowser } from "@/components/store/store-browser";
import { StoreViewerProvider } from "@/components/store/store-viewer";
import { getLowerThirds } from "@/lib/db/store";
import { getUpgradeContext } from "@/lib/db/upgrade";
import { siteName } from "@/lib/site";
import { filtersFromSearch } from "@/lib/store";

export const metadata: Metadata = {
  title: "Lower thirds for DJ sets, livestreams & YouTube mixes",
  description: `Download lower thirds for your DJ sets: name straps, title cards and social tags for OBS, Premiere Pro, CapCut and more, from ${siteName}. Free with an account; members get the full library.`,
  alternates: { canonical: "/lower-thirds" },
  openGraph: { title: `Lower thirds | ${siteName}`, url: "/lower-thirds", siteName, type: "website" },
};

/* /lower-thirds: the store's lower thirds (resources with the lower-third switch on), in the same grid as /store. */
export default async function LowerThirdsPage({ searchParams }: PageProps<"/lower-thirds">) {
  const { filters, picked } = filtersFromSearch(await searchParams);
  const [resources, upgrade] = await Promise.all([getLowerThirds(), getUpgradeContext()]);

  return (
    // Wide: the catalogue uses the whole screen (see data-layout in globals.css).
    <main className="flex-1" data-layout="wide">
      <LowerThirdsHero count={resources.length} free={resources.filter((r) => r.access === "warm-up").length} />
      <section id="browse" aria-label="Browse lower thirds" className="site-container scroll-mt-24 pb-28">
        <div className="border-t border-border pt-10 sm:pt-12">
          <StoreViewerProvider>
            <StoreBrowser section="lower-thirds" resources={resources} initial={filters} picked={picked} now={new Date().getTime()} upgrade={upgrade} />
          </StoreViewerProvider>
        </div>
      </section>
    </main>
  );
}
