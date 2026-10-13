import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@/components/icons";
import { StoreBrowser } from "@/components/store/store-browser";
import { StoreViewerProvider } from "@/components/store/store-viewer";
import { getStoreResources } from "@/lib/db/store";
import { getUpgradeContext } from "@/lib/db/upgrade";
import { siteName } from "@/lib/site";
import { filtersFromSearch } from "@/lib/store";

export const metadata: Metadata = {
  title: "Store: DJ practice tracks, sample packs & templates",
  description: `Download practice tracks, sample packs, cue sheets and templates from working DJs at ${siteName}. Free with an account; members get the full library.`,
  alternates: { canonical: "/store" },
  openGraph: { title: `Store | ${siteName}`, url: "/store", siteName, type: "website" },
};

export default async function StorePage({ searchParams }: PageProps<"/store">) {
  const { filters, picked } = filtersFromSearch(await searchParams);
  const [resources, upgrade] = await Promise.all([getStoreResources(), getUpgradeContext()]);

  return (
    // Wide: the catalogue uses the whole screen (see data-layout in globals.css).
    <main className="flex-1" data-layout="wide">
      <div className="site-container pt-6 pb-28 sm:pt-10">
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="flex items-center text-foreground transition hover:text-brand">
                <HomeIcon className="size-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li aria-current="page">Store</li>
          </ol>
        </nav>
        <StoreViewerProvider>
          <StoreBrowser resources={resources} initial={filters} picked={picked} now={new Date().getTime()} upgrade={upgrade} />
        </StoreViewerProvider>
      </div>
    </main>
  );
}
