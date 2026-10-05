import Link from "next/link";
import { youtubeId } from "@/lib/curriculum";
import { categoryName, formatBadge, formatDownloads, formatSize, planLabel, timeAgo, type StoreResource } from "@/lib/store";
import { ChevronRightIcon, HomeIcon } from "../icons";
import { YouTubePlayer } from "../youtube-player";
import { DownloadButton, FileList } from "./download-panel";
import { CreatorAvatar } from "./store-browser";
import { StoreCover } from "./store-cover";
import { StoreViewerProvider } from "./store-viewer";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * A resource's page, laid out like a video page: the preview and download
 * button, the description and files, and more downloads alongside.
 */
export function StoreResourceView({ resource, all, now }: { resource: StoreResource; all: StoreResource[]; now: number }) {
  const videoId = resource.previewUrl ? youtubeId(resource.previewUrl) : null;
  // Same category first, then the most downloaded.
  const more = all
    .filter((r) => r.id !== resource.id)
    .sort((a, b) => Number(b.category === resource.category) - Number(a.category === resource.category) || b.downloads - a.downloads)
    .slice(0, 8);

  return (
    <main className="flex-1">
      <StoreViewerProvider>
        <div className="site-container pt-6 pb-24 sm:pt-10">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="flex items-center text-foreground transition hover:text-brand">
                  <HomeIcon className="size-4" />
                  <span className="sr-only">Home</span>
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRightIcon className="size-3.5" />
              </li>
              <li>
                <Link href="/store" className="text-foreground transition hover:text-brand">
                  Store
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRightIcon className="size-3.5" />
              </li>
              <li>
                <Link href={`/store?category=${resource.category}`} className="text-foreground transition hover:text-brand">
                  {categoryName(resource.category)}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-10">
            <div className="min-w-0">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
                {videoId ? <YouTubePlayer label="Watch the preview" videoId={videoId} title={resource.title} /> : <StoreCover resource={resource} priority sizes="(min-width: 1024px) 60vw, 100vw" />}
                {!videoId && <span className="absolute right-3 bottom-3 rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">{formatBadge(resource)}</span>}
              </div>

              <h1 className="mt-5 text-2xl leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[1.75rem]">{resource.title}</h1>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CreatorAvatar creator={resource.creator} size="size-11" />
                  <div>
                    <p className="font-semibold text-foreground">{resource.creator.name}</p>
                    <p className="text-sm text-muted-foreground">{resource.creator.image ? "Instructor" : "Made by our team"}</p>
                  </div>
                </div>
                <DownloadButton resource={resource} />
              </div>

              <section aria-label="About this download" className="mt-5 rounded-2xl bg-muted/70 p-4 sm:p-5">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-foreground">
                  <span>{formatDownloads(resource.downloads)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Added {date.format(new Date(resource.publishedAt))}</span>
                  <span aria-hidden="true">·</span>
                  <Link href={`/store?category=${resource.category}`} className="text-brand hover:underline">
                    {categoryName(resource.category)}
                  </Link>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${resource.access === "warm-up" ? "bg-brand text-white" : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"}`}
                  >
                    {planLabel(resource.access)}
                  </span>
                </p>
                {resource.description && <p className="mt-3 text-[0.9375rem] leading-relaxed whitespace-pre-line text-foreground/85">{resource.description}</p>}
              </section>

              <section aria-labelledby="files-title" className="mt-6 rounded-2xl border border-black/[0.06] bg-card p-4 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] sm:p-5 dark:border-white/10">
                <h2 id="files-title" className="flex items-baseline justify-between gap-3 text-base font-semibold text-foreground">
                  What&apos;s inside
                  <span className="text-sm font-normal text-muted-foreground">
                    {resource.files.length} {resource.files.length === 1 ? "file" : "files"}
                    {resource.totalSize ? ` · ${formatSize(resource.totalSize)}` : ""}
                  </span>
                </h2>
                <div className="mt-4">
                  <FileList resource={resource} />
                </div>
              </section>
            </div>

            <aside aria-labelledby="more-title" className="min-w-0">
              <h2 id="more-title" className="text-base font-semibold text-foreground">
                More downloads
              </h2>
              {more.length ? (
                <ul className="mt-4 space-y-4">
                  {more.map((r) => (
                    <li key={r.id}>
                      <MoreCard resource={r} now={now} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">More resources are on the way.</p>
              )}
              <Link href="/store" className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full border border-border text-sm font-semibold text-foreground transition hover:bg-foreground/5">
                Browse the store
              </Link>
            </aside>
          </div>
        </div>
      </StoreViewerProvider>
    </main>
  );
}

/* Sidebar card, like YouTube's "up next": small cover beside the title. */
function MoreCard({ resource, now }: { resource: StoreResource; now: number }) {
  return (
    <article className="group relative flex gap-3">
      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
        <StoreCover resource={resource} sizes="160px" compact />
        <span className="absolute right-1 bottom-1 rounded bg-black/75 px-1 py-px text-[0.6875rem] font-medium text-white">{formatBadge(resource)}</span>
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          <Link href={`/store/${resource.slug}`} className="outline-none after:absolute after:inset-0 group-hover:text-brand focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-brand">
            {resource.title}
          </Link>
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{resource.creator.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatDownloads(resource.downloads)} · {timeAgo(resource.publishedAt, now)}
        </p>
      </div>
    </article>
  );
}
