import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/content";
import { findTopic, formatDuration } from "@/lib/course-taxonomy";
import { ClockIcon, StarIcon, UsersIcon } from "./icons";

/*
 * Vertical card by default; inside a [data-view="list"] container (the
 * catalogue's list view) the `view-list:` classes turn it into a horizontal
 * row with the summary and instructor. The title link stretches over the
 * whole card, so anywhere on it is clickable with a single link for crawlers.
 */
export function CourseCard({
  course,
  sizes = "(min-width: 1280px) 300px, (min-width: 1024px) 32vw, (min-width: 640px) 48vw, 85vw",
  priority = false,
  headingLevel: Heading = "h3",
}: {
  course: Course;
  /** `sizes` for the cover image, matching the grid or carousel the card sits in */
  sizes?: string;
  /** Load the cover eagerly: for cards visible on first paint */
  priority?: boolean;
  /** h2 when cards sit directly under the page's h1, h3 inside a titled section */
  headingLevel?: "h2" | "h3";
}) {
  const href = `/courses/${course.slug}`;
  const topic = findTopic(course.subcategory ?? course.category)?.topic;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-black/[0.06] bg-card p-2 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-14px_rgb(0_0_0/0.2)] view-list:flex-row view-list:gap-4 sm:view-list:gap-6 dark:border-white/10">
      <div className="relative aspect-[10/7] shrink-0 overflow-hidden rounded-xl bg-muted view-list:aspect-square view-list:w-[6.5rem] view-list:self-start sm:view-list:aspect-[10/7] sm:view-list:w-[15rem] lg:view-list:w-[17.5rem]">
        <Image
          src={course.image}
          alt=""
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-sm backdrop-blur-sm max-sm:view-list:top-1.5 max-sm:view-list:left-1.5 max-sm:view-list:px-1.5 max-sm:view-list:py-0.5 max-sm:view-list:text-[0.625rem]">
          {course.level}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-2 pt-4 pb-2 view-list:px-0 view-list:py-1 sm:view-list:py-3 sm:view-list:pr-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand max-sm:view-list:gap-x-3 max-sm:view-list:text-[0.8125rem]">
          <span className="inline-flex items-center gap-1.5">
            <UsersIcon className="size-4 max-sm:view-list:size-3.5" />
            {course.students.toLocaleString("en-US")} Students
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="size-4 max-sm:view-list:size-3.5" />
            <span className="sr-only">Duration: </span>
            {formatDuration(course.durationMinutes)}
          </span>
          {topic && <span className="hidden text-muted-foreground sm:view-list:inline">{topic.name}</span>}
        </div>

        <Heading className="mt-2 line-clamp-2 text-[1.0625rem] leading-snug font-semibold text-foreground max-sm:view-list:mt-1 max-sm:view-list:text-[0.9375rem] sm:view-list:text-xl">
          <Link
            href={href}
            className="outline-none transition-colors group-hover:text-brand after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand"
          >
            {course.title}
          </Link>
        </Heading>

        <p className="mt-2 hidden text-[0.9375rem] leading-relaxed text-muted-foreground sm:view-list:line-clamp-2">
          {course.summary}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 max-sm:view-list:pt-2 sm:view-list:pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden min-w-0 items-center gap-2 text-sm text-foreground sm:view-list:flex">
              <Image
                src={course.instructor.image}
                alt=""
                width={56}
                height={56}
                className="size-7 shrink-0 rounded-full object-cover object-top"
              />
              <span className="truncate">{course.instructor.name}</span>
            </span>
            <span aria-hidden="true" className="hidden size-1 shrink-0 rounded-full bg-foreground/20 sm:view-list:block" />
            <p className="flex items-center gap-1 text-sm whitespace-nowrap">
              <StarIcon fill="currentColor" className="size-4 text-accent-amber" />
              <span className="font-medium text-foreground">
                {course.rating.toFixed(1)}
                <span className="sr-only"> out of 5</span>
              </span>
              <span className="text-muted-foreground">({course.reviews.toLocaleString("en-US")} reviews)</span>
            </p>
          </div>
          <Link
            href={href}
            aria-label={`Learn more: ${course.title}`}
            className="relative z-10 inline-flex h-10 shrink-0 items-center rounded-lg border border-border bg-background px-3.5 text-sm font-medium whitespace-nowrap text-foreground transition hover:border-foreground hover:bg-foreground hover:text-background max-sm:view-list:hidden"
          >
            Learn More
          </Link>
        </div>
      </div>
    </article>
  );
}
