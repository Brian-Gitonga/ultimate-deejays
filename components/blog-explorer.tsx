"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type ComponentType, type FocusEvent, type FormEvent, type MouseEvent, type SVGProps } from "react";
import { blogHref, parseFilters, type BlogFilters } from "@/lib/blog-filters";
import type { Post } from "@/lib/content";
import { postCategories } from "@/lib/post-categories";
import { matchesQuery } from "@/lib/search";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CloseIcon,
  SearchIcon,
} from "./icons";
import { PostCard } from "./post-card";

// Every word must appear somewhere in the title, summary, category or author.
const matches = (post: Post, query: string) =>
  matchesQuery([post.title, post.excerpt, post.category.name, post.author.name], query);

/*
 * Search, category filter and pagination for the blog. Filtering happens in
 * the browser so results update as you type, and the URL is kept in sync with
 * replaceState so any view can be shared or reloaded. Every control is also a
 * real link or GET form, so it works before hydration and without JavaScript.
 */
export function BlogExplorer({
  posts,
  initial,
  heading = "Latest posts",
  pageSize = 12,
}: {
  posts: Post[];
  initial: BlogFilters;
  /** From Studio → Settings → Blog */
  heading?: string;
  pageSize?: number;
}) {
  const PAGE_SIZE = Math.max(1, pageSize);
  const [filters, setFilters] = useState(initial);

  /*
   * Follow URL changes we didn't make (e.g. the "Blog" nav link while filtered).
   * Our own replaceState calls reach the router in a transition, so the URL can
   * lag behind fast typing; `pending` lists the URLs we wrote so those late
   * echoes are recognised instead of undoing keystrokes.
   */
  const searchParams = useSearchParams();
  const urlHref = blogHref(parseFilters(searchParams));
  const [seenHref, setSeenHref] = useState(urlHref);
  const [pending, setPending] = useState<string[]>([]);
  if (urlHref !== seenHref) {
    setSeenHref(urlHref);
    if (!pending.includes(urlHref)) {
      setFilters(parseFilters(searchParams));
      setPending([]);
    } else if (urlHref === pending.at(-1)) {
      setPending([]);
    }
  }

  const { query, category, page } = filters;
  const searched = posts.filter((post) => matches(post, query));
  const results = category ? searched.filter((post) => post.category.slug === category) : searched;
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const shown = results.slice(start, start + PAGE_SIZE);
  const activeCategory = postCategories.find((c) => c.slug === category);
  const trimmedQuery = query.trim();

  function update(next: Partial<BlogFilters>, { scrollToTop = false } = {}) {
    const merged = { ...filters, page: 1, ...next };
    const href = blogHref(merged);
    setFilters(merged);
    if (href !== window.location.pathname + window.location.search) {
      setPending((urls) => [...urls, href]);
      window.history.replaceState(null, "", href);
    }
    if (scrollToTop) {
      document.getElementById("posts")?.scrollIntoView({ block: "start" });
    }
  }

  // Link clicks are handled in place; the href remains for new tabs, crawlers and no-JS.
  const handle = (next: Partial<BlogFilters>, options?: { scrollToTop?: boolean }) => (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    update(next, options);
  };

  function commitPage(event: FormEvent<HTMLFormElement> | FocusEvent<HTMLInputElement>) {
    event.preventDefault();
    const input = event.currentTarget instanceof HTMLFormElement ? event.currentTarget.elements.namedItem("page") : event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const target = Number.parseInt(input.value, 10);
    if (target >= 1 && target <= pageCount && target !== current) update({ page: target }, { scrollToTop: true });
    else input.value = String(current);
  }

  const categoryOptions = [
    { slug: null, name: "All Posts", count: searched.length },
    ...postCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      count: searched.filter((post) => post.category.slug === c.slug).length,
    })),
  ];

  return (
    <div className="site-container pt-6 pb-20 sm:pt-10 lg:pb-28">
      {/* minmax(0,…) columns stop the scrollable chip row from widening the page */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[16.25rem_minmax(0,1fr)] xl:gap-10">
        <aside aria-label="Filter posts" className="min-w-0 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-black/[0.06] bg-card p-4 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] sm:p-5 dark:border-white/10">
            <form action="/blog" role="search" onSubmit={(event) => event.preventDefault()}>
              {category && <input type="hidden" name="category" value={category} />}
              <label htmlFor="blog-search" className="sr-only">
                Search posts
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="blog-search"
                  name="q"
                  type="search"
                  value={query}
                  onChange={(event) => update({ query: event.target.value })}
                  placeholder="Search posts"
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-border bg-background pr-10 pl-10 text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15 [&::-webkit-search-cancel-button]:appearance-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => update({ query: "" })}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  >
                    <CloseIcon className="size-4" />
                  </button>
                )}
              </div>
            </form>

            <h2 className="mt-6 text-base font-semibold text-foreground">Categories</h2>
            {/* Scrollable chips on small screens, a radio-style list in the desktop sidebar */}
            <ul
              className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:mt-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0"
            >
              {categoryOptions.map((option) => {
                const active = option.slug === category;
                return (
                  <li key={option.name} className="shrink-0">
                    <Link
                      href={blogHref({ query, category: option.slug, page: 1 })}
                      onClick={handle({ category: option.slug })}
                      scroll={false}
                      aria-current={active ? "true" : undefined}
                      className={`flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition lg:rounded-lg lg:border-transparent lg:px-2 lg:text-[0.9375rem] ${
                        active
                          ? "border-foreground bg-foreground text-background lg:bg-brand/10 lg:text-foreground"
                          : "border-border text-foreground hover:border-foreground/30 lg:hover:bg-foreground/5"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`hidden size-4 shrink-0 items-center justify-center rounded-full border lg:flex ${
                          active ? "border-brand" : "border-foreground/25"
                        }`}
                      >
                        {active && <span className="size-2 rounded-full bg-brand" />}
                      </span>
                      <span className="lg:flex-1">{option.name}</span>
                      <span className="text-xs tabular-nums opacity-60">{option.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section id="posts" aria-labelledby="posts-title" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <h1 id="posts-title" className="text-[1.625rem] leading-tight font-bold tracking-tight text-foreground sm:text-[1.75rem]">
              {trimmedQuery ? `Results for “${trimmedQuery}”` : (activeCategory?.name ?? heading)}
            </h1>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "post" : "posts"}
              {trimmedQuery && activeCategory ? ` in ${activeCategory.name}` : ""}
            </p>
          </div>

          {shown.length > 0 ? (
            <>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {shown.map((post) => (
                  <li key={post.slug}>
                    <PostCard post={post} sizes="(min-width: 1280px) 310px, (min-width: 640px) 45vw, 92vw" />
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{start + 1}</span> to{" "}
                  <span className="font-semibold text-foreground">{start + shown.length}</span> of{" "}
                  <span className="font-semibold text-foreground">{results.length}</span> posts
                </p>

                {pageCount > 1 && (
                  <nav aria-label="Pagination" className="flex items-center gap-2">
                    <PageButton
                      label="First page"
                      icon={ChevronsLeftIcon}
                      disabled={current === 1}
                      href={blogHref({ ...filters, page: 1 })}
                      onClick={handle({ page: 1 }, { scrollToTop: true })}
                    />
                    <PageButton
                      label="Previous page"
                      icon={ChevronLeftIcon}
                      disabled={current === 1}
                      href={blogHref({ ...filters, page: current - 1 })}
                      onClick={handle({ page: current - 1 }, { scrollToTop: true })}
                    />
                    <form action="/blog" onSubmit={commitPage} className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                      {trimmedQuery && <input type="hidden" name="q" value={trimmedQuery} />}
                      {category && <input type="hidden" name="category" value={category} />}
                      <label htmlFor="blog-page">Page</label>
                      <input
                        key={current}
                        id="blog-page"
                        name="page"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={pageCount}
                        defaultValue={current}
                        onBlur={commitPage}
                        className="h-9 w-12 rounded-lg border border-border bg-background text-center text-foreground outline-none [appearance:textfield] focus:border-brand focus:ring-4 focus:ring-brand/15 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span>of {pageCount}</span>
                    </form>
                    <PageButton
                      label="Next page"
                      icon={ChevronRightIcon}
                      disabled={current === pageCount}
                      href={blogHref({ ...filters, page: current + 1 })}
                      onClick={handle({ page: current + 1 }, { scrollToTop: true })}
                    />
                    <PageButton
                      label="Last page"
                      icon={ChevronsRightIcon}
                      disabled={current === pageCount}
                      href={blogHref({ ...filters, page: pageCount })}
                      onClick={handle({ page: pageCount }, { scrollToTop: true })}
                    />
                  </nav>
                )}
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                <SearchIcon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">No posts found</h2>
              <p className="mt-1 max-w-sm text-pretty text-muted-foreground">
                Nothing matches “{trimmedQuery}”{activeCategory ? ` in ${activeCategory.name}` : ""}. Try another
                keyword or browse every post.
              </p>
              <button
                type="button"
                onClick={() => update({ query: "", category: null })}
                className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#18181b] px-4 text-sm font-medium text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  href,
  onClick,
}: {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  disabled: boolean;
  href: string;
  onClick: (event: MouseEvent) => void;
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
    <Link href={href} onClick={onClick} scroll={false} aria-label={label} className={`${className} hover:border-foreground/20 hover:bg-muted`}>
      <Icon className="size-4" />
    </Link>
  );
}
