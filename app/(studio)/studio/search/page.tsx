import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { Panel, StudioPageHeader } from "@/components/studio/ui";
import { searchStudio } from "@/lib/db/studio/search";

export const metadata: Metadata = { title: "Search" };

export default async function StudioSearchPage({ searchParams }: PageProps<"/studio/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const groups = await searchStudio(query);
  const total = groups.reduce((sum, g) => sum + g.hits.length, 0);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <StudioPageHeader title="Search" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Search" }]} />

        <form role="search" action="/studio/search" className="relative">
          <label htmlFor="studio-search-page" className="sr-only">
            Search the studio
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="studio-search-page"
            name="q"
            type="search"
            defaultValue={query}
            autoFocus={!query}
            placeholder="Courses, posts, students, payments, codes…"
            className="h-12 w-full rounded-xl border border-border bg-card pr-4 pl-12 text-[0.9375rem] text-foreground outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </form>

        {query.length < 2 ? (
          <p className="text-center text-sm text-muted-foreground">Type at least 2 characters.</p>
        ) : total === 0 ? (
          <Panel>
            <p className="py-6 text-center text-muted-foreground">Nothing matches &ldquo;{query}&rdquo;.</p>
          </Panel>
        ) : (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total} {total === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
            </p>
            {groups.map((group) => (
              <Panel key={group.key} title={group.label}>
                <ul className="-my-2 divide-y divide-border">
                  {group.hits.map((hit) => (
                    <li key={hit.id}>
                      <Link href={hit.href} className="group flex items-center gap-3 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground group-hover:text-brand">{hit.title}</span>
                          <span className="block truncate text-sm text-muted-foreground">{hit.detail}</span>
                        </span>
                        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
