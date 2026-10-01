"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { matchesQuery } from "@/lib/search";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon, SearchIcon } from "../icons";
import { Select, secondaryButton } from "./ui";

/* A reusable admin table: status tabs, search, sortable columns, page size, pagination. */

export type Column<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  /** Makes the column sortable */
  sort?: (item: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
};

export type Tab<T> = { key: string; label: string; test: (item: T) => boolean };

export function ManageTable<T>({
  title,
  items,
  getId,
  columns,
  tabs,
  searchText,
  searchPlaceholder = "Search",
  initialSort,
  actions,
  onRowClick,
  toolbar,
  empty,
  minWidth = "56rem",
}: {
  title: string;
  items: T[];
  getId: (item: T) => string;
  columns: Column<T>[];
  tabs?: Tab<T>[];
  searchText: (item: T) => string[];
  searchPlaceholder?: string;
  initialSort?: { key: string; dir: 1 | -1 };
  actions?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  toolbar?: ReactNode;
  empty: ReactNode;
  minWidth?: string;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(tabs?.[0]?.key ?? "");
  const [sort, setSort] = useState(initialSort ?? null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const activeTab = tabs?.find((t) => t.key === tab);
  const sortColumn = columns.find((c) => c.key === sort?.key);
  const filtered = items
    .filter((item) => !activeTab || activeTab.test(item))
    .filter((item) => matchesQuery(searchText(item), query))
    .sort((a, b) => {
      if (!sortColumn?.sort || !sort) return 0;
      const x = sortColumn.sort(a);
      const y = sortColumn.sort(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  const align = (a?: "left" | "right" | "center") => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <section className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]" aria-label={title}>
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {tabs && (
            <div role="tablist" aria-label="Filter" className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto px-1" data-lenis-prevent-horizontal>
              {tabs.map((t) => {
                const count = items.filter(t.test).length;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => {
                      setTab(t.key);
                      setPage(1);
                    }}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                      tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === t.key ? "bg-background/20" : "bg-foreground/[0.07]"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="w-24">
            <Select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-10 text-sm"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          {toolbar}
        </div>
      </div>

      {rows.length ? (
        // relative: keeps sr-only labels inside the scroller so they can't widen the page on phones
        <div className="relative overflow-x-auto" data-lenis-prevent-horizontal>
          <table className="w-full text-sm" style={{ minWidth }}>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={sort?.key === col.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                    className={`px-3 py-3 font-medium ${i === 0 ? "pl-6" : ""} ${align(col.align)}`}
                  >
                    {col.sort ? (
                      <button type="button" onClick={() => toggleSort(col.key)} className={`inline-flex items-center gap-1 hover:text-foreground ${sort?.key === col.key ? "text-foreground" : ""}`}>
                        {col.header}
                        <ChevronDownIcon className={`size-3.5 transition ${sort?.key === col.key ? (sort.dir === 1 ? "rotate-180" : "") : "opacity-30"}`} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
                {actions && (
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((item) => (
                <tr
                  key={getId(item)}
                  onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest("a,button,input") && onRowClick(item) : undefined}
                  className={`transition hover:bg-muted/40 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col, i) => (
                    <td key={col.key} className={`px-3 py-3 ${i === 0 ? "pl-6" : ""} ${align(col.align)} ${col.className ?? ""}`}>
                      {col.render(item)}
                    </td>
                  ))}
                  {actions && <td className="px-6 py-3 text-right">{actions(item)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-16 text-center">{items.length ? <p className="text-muted-foreground">Nothing matches your search or filter.</p> : empty}</div>
      )}

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-border px-5 py-4 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length ? start + 1 : 0}</span> to{" "}
          <span className="font-semibold text-foreground">{start + rows.length}</span> of <span className="font-semibold text-foreground">{filtered.length}</span>
        </p>
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <PageButton label="First page" icon={ChevronsLeftIcon} disabled={current === 1} onClick={() => setPage(1)} />
          <PageButton label="Previous page" icon={ChevronLeftIcon} disabled={current === 1} onClick={() => setPage(current - 1)} />
          <span className="px-2 text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{current}</span> of {pageCount}
          </span>
          <PageButton label="Next page" icon={ChevronRightIcon} disabled={current === pageCount} onClick={() => setPage(current + 1)} />
          <PageButton label="Last page" icon={ChevronsRightIcon} disabled={current === pageCount} onClick={() => setPage(pageCount)} />
        </nav>
      </div>
    </section>
  );
}

function PageButton({ label, icon: Icon, disabled, onClick }: { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition hover:bg-muted disabled:opacity-40"
    >
      <Icon className="size-4" />
    </button>
  );
}

export type MenuItem = {
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  href?: string;
  external?: boolean;
  onSelect?: () => void;
  danger?: boolean;
};

export function RowMenu({ label, items }: { label: string; items: (MenuItem | false | null | undefined)[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const cls = (danger?: boolean) =>
    `flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${danger ? "text-red-600 hover:bg-red-500/10 dark:text-red-400" : "text-foreground hover:bg-foreground/5"}`;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl">
          {items.filter((i): i is MenuItem => !!i).map(({ label: itemLabel, icon: Icon, href, external, onSelect, danger }) =>
            href ? (
              <Link key={itemLabel} role="menuitem" href={href} target={external ? "_blank" : undefined} className={cls(danger)}>
                {Icon && <Icon className="size-4 text-muted-foreground" />} {itemLabel}
              </Link>
            ) : (
              <button
                key={itemLabel}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect?.();
                }}
                className={cls(danger)}
              >
                {Icon && <Icon className={`size-4 ${danger ? "" : "text-muted-foreground"}`} />} {itemLabel}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
        <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted-foreground">{body}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 3000);
  }, []);
  const toast = (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[70]">
      {message && <p className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-2xl">{message}</p>}
    </div>
  );
  return { show, toast };
}
