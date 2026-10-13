"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { left } from "@/lib/allowances";
import {
  addedRanges,
  canDownload,
  categoryName,
  downloadHref,
  fileKind,
  fileKinds,
  formatBadge,
  formatSize,
  noFilters,
  planLabel,
  resourcePath,
  storeCategories,
  type StoreFilters,
  type StoreResource,
} from "@/lib/store";
import type { UpgradeContext } from "@/lib/upgrade";
import { CheckIcon, ChevronDownIcon, CloseIcon, DownloadIcon, FilterIcon, LockIcon, SearchIcon, StarIcon } from "../icons";
import { UpgradeDialog } from "../upgrade/upgrade-dialog";
import { UserAvatar } from "../user-avatar";
import { downloadBlock, limitedAllowance, useLimitBounce } from "./download-limit";
import { DownloadStateIcon, useDownload } from "./download-progress";
import { StoreCover } from "./store-cover";
import { StoreFilterPanel } from "./store-filters";
import { accessFor, useRefreshStoreViewer, useStoreViewer } from "./store-viewer";

export type { StoreFilters };

/* The grid runs both /store and /lower-thirds (which has its own hero, so its heading is an h2). */
export type StoreSection = "store" | "lower-thirds";

const sections = {
  store: {
    path: "/store",
    heading: "h1",
    title: "Store",
    intro: "Practice tracks, sample packs, cue sheets and templates from working DJs. Free ones download with a free account; members get the rest.",
    search: "Search downloads",
    one: "download",
    many: "downloads",
    emptyTitle: "New downloads are on the way",
    emptyText: "Practice tracks, sample packs and templates will appear here soon.",
  },
  "lower-thirds": {
    path: "/lower-thirds",
    heading: "h2",
    title: "All lower thirds",
    intro: "Tick a few to download them together as one ZIP.",
    search: "Search lower thirds",
    one: "lower third",
    many: "lower thirds",
    emptyTitle: "New lower thirds are on the way",
    emptyText: "Name straps, title cards and social tags will appear here soon.",
  },
} as const;

const DAY = 86_400_000;

type Facet = "category" | "type" | "free";

/** Whether a resource passes the filters. `except` leaves one filter out, to count that filter's options. */
function matches(r: StoreResource, f: StoreFilters, now: number, except?: Facet) {
  if (except !== "category" && f.category && r.category !== f.category) return false;
  if (except !== "type" && f.type && !r.files.some((file) => fileKind(file) === f.type)) return false;
  if (except !== "free" && f.free && r.access !== "warm-up") return false;
  const range = addedRanges.find((a) => a.slug === f.added);
  if (range && Date.parse(r.publishedAt) < now - range.days * DAY) return false;
  const q = f.q.trim().toLowerCase();
  return !q || [r.title, r.description, r.creator.name, categoryName(r.category), ...r.files.map((x) => x.name)].some((t) => t.toLowerCase().includes(q));
}

type Chip = { key: string; label: string; clear: Partial<StoreFilters> };

/*
 * Columns as the screen grows (the page is full width, so covers get bigger
 * before another column is added): two beside the sidebar on small laptops,
 * three on desktops, four on very large screens; one more with the sidebar
 * folded away. `sizes` tells the browser how wide each cover is drawn.
 */
const grid = {
  open: "xl:grid-cols-3 min-[140rem]:grid-cols-4",
  collapsed: "lg:grid-cols-3 xl:grid-cols-4 min-[140rem]:grid-cols-5",
};
const sizes = {
  open: "(min-width: 140rem) 21vw, (min-width: 80rem) 27vw, (min-width: 64rem) 34vw, (min-width: 40rem) 46vw, 92vw",
  collapsed: "(min-width: 140rem) 19vw, (min-width: 80rem) 24vw, (min-width: 64rem) 31vw, (min-width: 40rem) 46vw, 92vw",
};

/*
 * /store and /lower-thirds: a filter sidebar beside a tight grid of covers,
 * laid out like the big template libraries. With a mouse, a cover shows its
 * title, details and a download button on hover; on touch screens the title
 * sits on the cover all the time. Filtering, search and sorting run in the
 * browser (the whole catalogue is on the page) and are kept in the URL so a
 * filtered view can be shared. Tick several covers to download them as one ZIP.
 */
export function StoreBrowser({
  resources,
  initial,
  picked: initialPicked = [],
  now,
  section = "store",
  upgrade,
}: {
  resources: StoreResource[];
  initial: StoreFilters;
  picked?: string[];
  now: number;
  section?: StoreSection;
  /** Plans and prices for the "no downloads left" prompt */
  upgrade?: UpgradeContext;
}) {
  const viewer = useStoreViewer();
  const allowance = limitedAllowance(viewer);
  const [bounced, dismissBounce] = useLimitBounce();
  const block = downloadBlock(allowance, bounced);
  // Download tapped with none left: what they tried, so they can still take it again if it was theirs already.
  const [prompt, setPrompt] = useState<{ again: string; many: boolean } | null>(null);
  const s = sections[section];
  const Heading = s.heading;
  const panelId = `${section}-filters`;
  const [filters, setFilters] = useState(initial);
  // ?pick= brings back a selection after logging in to download it.
  const [selected, setSelected] = useState<string[]>(() => initialPicked.filter((slug) => resources.some((r) => r.slug === slug)));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const filtersButton = useRef<HTMLButtonElement>(null);
  const set = (patch: Partial<StoreFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // Keep the URL in step (no navigation, so typing stays instant).
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.sort !== "popular") params.set("sort", filters.sort);
    if (filters.free) params.set("free", "1");
    if (filters.added) params.set("added", filters.added);
    const query = params.toString();
    window.history.replaceState(null, "", `${query ? `${s.path}?${query}` : s.path}${window.location.hash}`);
  }, [filters, s.path]);

  // Each filter's counts take the other filters into account.
  const facets = useMemo(() => {
    const without = (facet: Facet) => resources.filter((r) => matches(r, filters, now, facet));
    const byCategory = without("category");
    const byType = without("type");
    const inCatalogue = new Set(resources.map((r) => r.category));
    const kinds = new Set(resources.flatMap((r) => r.files.map(fileKind)));
    return {
      categories: [
        { value: "", label: "All categories", count: byCategory.length },
        ...storeCategories
          .filter((c) => inCatalogue.has(c.slug))
          .map((c) => ({ value: c.slug, label: c.name, count: byCategory.filter((r) => r.category === c.slug).length })),
      ],
      types: [
        { value: "", label: "All file types", count: byType.length },
        ...fileKinds
          .filter((k) => kinds.has(k.slug))
          .map((k) => ({ value: k.slug, label: k.name, count: byType.filter((r) => r.files.some((f) => fileKind(f) === k.slug)).length })),
      ],
      free: without("free").filter((r) => r.access === "warm-up").length,
    };
  }, [resources, filters, now]);

  const shown = useMemo(
    () =>
      resources
        .filter((r) => matches(r, filters, now))
        .sort((a, b) =>
          filters.sort === "newest" ? b.publishedAt.localeCompare(a.publishedAt) : Number(b.featured) - Number(a.featured) || b.downloads - a.downloads,
        ),
    [resources, filters, now],
  );

  const query = filters.q.trim();
  const range = addedRanges.find((a) => a.slug === filters.added);
  const candidates: (Chip | false | "" | undefined)[] = [
    query && { key: "q", label: `“${query}”`, clear: { q: "" } },
    filters.category && { key: "category", label: categoryName(filters.category), clear: { category: "" } },
    filters.type && { key: "type", label: fileKinds.find((k) => k.slug === filters.type)?.name ?? "", clear: { type: "" } },
    filters.free && { key: "free", label: "Free only", clear: { free: false } },
    range && { key: "added", label: `Added in the ${range.name.toLowerCase()}`, clear: { added: "" } },
  ];
  const chips = candidates.filter((chip): chip is Chip => !!chip);
  const activeCount = chips.filter((chip) => chip.key !== "q").length;
  const clearAll = () => setFilters((f) => ({ ...noFilters, sort: f.sort }));

  const picked = resources.filter((r) => selected.includes(r.slug));
  const toggle = (slug: string) => setSelected((list) => (list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug]));

  function openFilters() {
    if (window.matchMedia("(min-width: 64rem)").matches) setCollapsed(false);
    else setDrawerOpen(true);
  }

  function collapse() {
    setCollapsed(true);
    // The fold button goes with the sidebar, so focus moves to the button that brings it back.
    requestAnimationFrame(() => filtersButton.current?.focus());
  }

  return (
    <>
      <div className="max-w-2xl">
        <Heading className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">{s.title}</Heading>
        {/* Nothing published yet: the empty state below says what's coming instead. */}
        {resources.length > 0 && <p className="mt-2 text-base text-pretty text-muted-foreground">{s.intro}</p>}
      </div>

      <div className={`mt-6 grid grid-cols-1 items-start gap-6 lg:gap-8 ${collapsed ? "" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
        <StoreFilterPanel
          id={panelId}
          categories={facets.categories}
          types={facets.types}
          category={filters.category}
          type={filters.type}
          free={filters.free}
          freeCount={facets.free}
          onChange={(patch) => set(patch as Partial<StoreFilters>)}
          activeCount={activeCount}
          onClearAll={clearAll}
          shown={shown.length}
          noun={{ one: s.one, many: s.many }}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          collapsed={collapsed}
          onCollapse={collapse}
        />

        <div className="min-w-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <button
                ref={filtersButton}
                type="button"
                onClick={openFilters}
                aria-expanded={drawerOpen}
                aria-controls={panelId}
                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted ${collapsed ? "" : "lg:hidden"}`}
              >
                <FilterIcon className="size-4" />
                Filters
                {activeCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[0.6875rem] font-semibold text-white">
                    {activeCount}
                    <span className="sr-only"> active</span>
                  </span>
                )}
              </button>
              <div className="relative min-w-[11rem] flex-1 lg:max-w-sm">
                <label htmlFor={`${section}-search`} className="sr-only">
                  {s.search}
                </label>
                <input
                  id={`${section}-search`}
                  type="search"
                  value={filters.q}
                  onChange={(e) => set({ q: e.target.value })}
                  placeholder={s.search}
                  autoComplete="off"
                  enterKeyHint="search"
                  className="h-11 w-full rounded-full border border-transparent bg-foreground/[0.05] pr-11 pl-5 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:bg-background focus:ring-4 focus:ring-brand/15 dark:bg-white/[0.06] [&::-webkit-search-cancel-button]:appearance-none"
                />
                {filters.q ? (
                  <button
                    type="button"
                    onClick={() => set({ q: "" })}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    <CloseIcon className="size-4" />
                  </button>
                ) : (
                  <SearchIcon className="pointer-events-none absolute top-1/2 right-4 size-[1.125rem] -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-1 sm:justify-end lg:h-11">
              <Dropdown
                label="Sort by"
                labelOnPhones={false}
                value={filters.sort}
                onChange={(value) => set({ sort: value as StoreFilters["sort"] })}
                options={[
                  { value: "popular", label: "Most downloaded" },
                  { value: "newest", label: "Newest" },
                ]}
              />
              <Dropdown
                label="Added"
                value={filters.added}
                onChange={(value) => set({ added: value as StoreFilters["added"] })}
                options={[{ value: "", label: "Any time" }, ...addedRanges.map((a) => ({ value: a.slug, label: a.name }))]}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground">{shown.length}</span> {shown.length === 1 ? s.one : s.many}
            </p>
            {chips.length > 0 && (
              <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <li key={chip.key}>
                    <button
                      type="button"
                      onClick={() => set(chip.clear)}
                      aria-label={`Remove filter: ${chip.label}`}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-sm font-medium text-foreground transition hover:border-foreground/30 hover:bg-foreground/[0.04]"
                    >
                      {chip.label}
                      <CloseIcon className="size-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
                {chips.length > 1 && (
                  <li>
                    <button type="button" onClick={clearAll} className="px-1 text-sm font-medium text-brand hover:underline">
                      Clear all
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>

          {shown.length ? (
            <ul className={`mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 ${collapsed ? grid.collapsed : grid.open}`}>
              {shown.map((resource, i) => (
                <li key={resource.id}>
                  <StoreTile
                    resource={resource}
                    priority={i < 3}
                    sizes={collapsed ? sizes.collapsed : sizes.open}
                    titleTag={section === "store" ? "h2" : "h3"}
                    selected={selected.includes(resource.slug)}
                    onToggle={() => toggle(resource.slug)}
                    access={accessFor(viewer, resource.access)}
                    onDownload={(event) => {
                      if (!block) return;
                      event.preventDefault();
                      setPrompt({ again: downloadHref([resource.slug]), many: false });
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : resources.length ? (
            <EmptyState title="Nothing matches that" text="Try another category or search word." onClear={() => setFilters(noFilters)} className="mt-3" />
          ) : (
            <EmptyState title={s.emptyTitle} text={s.emptyText} className="mt-3" />
          )}
        </div>
      </div>

      {picked.length > 0 && (
        <SelectionBar
          picked={picked}
          path={s.path}
          onClear={() => setSelected([])}
          remaining={allowance ? left(allowance.downloads) : Infinity}
          onDownload={(event, again) => {
            if (!block) return;
            event.preventDefault();
            setPrompt({ again, many: picked.length > 1 });
          }}
        />
      )}

      {(prompt || bounced) && block && viewer?.signedIn && (
        <UpgradeDialog
          reason={block}
          current={viewer.plan}
          context={upgrade}
          onClose={() => {
            setPrompt(null);
            dismissBounce();
          }}
          footer={
            // Taking a template again in the same period doesn't use a download (after a bounce, it wasn't theirs yet).
            prompt &&
            block.kind !== "downloads-none" && (
              <a href={prompt.again} onClick={() => setPrompt(null)} className="font-medium text-brand hover:underline">
                {prompt.many ? "Downloaded these already? Get them again" : "Downloaded this one already? Get it again"}
              </a>
            )
          }
        />
      )}
    </>
  );
}

function EmptyState({ title, text, onClear, className }: { title: string; text: string; onClear?: () => void; className: string }) {
  return (
    <div className={`${className} flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-16 text-center`}>
      <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <DownloadIcon className="size-5" />
      </span>
      <p className="mt-4 text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {onClear && (
        <button type="button" onClick={onClear} className="mt-4 text-sm font-semibold text-brand hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
}

/* "Sort by  Most downloaded ⌄": a native select drawn as a plain text menu. */
function Dropdown({
  label,
  value,
  options,
  onChange,
  labelOnPhones = true,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  /** false: phones show only the value (the label stays for screen readers) */
  labelOnPhones?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <span className={labelOnPhones ? undefined : "max-sm:sr-only"}>{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 cursor-pointer appearance-none rounded-md bg-transparent pr-6 pl-1 text-sm font-semibold text-foreground outline-none [field-sizing:content] focus-visible:ring-2 focus-visible:ring-brand/40 dark:[color-scheme:dark]"
        >
          {options.map((o) => (
            <option key={o.value || "any"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0.5 size-4 -translate-y-1/2 text-foreground" />
      </span>
    </label>
  );
}

// With a mouse, these parts appear on hover or keyboard focus; touch screens always show them.
const reveal = "can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:group-focus-within:opacity-100";

/* A cover in the grid: only the picture at rest, the title and actions on top of it. */
function StoreTile({
  resource,
  priority,
  sizes,
  titleTag: Title,
  selected,
  onToggle,
  access,
  onDownload,
}: {
  resource: StoreResource;
  priority: boolean;
  sizes: string;
  titleTag: "h2" | "h3";
  selected: boolean;
  onToggle: () => void;
  access: ReturnType<typeof accessFor>;
  onDownload: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const href = resourcePath(resource.slug, resource.lowerThird);
  const free = resource.access === "warm-up";
  const meta = [resource.creator.name, free ? "" : planLabel(resource.access), formatBadge(resource)].filter(Boolean).join(" · ");
  const action = `absolute right-2.5 bottom-2.5 z-10 hidden size-9 items-center justify-center rounded-full text-white transition-[opacity,background-color] duration-200 hover:bg-brand can-hover:flex`;
  const download = useDownload(useRefreshStoreViewer());

  return (
    <article className="group relative">
      <div className={`relative aspect-video overflow-hidden rounded-md bg-muted ring-offset-2 ring-offset-background ${selected ? "ring-2 ring-brand" : ""}`}>
        <StoreCover resource={resource} priority={priority} sizes={sizes} titled={false} />

        {(free || resource.featured) && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            {free && <span className="rounded bg-brand px-1.5 py-0.5 text-[0.6875rem] leading-4 font-semibold text-white">Free</span>}
            {resource.featured && (
              <span title="Featured" className="flex size-5 items-center justify-center rounded bg-accent-yellow text-neutral-900">
                <StarIcon className="size-3" fill="currentColor" />
                <span className="sr-only">Featured</span>
              </span>
            )}
          </div>
        )}

        <div
          className={`absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/20 via-45% to-transparent to-70% p-3 transition-opacity duration-200 motion-reduce:transition-none can-hover:pr-14 ${reveal}`}
        >
          <Title className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold text-white">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-inset"
            >
              {resource.title}
            </Link>
          </Title>
          <p className="mt-0.5 truncate text-xs text-white/75">{meta}</p>
        </div>

        {access === "locked" ? (
          <span
            className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"
            title={`Included in the ${planLabel(resource.access)} plan`}
          >
            <LockIcon className="size-4" />
            <span className="sr-only">Included in the {planLabel(resource.access)} plan</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={selected ? `Unselect ${resource.title}` : `Select ${resource.title} to download with others`}
            className={`absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full border-2 shadow-sm transition ${
              selected ? "border-brand bg-brand text-white" : `border-white/90 bg-black/30 text-transparent hover:bg-black/45 ${reveal}`
            }`}
          >
            <CheckIcon className="size-4" strokeWidth={3} />
          </button>
        )}

        {access === "open" && (
          <a
            href={downloadHref([resource.slug])}
            onClick={(event) => {
              onDownload(event);
              download.follow(event);
            }}
            aria-label={`Download ${resource.title}`}
            aria-busy={download.state === "preparing" || undefined}
            title={download.state === "started" ? "Download started" : "Download"}
            // Stays in sight while the file is on its way.
            className={`${action} ${download.state === "idle" ? `bg-black/60 ${reveal}` : download.state === "started" ? "bg-brand" : "cursor-progress bg-black/60"}`}
          >
            <DownloadStateIcon state={download.state} />
          </a>
        )}
        {access === "signin" && (
          <Link href={`/login?next=${encodeURIComponent(href)}`} aria-label={`Log in to download ${resource.title}`} title="Log in to download" className={`${action} bg-black/60 ${reveal}`}>
            <DownloadIcon className="size-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function CreatorAvatar({ creator, size = "size-9" }: { creator: StoreResource["creator"]; size?: string }) {
  if (creator.image) return <UserAvatar src={creator.image} name={creator.name} pixels={72} className={`${size} shrink-0 text-xs`} />;
  // The team: the record mark from the logo.
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand/10`} aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-[60%] text-brand">
        <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      </svg>
    </span>
  );
}

/* The floating bar once covers are ticked: total size and one ZIP for all of them. */
function SelectionBar({
  picked,
  path,
  onClear,
  remaining,
  onDownload,
}: {
  picked: StoreResource[];
  path: string;
  onClear: () => void;
  /** Downloads the member has left (Infinity: no limit) */
  remaining: number;
  /** Before the ZIP starts; may stop it to explain the allowance. `again`: the same download. */
  onDownload: (event: MouseEvent<HTMLAnchorElement>, again: string) => void;
}) {
  const viewer = useStoreViewer();
  const { state, follow } = useDownload(useRefreshStoreViewer());
  const files = picked.reduce((n, r) => n + r.files.length, 0);
  const size = picked.reduce((n, r) => n + r.totalSize, 0);
  const allowed = viewer?.signedIn ? picked.filter((r) => canDownload(r.access, viewer.plan, viewer.isAdmin)) : [];
  const next = `${path}?${new URLSearchParams(picked.map((r) => ["pick", r.slug]))}`;
  const href = allowed.length ? downloadHref(allowed.map((r) => r.slug)) : undefined;
  const zip = allowed.length > 1 || files > 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6">
      <div
        role="region"
        aria-label="Selected downloads"
        className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-black/[0.08] bg-background/95 py-2 pr-2 pl-5 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#151515]/95"
      >
        <p className="min-w-0 flex-1 truncate text-sm text-foreground" aria-live="polite">
          {state !== "idle" ? (
            <span className="font-medium text-brand-deep dark:text-brand">
              {state === "preparing" ? (zip ? "Packing your ZIP…" : "Getting your file ready…") : zip ? "Your ZIP is downloading" : "Your download has started"}
            </span>
          ) : (
            <>
              <span className="font-semibold">{picked.length} selected</span>
              <span className="text-muted-foreground">
                {" "}
                · {files} {files === 1 ? "file" : "files"}
                {size ? ` · ${formatSize(size)}` : ""}
              </span>
              {viewer?.signedIn && allowed.length < picked.length && (
                <span className="text-muted-foreground"> · {picked.length - allowed.length} need a higher plan</span>
              )}
              {remaining > 0 && remaining < allowed.length && (
                <span className="text-muted-foreground">
                  {" "}
                  · {remaining} {remaining === 1 ? "download" : "downloads"} left
                </span>
              )}
            </>
          )}
        </p>
        <button type="button" onClick={onClear} aria-label="Clear selection" className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-foreground/[0.06]">
          <CloseIcon className="size-5" />
        </button>
        {viewer && !viewer.signedIn ? (
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background">
            Log in to download
          </Link>
        ) : (
          <a
            href={href}
            aria-disabled={!href}
            onClick={(event) => {
              if (!href) return;
              onDownload(event, href);
              follow(event);
            }}
            aria-busy={state === "preparing" || undefined}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:brightness-110 ${allowed.length ? "" : "pointer-events-none opacity-50"} ${state === "preparing" ? "cursor-progress" : ""}`}
          >
            <DownloadStateIcon state={state} />
            {zip ? "Download ZIP" : "Download"}
          </a>
        )}
      </div>
    </div>
  );
}
