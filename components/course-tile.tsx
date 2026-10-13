import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/content";
import { formatDuration } from "@/lib/course-taxonomy";
import { plans } from "@/lib/plans";
import { ArrowRightIcon, StarIcon } from "./icons";

/*
 * A course in the catalogue grid, drawn like the covers on /store: the
 * picture fills the tile and the title sits on it. Unlike store covers, the
 * title shows all the time (course covers are photos, with no title of their
 * own), and a mouse brings up an arrow on hover. The title link stretches
 * over the whole tile.
 */
export function CourseTile({
  course,
  sizes,
  priority = false,
  headingLevel: Heading = "h3",
}: {
  course: Course;
  sizes: string;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const href = `/courses/${course.slug}`;
  const free = course.access === "warm-up";
  const plan = free ? "Free" : (plans.find((p) => p.slug === course.access)?.name ?? course.access);

  return (
    <article className="group relative">
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
        <Image
          src={course.image}
          alt=""
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className={`rounded px-1.5 py-0.5 text-[0.6875rem] leading-4 font-semibold text-white ${free ? "bg-brand" : "bg-neutral-900/80"}`}>{plan}</span>
          <span className="rounded bg-white/90 px-1.5 py-0.5 text-[0.6875rem] leading-4 font-semibold text-neutral-900">{course.level}</span>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/25 via-45% to-transparent to-75% p-3 sm:p-4 can-hover:pr-14">
          <Heading className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold text-white sm:text-base">
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-inset"
            >
              {course.title}
            </Link>
          </Heading>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap text-white/80">
            {course.reviews > 0 ? (
              <span className="flex shrink-0 items-center gap-1 font-medium text-white">
                <StarIcon fill="currentColor" className="size-3.5 text-accent-amber" />
                {course.rating.toFixed(1)}
                <span className="sr-only"> out of 5 from {course.reviews.toLocaleString("en-US")} reviews</span>
              </span>
            ) : (
              <span className="shrink-0 font-medium text-white">New</span>
            )}
            <span aria-hidden="true">·</span>
            <span className="shrink-0">{formatDuration(course.durationMinutes)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{course.instructor.name}</span>
          </p>
        </div>

        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 hidden size-9 items-center justify-center rounded-full bg-black/60 text-white transition duration-200 group-hover:bg-brand can-hover:flex can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:group-focus-within:opacity-100 sm:right-3.5 sm:bottom-3.5"
        >
          <ArrowRightIcon className="size-4" />
        </span>
      </div>
    </article>
  );
}
