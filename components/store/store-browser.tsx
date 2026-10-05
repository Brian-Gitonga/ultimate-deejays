"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  canDownload,
  categoryName,
  downloadHref,
  formatBadge,
  formatDownloads,
  formatSize,
  planLabel,
  storeCategories,
  timeAgo,
  type StoreResource,
} from "@/lib/store";
import { CheckIcon, CloseIcon, DownloadIcon, LockIcon, SearchIcon, StarIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import { StoreCover, styleFor } from "./store-cover";
import { accessFor, useStoreViewer } from "./store-viewer";

export type StoreFilters = { category: string; q: string; sort: "popular" | "newest"; free: boolean };

const chip = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors";

/*
 * /store: a YouTube-style grid of resources. Filtering, search and sorting
 * run in the browser (the whole catalogue is on the page) and are kept in the
 * URL so a filtered view can be shared. Tick several cards to download them
 * as one ZIP.
 */
export function StoreBrowser({ resources, initial, picked: initialPicked = [], now }: { resources: StoreResource[]; initial: StoreFilters; picked?: string[]; now: number }) {
  const viewer = useStoreViewer();
  const [filters, setFilters] = useState(initial);
  // ?pick= brings back a selection after logging in to download it.
  const [selected, setSelected] = useState<string[]>(() => initialPicked.filter((slug) => resources.some((r) => r.slug === slug)));
  const set = (patch: Partial<StoreFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // Keep the URL in step (no navigation, so typing stays instant).
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.sort !== "popular") params.set("sort", filters.sort);
    if (filters.free) params.set("free", "1");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/store?${query}` : "/store");
  }, [filters]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of resources) map[r.category] = (map[r.category] ?? 0) + 1;
    return map;
  }, [resources]);

  const shown = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return resources
      .filter((r) => !filters.category || r.category === filters.category)
      .filter((r) => !filters.free || r.access === "warm-up")
      .filter((r) => !q || [r.title, r.description, r.creator.name, categoryName(r.category), ...r.files.map((f) => f.name)].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) =>
        filters.sort === "newest"
          ? b.publishedAt.localeCompare(a.publishedAt)
          : Number(b.featured) - Number(a.featured) || b.downloads - a.downloads,
      );
  }, [resources, filters]);

  const picked = resources.filter((r) => selected.includes(r.slug));
  const toggle = (slug: string) => setSelected((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));
  const categories = storeCategories.filter((c) => counts[c.slug]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">Store</h1>
          <p className="mt-2 text-base text-pretty text-muted-foreground">
            Practice tracks, sample packs, cue sheets and templates from working DJs. Free ones download with a free account; members get the rest.
          </p>
        </div>
        <label className="relative block w-full lg:w-80">
          <span className="sr-only">Search the store</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search downloads"
            className="h-11 w-full rounded-full border border-border bg-background pr-4 pl-11 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </label>
      </div>

      <div className="mt-6 -mx-5 px-5 sm:mx-0 sm:px-0">
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Categories">
          <button
            type="button"
            aria-pressed={!filters.category}
            onClick={() => set({ category: "" })}
            className={`${chip} ${!filters.category ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground hover:bg-foreground/10"}`}
          >
            All
          </button>
          {categories.map((c) => {
            const on = filters.category === c.slug;
            const Icon = styleFor(c.slug).icon;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                onClick={() => set({ category: on ? "" : c.slug })}
                className={`${chip} ${on ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground hover:bg-foreground/10"}`}
              >
                <Icon className="size-4" />
                {c.name}
                <span className={`text-xs tabular-nums ${on ? "text-background/70" : "text-muted-foreground"}`}>{counts[c.slug]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">{shown.length}</span> {shown.length === 1 ? "download" : "downloads"}
          {filters.category && ` in ${categoryName(filters.category)}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={filters.free}
            onClick={() => set({ free: !filters.free })}
            className={`${chip} h-9 border ${filters.free ? "border-brand/40 bg-brand/10 text-brand-deep dark:text-brand" : "border-border text-foreground hover:bg-foreground/5"}`}
          >
            {filters.free && <CheckIcon className="size-4" />}
            Free only
          </button>
          <label className="sr-only" htmlFor="store-sort">
            Sort
          </label>
          <select
            id="store-sort"
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as StoreFilters["sort"] })}
            className="h-9 cursor-pointer rounded-full border border-border bg-background px-3.5 text-sm font-medium text-foreground outline-none focus:border-brand dark:[color-scheme:dark]"
          >
            <option value="popular">Most downloaded</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {shown.length ? (
        <ul className="mt-6 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((resource, i) => (
            <li key={resource.id}>
              <StoreCard resource={resource} now={now} priority={i < 3} selected={selected.includes(resource.slug)} onToggle={() => toggle(resource.slug)} access={accessFor(viewer, resource.access)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <DownloadIcon className="size-5" />
          </span>
          <p className="mt-4 text-lg font-semibold text-foreground">{resources.length ? "Nothing matches that" : "New downloads are on the way"}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {resources.length ? "Try another category or search word." : "Practice tracks, sample packs and templates will appear here soon."}
          </p>
          {resources.length > 0 && (
            <button type="button" onClick={() => setFilters({ category: "", q: "", sort: "popular", free: false })} className="mt-4 text-sm font-semibold text-brand hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {picked.length > 0 && <SelectionBar picked={picked} onClear={() => setSelected([])} />}
    </>
  );
}

function StoreCard({
  resource,
  now,
  priority,
  selected,
  onToggle,
  access,
}: {
  resource: StoreResource;
  now: number;
  priority: boolean;
  selected: boolean;
  onToggle: () => void;
  access: ReturnType<typeof accessFor>;
}) {
  const locked = access === "locked";
  return (
    <article className="group relative">
      <div className={`relative aspect-video overflow-hidden rounded-xl bg-muted ring-offset-2 ring-offset-background transition ${selected ? "ring-2 ring-brand" : ""}`}>
        <StoreCover resource={resource} priority={priority} sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${resource.access === "warm-up" ? "bg-brand text-white" : "bg-neutral-900/80 text-white backdrop-blur-sm"}`}>
            {planLabel(resource.access)}
          </span>
          {resource.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-yellow px-2 py-1 text-xs font-semibold text-neutral-900 shadow-sm">
              <StarIcon className="size-3" fill="currentColor" />
              Featured
            </span>
          )}
        </div>
        <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">{formatBadge(resource)}</span>
        {locked ? (
          <span className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white" title={`Included in the ${planLabel(resource.access)} plan`}>
            <LockIcon className="size-4" />
            <span className="sr-only">Included in the {planLabel(resource.access)} plan</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={selected ? `Unselect ${resource.title}` : `Select ${resource.title} to download with others`}
            className={`absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full border-2 shadow-sm transition ${
              selected
                ? "border-brand bg-brand text-white opacity-100"
                : "border-white/90 bg-black/30 text-transparent opacity-100 backdrop-blur-sm hover:bg-black/45 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            }`}
          >
            <CheckIcon className="size-4" strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <CreatorAvatar creator={resource.creator} />
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold text-foreground">
            <Link
              href={`/store/${resource.slug}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl group-hover:text-brand focus-visible:after:ring-2 focus-visible:after:ring-brand"
            >
              {resource.title}
            </Link>
          </h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{resource.creator.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatDownloads(resource.downloads)} · {timeAgo(resource.publishedAt, now)}
          </p>
        </div>
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

/* The floating bar once cards are ticked: total size and one ZIP for all of them. */
function SelectionBar({ picked, onClear }: { picked: StoreResource[]; onClear: () => void }) {
  const viewer = useStoreViewer();
  const [started, setStarted] = useState(false);
  const files = picked.reduce((n, r) => n + r.files.length, 0);
  const size = picked.reduce((n, r) => n + r.totalSize, 0);
  const allowed = viewer?.signedIn ? picked.filter((r) => canDownload(r.access, viewer.plan, viewer.isAdmin)) : [];
  const next = `/store?${new URLSearchParams(picked.map((r) => ["pick", r.slug]))}`;

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setStarted(false), 4000);
    return () => clearTimeout(t);
  }, [started]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6">
      <div
        role="region"
        aria-label="Selected downloads"
        className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-black/[0.08] bg-background/95 py-2 pr-2 pl-5 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#151515]/95"
      >
        <p className="min-w-0 flex-1 truncate text-sm text-foreground" aria-live="polite">
          {started ? (
            <span className="font-medium text-brand-deep dark:text-brand">Your ZIP is downloading…</span>
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
            href={allowed.length ? downloadHref(allowed.map((r) => r.slug)) : undefined}
            aria-disabled={!allowed.length}
            onClick={() => allowed.length && setStarted(true)}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:brightness-110 ${allowed.length ? "" : "pointer-events-none opacity-50"}`}
          >
            <DownloadIcon className="size-4" />
            {allowed.length > 1 || files > 1 ? "Download ZIP" : "Download"}
          </a>
        )}
      </div>
    </div>
  );
}
