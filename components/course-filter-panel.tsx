"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { activeFilterCount, type CourseFilters } from "@/lib/course-filters";
import { courseCategories, courseDurations, courseLevels, type CourseCategory } from "@/lib/course-taxonomy";
import type { FacetCounts } from "@/lib/courses";
import { CatalogLink, scrollToResults, useCatalog } from "./course-catalog";
import { CloseIcon, SearchIcon } from "./icons";

type Facets = { categories: FacetCounts; levels: FacetCounts; durations: FacetCounts };

/*
 * The filter sidebar. On large screens it's a sticky panel beside the results;
 * below that it becomes a slide-in drawer opened by the "Filters" button. It's
 * one element either way, so each filter link exists exactly once in the page.
 */
export function CourseFilterPanel({ facets }: { facets: Facets }) {
  const { filters, total, isPending, drawerOpen, setDrawerOpen, navigate } = useCatalog();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeCount = activeFilterCount(filters);

  useEffect(() => {
    if (!drawerOpen) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    document.documentElement.style.overflow = "hidden";

    const onKey = (event: globalThis.KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    // Growing the window into the desktop layout turns the drawer back into a sidebar.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onResize = () => desktop.matches && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);

    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      opener?.focus();
    };
  }, [drawerOpen, setDrawerOpen]);

  // Keep keyboard focus inside the open drawer.
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (!drawerOpen || event.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showResults() {
    setDrawerOpen(false);
    scrollToResults();
  }

  return (
    <aside aria-label="Course filters" className="min-w-0 lg:sticky lg:top-28">
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-[70] bg-neutral-950/40 backdrop-blur-[0.125rem] transition-opacity duration-300 lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        id="course-filters"
        role={drawerOpen ? "dialog" : undefined}
        aria-modal={drawerOpen || undefined}
        aria-labelledby={drawerOpen ? "filters-title" : undefined}
        onKeyDown={trapFocus}
        className={`max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[80] max-lg:flex max-lg:w-[min(22rem,88vw)] max-lg:flex-col max-lg:bg-background max-lg:shadow-2xl max-lg:duration-300 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-2xl lg:border lg:border-black/[0.06] lg:bg-card lg:shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] lg:[scrollbar-width:thin] dark:lg:border-white/10 ${
          // Visible at once when opening (so focus can move in), hidden only after the slide-out ends.
          drawerOpen
            ? "max-lg:transition-[translate]"
            : "max-lg:invisible max-lg:-translate-x-full max-lg:transition-[translate,visibility]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
          <h2 id="filters-title" className="text-lg font-semibold text-foreground">
            Filters
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
            className="flex size-9 items-center justify-center rounded-lg text-foreground hover:bg-foreground/5"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain p-5">
          <CatalogSearch />

          <FilterGroup title="Categories">
            <FilterOption label="All Courses" count={facets.categories.all} active={!filters.category} to={{ category: null }} />
            {(courseCategories as readonly CourseCategory[]).map((category) => (
              <FilterOption
                key={category.slug}
                label={category.name}
                count={facets.categories[category.slug]}
                active={filters.category === category.slug}
                to={{ category: category.slug as CourseFilters["category"] }}
              >
                {category.children && (
                  <ul className="ml-[0.9375rem] border-l border-border pl-3">
                    {category.children.map((child) => (
                      <FilterOption
                        key={child.slug}
                        label={child.name}
                        count={facets.categories[child.slug]}
                        active={filters.category === child.slug}
                        to={{ category: child.slug as CourseFilters["category"] }}
                        small
                      />
                    ))}
                  </ul>
                )}
              </FilterOption>
            ))}
          </FilterGroup>

          <FilterGroup title="Level">
            <FilterOption label="All Levels" count={facets.levels.all} active={!filters.level} to={{ level: null }} nofollow />
            {courseLevels.map((level) => (
              <FilterOption
                key={level.slug}
                label={level.name}
                count={facets.levels[level.slug]}
                active={filters.level === level.slug}
                to={{ level: level.slug }}
                nofollow
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Duration">
            <FilterOption label="Any Length" count={facets.durations.all} active={!filters.duration} to={{ duration: null }} nofollow />
            {courseDurations.map((duration) => (
              <FilterOption
                key={duration.slug}
                label={duration.name}
                count={facets.durations[duration.slug]}
                active={filters.duration === duration.slug}
                to={{ duration: duration.slug }}
                nofollow
              />
            ))}
          </FilterGroup>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4 lg:hidden">
          <button
            type="button"
            disabled={activeCount === 0}
            onClick={() => navigate({ query: "", category: null, level: null, duration: null })}
            className="h-11 rounded-lg px-4 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={showResults}
            className="h-11 flex-1 rounded-lg bg-[#18181b] text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
          >
            {isPending ? "Updating…" : `Show ${total} ${total === 1 ? "course" : "courses"}`}
          </button>
        </div>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-[0.9375rem] font-semibold text-foreground">{title}</h2>
      <ul className="mt-2">{children}</ul>
    </div>
  );
}

function FilterOption({
  label,
  count = 0,
  active,
  to,
  small = false,
  nofollow = false,
  children,
}: {
  label: string;
  count?: number;
  active: boolean;
  to: Partial<CourseFilters>;
  small?: boolean;
  /** Level and duration only re-slice category pages, so crawlers needn't follow them */
  nofollow?: boolean;
  /** Nested options (subcategories) */
  children?: ReactNode;
}) {
  return (
    <li>
      <CatalogLink
        to={to}
        rel={nofollow ? "nofollow" : undefined}
        aria-current={active ? "true" : undefined}
        className={`group/option flex items-center gap-2.5 rounded-lg px-2 transition-colors ${small ? "py-1.5 text-sm" : "py-2 text-[0.9375rem]"} ${
          active ? "bg-brand/10 font-medium text-foreground" : "text-foreground/85 hover:bg-foreground/5 hover:text-foreground"
        } ${count === 0 && !active ? "opacity-45" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-full border transition-colors ${small ? "size-3.5" : "size-4"} ${
            active ? "border-brand" : "border-foreground/25 group-hover/option:border-foreground/45"
          }`}
        >
          {active && <span className={`rounded-full bg-brand ${small ? "size-1.5" : "size-2"}`} />}
        </span>
        <span className="flex-1">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </CatalogLink>
      {children}
    </li>
  );
}

/*
 * Search-as-you-type, debounced. It's also a plain GET form carrying the other
 * active filters, so pressing Enter works before JavaScript loads.
 */
function CatalogSearch() {
  const { filters, searchText, setSearchText, navigate } = useCatalog();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(text: string) {
    setSearchText(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ query: text }, { replace: true, typing: true }), 350);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimeout(timer.current);
    navigate({ query: searchText }, { replace: true, typing: true });
  }

  const carried = { category: filters.category, level: filters.level, duration: filters.duration };

  return (
    <form action="/courses" role="search" onSubmit={onSubmit}>
      {Object.entries(carried).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
      {filters.sort !== "popular" && <input type="hidden" name="sort" value={filters.sort} />}
      {filters.view !== "grid" && <input type="hidden" name="view" value={filters.view} />}
      <label htmlFor="course-search" className="sr-only">
        Search courses
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="course-search"
          name="q"
          type="search"
          value={searchText}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search courses"
          autoComplete="off"
          enterKeyHint="search"
          className="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-10 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => {
              clearTimeout(timer.current);
              navigate({ query: "" });
            }}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}
