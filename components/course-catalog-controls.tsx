"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentType, type FocusEvent, type FormEvent, type MouseEvent, type SVGProps } from "react";
import { activeFilterCount, coursesHref, type CourseFilters, type CourseView } from "@/lib/course-filters";
import { courseDurations, courseLevels, courseSorts, findTopic, type SortSlug } from "@/lib/course-taxonomy";
import { CatalogLink, useCatalog } from "./course-catalog";
import { FILTERS_BUTTON_ID } from "./course-filter-panel";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CloseIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
} from "./icons";

const cleared: Partial<CourseFilters> = { query: "", category: null, level: null, duration: null };

/** Opens the filter drawer on small screens, and brings the folded sidebar back on large ones. */
export function FiltersButton() {
  const { filters, drawerOpen, setDrawerOpen, collapsed, setCollapsed } = useCatalog();
  const count = activeFilterCount(filters);

  return (
    <button
      id={FILTERS_BUTTON_ID}
      type="button"
      onClick={() => (window.matchMedia("(min-width: 64rem)").matches ? setCollapsed(false) : setDrawerOpen(true))}
      aria-expanded={drawerOpen}
      aria-controls="course-filters"
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted ${collapsed ? "" : "lg:hidden"}`}
    >
      <FilterIcon className="size-4" />
      Filters
      {count > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[0.6875rem] font-semibold text-white">
          {count}
          <span className="sr-only"> active</span>
        </span>
      )}
    </button>
  );
}

/*
 * Search-as-you-type, debounced, in the toolbar like the store's. It's also a
 * plain GET form carrying the other active filters, so pressing Enter works
 * before JavaScript loads.
 */
export function CatalogSearch() {
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
    <form action="/courses" role="search" onSubmit={onSubmit} className="relative min-w-[11rem] flex-1 lg:max-w-sm">
      {Object.entries(carried).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
      {filters.sort !== "popular" && <input type="hidden" name="sort" value={filters.sort} />}
      {filters.view !== "grid" && <input type="hidden" name="view" value={filters.view} />}
      <label htmlFor="course-search" className="sr-only">
        Search courses
      </label>
      <input
        id="course-search"
        name="q"
        type="search"
        value={searchText}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search courses"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-full border border-transparent bg-foreground/[0.05] pr-11 pl-5 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:bg-background focus:ring-4 focus:ring-brand/15 dark:bg-white/[0.06] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {searchText ? (
        <button
          type="button"
          onClick={() => {
            clearTimeout(timer.current);
            navigate({ query: "" });
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <CloseIcon className="size-4" />
        </button>
      ) : (
        <SearchIcon className="pointer-events-none absolute top-1/2 right-4 size-[1.125rem] -translate-y-1/2 text-muted-foreground" />
      )}
    </form>
  );
}

/* "Sort by  Most popular ⌄": a native select drawn as a plain text menu, like the store's. */
export function SortSelect() {
  const { filters, navigate } = useCatalog();

  return (
    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <span className="max-sm:sr-only">Sort by</span>
      <span className="relative">
        <select
          value={filters.sort}
          onChange={(event) => navigate({ sort: event.target.value as SortSlug })}
          className="h-9 cursor-pointer appearance-none rounded-md bg-transparent pr-6 pl-1 text-sm font-semibold text-foreground outline-none [field-sizing:content] focus-visible:ring-2 focus-visible:ring-brand/40 dark:[color-scheme:dark]"
        >
          {courseSorts.map((sort) => (
            <option key={sort.slug} value={sort.slug}>
              {sort.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0.5 size-4 -translate-y-1/2 text-foreground" />
      </span>
    </label>
  );
}

const views: { view: CourseView; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { view: "grid", label: "Grid view", icon: GridIcon },
  { view: "list", label: "List view", icon: ListIcon },
];

export function ViewToggle() {
  const { filters, setView } = useCatalog();

  return (
    <div role="group" aria-label="Layout" className="flex items-center gap-0.5 rounded-full bg-foreground/[0.05] p-1 dark:bg-white/[0.06]">
      {views.map(({ view, label, icon: Icon }) => {
        const active = filters.view === view;
        return (
          <Link
            key={view}
            href={coursesHref({ ...filters, view })}
            rel="nofollow"
            scroll={false}
            prefetch={false}
            aria-label={label}
            title={label}
            aria-current={active ? "true" : undefined}
            onClick={(event: MouseEvent) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              setView(view);
            }}
            className={`flex size-8 items-center justify-center rounded-full transition ${
              active ? "bg-background text-foreground shadow-sm dark:bg-white/[0.14]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
          </Link>
        );
      })}
    </div>
  );
}

/** "16 courses", with a spinner while new results load. */
export function ResultCount() {
  const { total, isPending } = useCatalog();

  return (
    <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>
        <span className="font-semibold text-foreground">{total}</span> {total === 1 ? "course" : "courses"}
      </span>
      {isPending && (
        <span
          aria-label="Loading"
          className="size-3.5 animate-spin rounded-full border-2 border-brand/25 border-t-brand motion-reduce:animate-none"
        />
      )}
    </p>
  );
}

/** Removable chips for every active filter. */
export function ActiveFilters() {
  const { filters } = useCatalog();
  const query = filters.query.trim();

  const chips = [
    query && { key: "q", label: `“${query}”`, clear: { query: "" } },
    filters.category && { key: "category", label: findTopic(filters.category)?.topic.name, clear: { category: null } },
    filters.level && { key: "level", label: courseLevels.find((l) => l.slug === filters.level)?.name, clear: { level: null } },
    filters.duration && {
      key: "duration",
      label: courseDurations.find((d) => d.slug === filters.duration)?.name,
      clear: { duration: null },
    },
  ].filter((chip) => !!chip);

  if (!chips.length) return null;

  return (
    <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <CatalogLink
            to={chip.clear}
            rel="nofollow"
            aria-label={`Remove filter: ${chip.label}`}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-sm font-medium text-foreground transition hover:border-foreground/30 hover:bg-foreground/[0.04]"
          >
            {chip.label}
            <CloseIcon className="size-3.5 text-muted-foreground" />
          </CatalogLink>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <CatalogLink to={cleared} rel="nofollow" className="px-1 text-sm font-medium text-brand hover:underline">
            Clear all
          </CatalogLink>
        </li>
      )}
    </ul>
  );
}

export function ClearFiltersLink() {
  return (
    <CatalogLink
      to={cleared}
      className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#18181b] px-4 text-sm font-medium text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
    >
      Clear all filters
    </CatalogLink>
  );
}

/** "Showing 1 to 12 of 16 courses" plus first/previous/page/next/last controls. */
export function CatalogPagination({ page, pageSize, shown }: { page: number; pageSize: number; shown: number }) {
  const { filters, total, pageCount, navigate } = useCatalog();
  const start = (page - 1) * pageSize;
  const go = (target: number) => ({ to: { page: target }, options: { scrollToResults: true } });

  function commitPage(event: FormEvent<HTMLFormElement> | FocusEvent<HTMLInputElement>) {
    event.preventDefault();
    const input =
      event.currentTarget instanceof HTMLFormElement ? event.currentTarget.elements.namedItem("page") : event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const target = Number.parseInt(input.value, 10);
    if (target >= 1 && target <= pageCount && target !== page) navigate({ page: target }, { scrollToResults: true });
    else input.value = String(page);
  }

  return (
    <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start + 1}</span> to{" "}
        <span className="font-semibold text-foreground">{start + shown}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> {total === 1 ? "course" : "courses"}
      </p>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <PageLink label="First page" icon={ChevronsLeftIcon} disabled={page === 1} {...go(1)} />
          <PageLink label="Previous page" icon={ChevronLeftIcon} disabled={page === 1} {...go(page - 1)} />
          <form action="/courses" onSubmit={commitPage} className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            {Object.entries({ q: filters.query.trim(), category: filters.category, level: filters.level, duration: filters.duration })
              .filter(([, value]) => value)
              .map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value!} />
              ))}
            {filters.sort !== "popular" && <input type="hidden" name="sort" value={filters.sort} />}
            {filters.view !== "grid" && <input type="hidden" name="view" value={filters.view} />}
            <label htmlFor="course-page">Page</label>
            <input
              key={page}
              id="course-page"
              name="page"
              type="number"
              inputMode="numeric"
              min={1}
              max={pageCount}
              defaultValue={page}
              onBlur={commitPage}
              className="h-9 w-12 rounded-lg border border-border bg-background text-center text-foreground outline-none [appearance:textfield] focus:border-brand focus:ring-4 focus:ring-brand/15 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span>of {pageCount}</span>
          </form>
          <PageLink label="Next page" icon={ChevronRightIcon} disabled={page === pageCount} {...go(page + 1)} />
          <PageLink label="Last page" icon={ChevronsRightIcon} disabled={page === pageCount} {...go(pageCount)} />
        </nav>
      )}
    </div>
  );
}

function PageLink({
  label,
  icon: Icon,
  disabled,
  to,
  options,
}: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  disabled: boolean;
  to: Partial<CourseFilters>;
  options: { scrollToResults: boolean };
}) {
  const className =
    "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition";

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} opacity-40`}>
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <CatalogLink to={to} options={options} aria-label={label} className={`${className} hover:border-foreground/20 hover:bg-muted`}>
      <Icon className="size-4" />
    </CatalogLink>
  );
}
