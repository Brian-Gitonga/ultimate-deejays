import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CatalogProvider, CatalogResults } from "@/components/course-catalog";
import {
  ActiveFilters,
  CatalogPagination,
  ClearFiltersLink,
  FiltersButton,
  ResultCount,
  SortSelect,
  ViewToggle,
} from "@/components/course-catalog-controls";
import { CourseCard } from "@/components/course-card";
import { CourseFilterPanel } from "@/components/course-filter-panel";
import { ChevronRightIcon, HomeIcon, SearchIcon } from "@/components/icons";
import {
  canonicalCoursesHref,
  coursesHref,
  isSearchResult,
  parseCourseFilters,
  type CourseFilters,
} from "@/lib/course-filters";
import { findTopic, isoDuration } from "@/lib/course-taxonomy";
import { queryCourses } from "@/lib/courses";
import { toSearchParams } from "@/lib/search";
import { siteName, siteUrl } from "@/lib/site";

const DEFAULT_TITLE = "Online DJ Courses";
const DEFAULT_DESCRIPTION =
  "Learn to DJ online with step-by-step video courses from working DJs: beatmatching, mixing, scratching, production, Serato and rekordbox, for every level.";

// generateMetadata and the page both need the results; cache() runs the query once per request.
const loadCatalog = cache(async (href: string) => {
  const filters = parseCourseFilters(new URL(href, siteUrl).searchParams);
  return { filters, result: await queryCourses(filters) };
});

async function catalogFor(searchParams: PageProps<"/courses">["searchParams"]) {
  return loadCatalog(coursesHref(parseCourseFilters(toSearchParams(await searchParams))));
}

function describe(filters: CourseFilters) {
  const query = filters.query.trim();
  const topic = findTopic(filters.category)?.topic;
  if (query) {
    return {
      title: `Search results for “${query}”`,
      heading: `Results for “${query}”`,
      description: `DJ courses matching “${query}” at ${siteName}.`,
      intro: topic ? `Searching in ${topic.name}.` : "Searching every course in the catalog.",
    };
  }
  if (topic) {
    return {
      title: `${topic.name} Courses`,
      heading: `${topic.name} Courses`,
      description: `${topic.description} Learn online from working DJs at ${siteName}.`,
      intro: topic.description,
    };
  }
  return {
    title: DEFAULT_TITLE,
    heading: "All Courses",
    description: DEFAULT_DESCRIPTION,
    intro: "Step-by-step video courses from working DJs, for every level, style and setup.",
  };
}

export async function generateMetadata({ searchParams }: PageProps<"/courses">): Promise<Metadata> {
  const { filters, result } = await catalogFor(searchParams);
  const { title, description } = describe(filters);
  const pageTitle = filters.page > 1 ? `${title} (Page ${filters.page})` : title;
  const canonical = canonicalCoursesHref(filters);
  const cover = result.items[0]?.image ?? "/images/courses/dj-fundamentals.jpg";

  return {
    title: pageTitle,
    description,
    // Internal search results stay out of the index; everything else names its canonical page.
    ...(isSearchResult(filters)
      ? { robots: { index: false, follow: true } }
      : { alternates: { canonical } }),
    openGraph: {
      type: "website",
      title: pageTitle,
      description,
      url: canonical,
      siteName,
      images: [{ url: cover, width: 960, height: 672, alt: title }],
    },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [cover] },
  };
}

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { filters, result } = await catalogFor(searchParams);
  if (filters.page > result.pageCount) notFound();

  const { heading, intro } = describe(filters);
  const topic = findTopic(filters.category);
  const start = (result.page - 1) * result.pageSize;

  return (
    <main className="flex-1">
      <StructuredData filters={filters} result={result} start={start} />

      <CatalogProvider filters={filters} total={result.total} pageCount={result.pageCount}>
        <div className="site-container pt-6 pb-20 sm:pt-10 lg:pb-28">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18.5rem_minmax(0,1fr)] xl:gap-10">
            <CourseFilterPanel facets={result.facets} />

            <section id="catalog" aria-labelledby="catalog-title" className="min-w-0 scroll-mt-28">
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                  <li>
                    <Link href="/" className="flex items-center text-foreground transition hover:text-brand">
                      <HomeIcon className="size-4" />
                      <span className="sr-only">Home</span>
                    </Link>
                  </li>
                  <Crumb href={topic ? "/courses" : undefined}>Courses</Crumb>
                  {topic?.parent && <Crumb href={`/courses?category=${topic.parent.slug}`}>{topic.parent.name}</Crumb>}
                  {topic && <Crumb>{topic.topic.name}</Crumb>}
                </ol>
              </nav>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div className="max-w-[38.75rem] min-w-0">
                  <h1
                    id="catalog-title"
                    className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[2rem]"
                  >
                    {heading}
                  </h1>
                  <p className="mt-2 text-base text-pretty text-muted-foreground">{intro}</p>
                </div>
                <div className="flex items-center gap-2">
                  <FiltersButton />
                  <SortSelect />
                  <ViewToggle />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-4">
                <ResultCount />
                <ActiveFilters />
              </div>

              {result.items.length > 0 ? (
                <>
                  <div className="mt-6">
                    <CatalogResults>
                      {result.items.map((course, i) => (
                        <li key={course.slug}>
                          <CourseCard
                            course={course}
                            headingLevel="h2"
                            priority={i < 3}
                            sizes="(min-width: 1280px) 310px, (min-width: 640px) 46vw, 92vw"
                          />
                        </li>
                      ))}
                    </CatalogResults>
                  </div>
                  <CatalogPagination page={result.page} pageSize={result.pageSize} shown={result.items.length} />
                </>
              ) : (
                <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <SearchIcon className="size-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-foreground">No courses match those filters</h2>
                  <p className="mt-1 max-w-sm text-pretty text-muted-foreground">
                    Try a different keyword, or loosen the level and duration filters to see more courses.
                  </p>
                  <ClearFiltersLink />
                </div>
              )}
            </section>
          </div>
        </div>
      </CatalogProvider>
    </main>
  );
}

function Crumb({ href, children }: { href?: string; children: string }) {
  return (
    <>
      <li aria-hidden="true">
        <ChevronRightIcon className="size-3.5" />
      </li>
      <li aria-current={href ? undefined : "page"}>
        {href ? (
          <Link href={href} className="transition hover:text-brand">
            {children}
          </Link>
        ) : (
          children
        )}
      </li>
    </>
  );
}

/* Course list + breadcrumb structured data (schema.org), for rich results in search. */
function StructuredData({
  filters,
  result,
  start,
}: {
  filters: CourseFilters;
  result: Awaited<ReturnType<typeof queryCourses>>;
  start: number;
}) {
  const abs = (path: string) => new URL(path, siteUrl).toString();
  const topic = findTopic(filters.category);
  const provider = { "@type": "Organization", name: siteName, sameAs: siteUrl };

  const breadcrumbs = [
    { name: "Home", url: abs("/") },
    { name: "Courses", url: abs("/courses") },
    ...(topic?.parent ? [{ name: topic.parent.name, url: abs(`/courses?category=${topic.parent.slug}`) }] : []),
    ...(topic ? [{ name: topic.topic.name, url: abs(`/courses?category=${topic.topic.slug}`) }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, i) => ({ "@type": "ListItem", position: i + 1, name: crumb.name, item: crumb.url })),
      },
      {
        "@type": "ItemList",
        name: describe(filters).title,
        numberOfItems: result.total,
        itemListElement: result.items.map((course, i) => ({
          "@type": "ListItem",
          position: start + i + 1,
          item: {
            "@type": "Course",
            "@id": abs(`/courses/${course.slug}`),
            url: abs(`/courses/${course.slug}`),
            name: course.title,
            description: course.summary,
            image: abs(course.image),
            inLanguage: "en",
            educationalLevel: course.level,
            provider,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: course.rating,
              reviewCount: course.reviews,
              bestRating: 5,
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "Online",
              courseWorkload: isoDuration(course.durationMinutes),
              instructor: { "@type": "Person", name: course.instructor.name },
            },
          },
        })),
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
  );
}
