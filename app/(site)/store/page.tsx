import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@/components/icons";
import { StoreBrowser, type StoreFilters } from "@/components/store/store-browser";
import { StoreViewerProvider } from "@/components/store/store-viewer";
import { getStoreResources } from "@/lib/db/store";
import { siteName } from "@/lib/site";
import { storeCategories } from "@/lib/store";

export const metadata: Metadata = {
  title: "Store: DJ practice tracks, sample packs & templates",
  description: `Download practice tracks, sample packs, cue sheets and templates from working DJs at ${siteName}. Free with an account; members get the full library.`,
  alternates: { canonical: "/store" },
  openGraph: { title: `Store | ${siteName}`, url: "/store", siteName, type: "website" },
};

export default async function StorePage({ searchParams }: PageProps<"/store">) {
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const category = one(params.category);
  const initial: StoreFilters = {
    category: storeCategories.some((c) => c.slug === category) ? category : "",
    q: one(params.q).slice(0, 80),
    sort: one(params.sort) === "newest" ? "newest" : "popular",
    free: one(params.free) === "1",
  };
  const picked = ([] as string[]).concat(params.pick ?? []).slice(0, 50);
  const resources = await getStoreResources();

  return (
    <main className="flex-1">
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
          <StoreBrowser resources={resources} initial={initial} picked={picked} now={new Date().getTime()} />
        </StoreViewerProvider>
      </div>
    </main>
  );
}
