"use client";

import Image from "next/image";
import Link from "next/link";
import { useAllProgress } from "@/lib/learning-store";
import { ArrowRightIcon, AwardIcon, CheckIcon, ClockIcon, LessonIcon, LockIcon, SparklesIcon } from "./icons";

export type MyCourse = {
  slug: string;
  title: string;
  image: string;
  instructor: string;
  level: string;
  /** Lesson slugs in curriculum order */
  lessons: string[];
  students: number;
  /** Their plan includes it */
  included: boolean;
  /** Name of the lowest plan that includes it */
  planName: string;
  /** Opened at least one lesson (enrolled) */
  enrolled: boolean;
  /** The lesson they watched last, and when */
  lastLesson: string | null;
  lastActive: string | null;
};

export type MyPlan = { name: string; upgrade: { slug: string; name: string } | null };

const ago = (iso: string) => {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function MyCourses({ catalog, name, plan, accountProgress = {} }: { catalog: MyCourse[]; name: string; plan: MyPlan; accountProgress?: Record<string, string[]> }) {
  const local = useAllProgress();
  // Saved to the account (any device), plus anything finished on this device for courses they're taking.
  const progress: Record<string, string[]> = { ...accountProgress };
  for (const course of catalog) {
    if (course.enrolled && local[course.slug]) progress[course.slug] = [...new Set([...(progress[course.slug] ?? []), ...local[course.slug]])];
  }

  const started = catalog
    .map((course) => {
      const done = course.lessons.filter((l) => progress[course.slug]?.includes(l)).length;
      const nextLesson = course.lessons.find((l) => !progress[course.slug]?.includes(l));
      // Back to the lesson they were watching, unless they finished it.
      const resume = course.lastLesson && !progress[course.slug]?.includes(course.lastLesson) ? course.lastLesson : nextLesson;
      return { ...course, done, percent: Math.round((done / course.lessons.length) * 100), resume };
    })
    .filter((c) => c.enrolled || c.done > 0)
    .sort((a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? "") || a.percent - b.percent);

  const completed = started.filter((c) => c.percent === 100).length;
  const lessonsDone = started.reduce((sum, c) => sum + c.done, 0);
  const suggestions = [...catalog]
    .filter((c) => !started.some((s) => s.slug === c.slug))
    .sort((a, b) => Number(b.included) - Number(a.included) || b.students - a.students)
    .slice(0, 3);

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-6 text-white sm:p-8">
        <div aria-hidden="true" className="absolute -top-16 -right-10 -z-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/75">Welcome back,</p>
            <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight sm:text-[2rem]">{name}</h1>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            <p className="text-white/70">Your plan</p>
            <p className="font-semibold">{plan.name}</p>
            {plan.upgrade && (
              <Link href={`/checkout?plan=${plan.upgrade.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent-yellow hover:underline">
                <SparklesIcon className="size-3.5" /> Upgrade to {plan.upgrade.name}
              </Link>
            )}
          </div>
        </div>
        <dl className="mt-6 grid max-w-lg grid-cols-3 gap-3">
          {[
            { label: "In progress", value: started.length - completed },
            { label: "Completed", value: completed },
            { label: "Lessons done", value: lessonsDone },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse rounded-xl bg-white/10 p-3 text-center">
              <dt className="text-xs text-white/75">{stat.label}</dt>
              <dd className="text-2xl font-bold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="learning-title">
        <h2 id="learning-title" className="text-xl font-semibold text-foreground">
          My learning
        </h2>
        {started.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {started.map((course, i) => (
              <li
                key={course.slug}
                className={`flex flex-col gap-4 rounded-2xl border bg-card p-3 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] sm:flex-row sm:items-center ${
                  i === 0 && course.percent < 100 ? "border-brand/30 ring-1 ring-brand/20" : "border-black/[0.06] dark:border-white/10"
                }`}
              >
                <div className="relative aspect-video shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
                  <Image src={course.image} alt="" fill sizes="(min-width: 640px) 192px, 90vw" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1 px-1 sm:px-0">
                  {i === 0 && course.percent < 100 ? (
                    <p className="text-xs font-semibold text-brand">Pick up where you left off</p>
                  ) : (
                    <p className="text-xs font-medium text-brand">
                      {course.level} · {course.instructor}
                    </p>
                  )}
                  <h3 className="mt-1 line-clamp-2 font-semibold text-foreground">{course.title}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div
                      role="progressbar"
                      aria-label={`${course.title} progress`}
                      aria-valuenow={course.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10"
                    >
                      <div className="h-full rounded-full bg-brand" style={{ width: `${course.percent}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground tabular-nums">{course.percent}%</span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {course.done} of {course.lessons.length} lessons
                    </span>
                    {course.lastActive && (
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="size-3.5" /> Last watched {ago(course.lastActive)}
                      </span>
                    )}
                  </p>
                </div>
                {course.included ? (
                  <Link
                    href={`/courses/${course.slug}${course.resume ? `?lesson=${course.resume}` : ""}`}
                    className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition sm:mr-2 ${
                      course.percent === 100
                        ? "border border-brand/30 bg-brand/10 text-brand-deep dark:text-brand"
                        : "bg-[#18181b] text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
                    }`}
                  >
                    {course.percent === 100 ? (
                      <>
                        <AwardIcon className="size-4" /> Review
                      </>
                    ) : (
                      <>
                        Continue <ArrowRightIcon className="size-4" />
                      </>
                    )}
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted sm:mr-2"
                  >
                    <LockIcon className="size-4" /> {course.planName} plan
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <LessonIcon className="size-5" />
            </span>
            <p className="mt-4 text-lg font-semibold text-foreground">You haven&apos;t started a course yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Play your first lesson and the course shows up here, with your progress saved to your account.</p>
            <Link
              href="/courses"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
            >
              Browse courses <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <section aria-labelledby="suggest-title">
          <h2 id="suggest-title" className="text-xl font-semibold text-foreground">
            Recommended next
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {suggestions.map((course) => (
              <li key={course.slug}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative aspect-video bg-muted">
                    <Image src={course.image} alt="" fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 text-[0.9375rem] font-semibold text-foreground group-hover:text-brand">{course.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {course.included ? <CheckIcon className="size-3.5 text-brand" /> : <LockIcon className="size-3.5" />}
                      {course.lessons.length} lessons · {course.included ? "In your plan" : `${course.planName} plan`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
