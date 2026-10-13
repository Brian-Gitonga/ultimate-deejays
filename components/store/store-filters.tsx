"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, CloseIcon, FilterIcon, PlusIcon } from "../icons";

export type FacetOption = { value: string; label: string; count: number };

/*
 * The store's filters. On large screens it's a sticky sidebar beside the grid,
 * which the arrow folds away to give the grid more room; below that it's a
 * drawer opened by the Filters button. It's one element either way, like the
 * filters on /courses.
 */
export function StoreFilterPanel({
  id,
  categories,
  types,
  category,
  type,
  free,
  freeCount,
  onChange,
  activeCount,
  onClearAll,
  shown,
  noun,
  drawerOpen,
  setDrawerOpen,
  collapsed,
  onCollapse,
}: {
  id: string;
  categories: FacetOption[];
  types: FacetOption[];
  category: string;
  type: string;
  free: boolean;
  freeCount: number;
  onChange: (patch: { category?: string; type?: string; free?: boolean }) => void;
  activeCount: number;
  onClearAll: () => void;
  /** Results with the current filters, for the drawer's button */
  shown: number;
  noun: { one: string; many: string };
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

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

  return (
    <aside aria-label="Filters" className={`min-w-0 lg:sticky lg:top-28 ${collapsed ? "lg:hidden" : ""}`}>
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-[70] bg-neutral-950/40 transition-opacity duration-300 lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div
        ref={panelRef}
        id={id}
        role={drawerOpen ? "dialog" : undefined}
        aria-modal={drawerOpen || undefined}
        aria-labelledby={titleId}
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
          <h2 id={titleId} className="flex-1 text-base font-semibold text-foreground">
            Filters
          </h2>
          {activeCount > 0 && (
            <button type="button" onClick={onClearAll} className="text-sm font-medium text-brand hover:underline max-lg:hidden">
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={onCollapse}
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
          <FilterSection title="Category">
            <RadioList name={`${id}-category`} legend="Category" value={category} options={categories} onChange={(value) => onChange({ category: value })} />
          </FilterSection>
          {types.length > 2 && (
            <FilterSection title="File type">
              <RadioList name={`${id}-type`} legend="File type" value={type} options={types} onChange={(value) => onChange({ type: value })} />
            </FilterSection>
          )}
          <FilterSection title="Price">
            <label className="group/option flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[0.9375rem] text-foreground/85 transition-colors hover:bg-foreground/5 hover:text-foreground">
              <input type="checkbox" checked={free} onChange={(e) => onChange({ free: e.target.checked })} className="peer sr-only" />
              <span
                aria-hidden="true"
                className={`flex size-4 shrink-0 items-center justify-center rounded-[0.3rem] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ${
                  free ? "border-brand bg-brand text-white" : "border-foreground/25 group-hover/option:border-foreground/45"
                }`}
              >
                {free && <CheckIcon className="size-3" strokeWidth={3} />}
              </span>
              <span className="flex-1">Free only</span>
              <span className="text-xs text-muted-foreground tabular-nums">{freeCount}</span>
            </label>
          </FilterSection>
          <p className="border-t border-border py-5 text-sm text-muted-foreground">
            Members get every {noun.one}.{" "}
            <Link href="/pricing" className="font-medium whitespace-nowrap text-brand hover:underline">
              Compare plans
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4 lg:hidden">
          <button
            type="button"
            disabled={activeCount === 0}
            onClick={onClearAll}
            className="h-11 rounded-lg px-4 text-sm font-medium text-foreground hover:bg-foreground/5 disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="h-11 flex-1 rounded-lg bg-[#18181b] text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
          >
            Show {shown} {shown === 1 ? noun.one : noun.many}
          </button>
        </div>
      </div>
    </aside>
  );
}

/* A section that folds open and shut, like the filters on big template libraries. */
function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const regionId = useId();
  return (
    <section className="border-b border-border py-4 last-of-type:border-b-0">
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
      <div id={regionId} hidden={!open} className="mt-2">
        {children}
      </div>
    </section>
  );
}

const LIMIT = 6;

/* Native radio buttons (arrow keys move between them), drawn like the ones on /courses. */
function RadioList({ name, legend, value, options, onChange }: { name: string; legend: string; value: string; options: FacetOption[]; onChange: (value: string) => void }) {
  const [more, setMore] = useState(false);
  const long = options.length > LIMIT + 1;
  // Folded lists still show the chosen option.
  const visible = !long || more ? options : options.filter((o, i) => i < LIMIT || o.value === value);

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <ul>
        {visible.map((option) => {
          const active = option.value === value;
          return (
            <li key={option.value || "all"}>
              <label
                className={`group/option flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[0.9375rem] transition-colors ${
                  active ? "bg-brand/10 font-medium text-foreground" : "text-foreground/85 hover:bg-foreground/5 hover:text-foreground"
                } ${option.count === 0 && !active ? "opacity-45" : ""}`}
              >
                <input type="radio" name={name} value={option.value} checked={active} onChange={() => onChange(option.value)} className="peer sr-only" />
                <span
                  aria-hidden="true"
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ${
                    active ? "border-brand" : "border-foreground/25 group-hover/option:border-foreground/45"
                  }`}
                >
                  {active && <span className="size-2 rounded-full bg-brand" />}
                </span>
                <span className="flex-1">{option.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {long && (
        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          aria-expanded={more}
          className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          <PlusIcon className={`size-4 transition-transform ${more ? "rotate-45" : ""}`} />
          {more ? "Show less" : "Show more"}
        </button>
      )}
    </fieldset>
  );
}
