"use client";

import Image from "next/image";
import Link from "next/link";
import { useAllProgress } from "@/lib/learning-store";
import { useProfile } from "@/lib/profile-store";
import { ArrowRightIcon, AwardIcon, CheckIcon, LessonIcon } from "./icons";

export type MyCourse = {
  slug: string;
  title: string;
  image: string;
  instructor: string;
  level: string;
  lessons: string[];
  students: number;
};

export function MyCourses({ catalog }: { catalog: MyCourse[] }) {
  const progress = useAllProgress();
  const [profile] = useProfile();

  const started = catalog
    .map((course) => {
      const done = course.lessons.filter((l) => progress[course.slug]?.includes(l)).length;
      return { ...course, done, percent: Math.round((done / course.lessons.length) * 100), nextLesson: course.lessons.find((l) => !progress[course.slug]?.includes(l)) };
    })
    .filter((c) => c.done > 0)
    .sort((a, b) => a.percent - b.percent);

  const completed = started.filter((c) => c.percent === 100).length;
  const lessonsDone = started.reduce((sum, c) => sum + c.done, 0);
  const suggestions = [...catalog].sort((a, b) => b.students - a.students).filter((c) => !started.some((s) => s.slug === c.slug)).slice(0, 3);

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-6 text-white sm:p-8">
        <div aria-hidden="true" className="absolute -top-16 -right-10 -z-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm text-white/75">Welcome back,</p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight sm:text-[2rem]">{profile.djName || profile.fullName}</h1>
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
            {started.map((course) => (
              <li
                key={course.slug}
                className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-card p-3 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] sm:flex-row sm:items-center dark:border-white/10"
              >
                <div className="relative aspect-video shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
                  <Image src={course.image} alt="" fill sizes="(min-width: 640px) 192px, 90vw" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1 px-1 sm:px-0">
                  <p className="text-xs font-medium text-brand">{course.level} · {course.instructor}</p>
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
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {course.done} of {course.lessons.length} lessons
                  </p>
                </div>
                <Link
                  href={`/courses/${course.slug}${course.nextLesson ? `?lesson=${course.nextLesson}` : ""}`}
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
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <LessonIcon className="size-5" />
            </span>
            <p className="mt-4 text-lg font-semibold text-foreground">You haven&apos;t started a course yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Complete your first lesson and it will show up here with your progress.
            </p>
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
                      <CheckIcon className="size-3.5 text-brand" /> {course.lessons.length} lessons · {course.level}
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
