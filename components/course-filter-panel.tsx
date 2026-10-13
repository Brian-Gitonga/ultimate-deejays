"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { activeFilterCount, type CourseFilters } from "@/lib/course-filters";
import { courseCategories, courseDurations, courseLevels, type CourseCategory } from "@/lib/course-taxonomy";
import type { FacetCounts } from "@/lib/courses";
import { CatalogLink, scrollToResults, useCatalog } from "./course-catalog";
import { ChevronDownIcon, ChevronLeftIcon, CloseIcon, FilterIcon } from "./icons";

type Facets = { categories: FacetCounts; levels: FacetCounts; durations: FacetCounts };

export const FILTERS_BUTTON_ID = "course-filters-button";

/*
 * The filter sidebar, drawn like the one on /store. On large screens it's a
 * sticky panel beside the results that the arrow folds away; below that it
 * becomes a slide-in drawer opened by the "Filters" button. It's one element
 * either way, so each filter link exists exactly once in the page.
 */
export function CourseFilterPanel({ facets }: { facets: Facets }) {
  const { filters, total, isPending, drawerOpen, setDrawerOpen, collapsed, setCollapsed, navigate } = useCatalog();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeCount = activeFilterCount(filters);
  const clearAll = () => navigate({ query: "", category: null, level: null, duration: null });

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
    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input")].filter((el) => el.offsetParent !== null);
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

  function collapse() {
    setCollapsed(true);
    // The fold button goes with the sidebar, so focus moves to the button that brings it back.
    requestAnimationFrame(() => document.getElementById(FILTERS_BUTTON_ID)?.focus());
  }

  function showResults() {
    setDrawerOpen(false);
    scrollToResults();
  }

  return (
    <aside aria-label="Course filters" className={`min-w-0 lg:sticky lg:top-28 ${collapsed ? "lg:hidden" : ""}`}>
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-[70] bg-neutral-950/40 transition-opacity duration-300 lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div
        ref={panelRef}
        id="course-filters"
        role={drawerOpen ? "dialog" : undefined}
        aria-modal={drawerOpen || undefined}
        aria-labelledby="filters-title"
        onKeyDown={trapFocus}
        className={`max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-[80] max-lg:flex max-lg:w-[min(22rem,88vw)] max-lg:flex-col max-lg:bg-background max-lg:shadow-2xl max-lg:duration-300 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-xl lg:border lg:border-border lg:bg-card lg:[scrollbar-width:thin] ${
          // Visible at once when opening (so focus can move in), hidden only after the slide-out ends.
          drawerOpen ? "max-lg:transition-[translate]" : "max-lg:invisible max-lg:-translate-x-full max-lg:transition-[translate,visibility]"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-foreground/[0.06] text-foreground">
            <FilterIcon className="size-4" />
          </span>
          <h2 id="filters-title" className="flex-1 text-base font-semibold text-foreground">
            Filters
          </h2>
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="text-sm font-medium text-brand hover:underline max-lg:hidden">
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={collapse}
            aria-label="Hide filters"
            title="Hide filters"
            className="hidden size-8 items-center justify-center rounded-lg text-foreground hover:bg-foreground/[0.06] lg:flex"
          >
            <ChevronLeftIcon className="size-[1.125rem]" />
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
            className="flex size-9 items-center justify-center rounded-lg text-foreground hover:bg-foreground/5 lg:hidden"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="px-5 py-2 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain">
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
            onClick={clearAll}
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

/* A section that folds open and shut. Folded links stay in the page (hidden), so crawlers still find them. */
function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const regionId = useId();
  return (
    <section className="border-b border-border py-4 last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md text-[0.9375rem] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {title}
          <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      <ul id={regionId} hidden={!open} className="mt-2">
        {children}
      </ul>
    </section>
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
