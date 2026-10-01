"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useOptimistic,
  useState,
  useTransition,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { coursesHref, type CourseFilters, type CourseView } from "@/lib/course-filters";

/*
 * Client-side state for the course catalogue. The URL stays the single source
 * of truth and the server does the filtering (so every view is crawlable and
 * the data layer can move to a backend untouched). This layer only makes it
 * feel instant: optimistic filters while the server responds, debounced
 * search, and a grid/list switch that never waits on the network.
 */

type NavigateOptions = {
  /** Replace the history entry instead of adding one (search-as-you-type) */
  replace?: boolean;
  /** Scroll back to the top of the results (pagination, closing the mobile drawer) */
  scrollToResults?: boolean;
  /** The search box is the source of this change, so don't overwrite what's being typed */
  typing?: boolean;
};

type Catalog = {
  /** Current filters, including any change still on its way from the server */
  filters: CourseFilters;
  total: number;
  pageCount: number;
  isPending: boolean;
  searchText: string;
  setSearchText: (text: string) => void;
  navigate: (next: Partial<CourseFilters>, options?: NavigateOptions) => void;
  hrefFor: (next: Partial<CourseFilters>) => string;
  setView: (view: CourseView) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

const CatalogContext = createContext<Catalog | null>(null);

export function useCatalog() {
  const catalog = use(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return catalog;
}

export function scrollToResults() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("catalog")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export function CatalogProvider({
  filters: serverFilters,
  total,
  pageCount,
  children,
}: {
  filters: CourseFilters;
  total: number;
  pageCount: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setViewState] = useState(serverFilters.view);
  const [searchText, setSearchText] = useState(serverFilters.query);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /*
   * Follow URL changes we didn't make (the "Courses" nav link, back/forward).
   * Server responses to our own navigations can arrive while the user is still
   * typing, so `sent` lists the URLs we asked for and their echoes are ignored.
   */
  const serverHref = coursesHref(serverFilters);
  const [seenHref, setSeenHref] = useState(serverHref);
  const [sent, setSent] = useState<string[]>([]);
  if (serverHref !== seenHref) {
    setSeenHref(serverHref);
    if (!sent.includes(serverHref)) {
      setSearchText(serverFilters.query);
      setViewState(serverFilters.view);
      setSent([]);
    } else if (serverHref === sent.at(-1)) {
      setSent([]);
    }
  }

  const [filters, setOptimisticFilters] = useOptimistic<CourseFilters>({ ...serverFilters, view });

  const hrefFor = (next: Partial<CourseFilters>) => coursesHref({ ...filters, page: 1, ...next });

  function navigate(next: Partial<CourseFilters>, options: NavigateOptions = {}) {
    const merged = { ...filters, page: 1, ...next };
    const href = coursesHref(merged);
    if (next.query !== undefined && !options.typing) setSearchText(next.query);
    if (options.scrollToResults) scrollToResults();
    if (href === window.location.pathname + window.location.search) return;

    setSent((urls) => [...urls, href]);
    startTransition(() => {
      setOptimisticFilters(merged);
      if (options.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  // Grid/list is presentation only: swap the layout and the URL, no server round trip.
  function setView(next: CourseView) {
    setViewState(next);
    window.history.replaceState(null, "", coursesHref({ ...filters, view: next }));
  }

  return (
    <CatalogContext
      value={{
        filters,
        total,
        pageCount,
        isPending,
        searchText,
        setSearchText,
        navigate,
        hrefFor,
        setView,
        drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </CatalogContext>
  );
}

/*
 * A real link to the catalogue state `to` describes, so crawlers can follow it
 * and it works without JavaScript; ordinary clicks are handled in place.
 */
export function CatalogLink({
  to,
  options,
  ...props
}: { to: Partial<CourseFilters>; options?: NavigateOptions } & Omit<ComponentProps<typeof Link>, "href" | "onClick">) {
  const { hrefFor, navigate } = useCatalog();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to, options);
  }

  return <Link {...props} href={hrefFor(to)} onClick={onClick} scroll={false} prefetch={false} />;
}

/** The results list: switches between grid and list and dims while new results load. */
export function CatalogResults({ children }: { children: ReactNode }) {
  const { filters, isPending } = useCatalog();
  const list = filters.view === "list";

  return (
    <ul
      data-view={filters.view}
      aria-busy={isPending || undefined}
      className={`grid transition-opacity duration-200 ${
        list ? "grid-cols-1 gap-4 sm:gap-5" : "gap-6 sm:grid-cols-2 xl:grid-cols-3"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {children}
    </ul>
  );
}
