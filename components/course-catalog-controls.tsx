"use client";

import Link from "next/link";
import type { ComponentType, FocusEvent, FormEvent, MouseEvent, SVGProps } from "react";
import { activeFilterCount, coursesHref, type CourseFilters, type CourseView } from "@/lib/course-filters";
import { courseDurations, courseLevels, courseSorts, findTopic, type SortSlug } from "@/lib/course-taxonomy";
import { CatalogLink, useCatalog } from "./course-catalog";
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
} from "./icons";

const cleared: Partial<CourseFilters> = { query: "", category: null, level: null, duration: null };

/** Opens the filter drawer on small screens. */
export function FiltersButton() {
  const { filters, drawerOpen, setDrawerOpen } = useCatalog();
  const count = activeFilterCount(filters);

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-expanded={drawerOpen}
      aria-controls="course-filters"
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-xs transition hover:bg-muted lg:hidden"
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

export function SortSelect() {
  const { filters, navigate } = useCatalog();

  return (
    <div className="relative">
      <label htmlFor="course-sort" className="sr-only">
        Sort courses
      </label>
      <select
        id="course-sort"
        value={filters.sort}
        onChange={(event) => navigate({ sort: event.target.value as SortSlug })}
        className="h-10 cursor-pointer appearance-none rounded-lg border border-border bg-card pr-9 pl-3.5 text-sm font-medium text-foreground shadow-xs transition outline-none hover:border-foreground/25 focus:border-brand focus:ring-4 focus:ring-brand/15 dark:[color-scheme:dark]"
      >
        {courseSorts.map((sort) => (
          <option key={sort.slug} value={sort.slug}>
            {sort.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

const views: { view: CourseView; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { view: "grid", label: "Grid view", icon: GridIcon },
  { view: "list", label: "List view", icon: ListIcon },
];

export function ViewToggle() {
  const { filters, setView } = useCatalog();

  return (
    <div role="group" aria-label="Layout" className="flex gap-1.5">
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
            className={`flex size-10 items-center justify-center rounded-lg border transition ${
              active
                ? "border-[#18181b] bg-[#18181b] text-white dark:border-foreground dark:bg-foreground dark:text-background"
                : "border-border bg-card text-foreground shadow-xs hover:bg-muted"
            }`}
          >
            <Icon className="size-[1.125rem]" />
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
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card pr-2 pl-3 text-sm text-foreground transition hover:border-foreground/30 hover:bg-muted"
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
