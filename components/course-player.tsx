"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { formatClock, type CurriculumSection, type Lesson, type LessonResource } from "@/lib/curriculum";
import { openLesson, saveLessonProgress, syncCourseProgress, type LessonAccess } from "@/app/(learn)/courses/actions";
import type { PublicReview } from "@/lib/db/reviews";
import { mergeCompletedLessons, readCompletedLessons, useCompletedLessons, useLessonNote } from "@/lib/learning-store";
import { CourseReviews } from "./course-reviews";
import {
  ArrowRightIcon,
  AwardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  DownloadIcon,
  LessonIcon,
  ListIcon,
  LockIcon,
  PlayIcon,
  StarIcon,
  UsersIcon,
} from "./icons";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { YouTubePlayer } from "./youtube-player";

export type PlayerCourse = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  /** The lowest plan that includes the course, and its display name */
  access: "warm-up" | "resident" | "headliner";
  accessName: string;
  level: string;
  durationLabel: string;
  students: number;
  rating: number;
  reviews: number;
  instructor: { name: string; image: string; specialty: string; bio: string };
};

type Tab = "overview" | "notes" | "reviews" | "instructor";
const UP_NEXT_SECONDS = 8;

/**
 * What the student may do in this course, learned from the first lesson the
 * server answers for: signin = signed out; limited = signed in, but their plan
 * only opens the free previews; full = their plan includes the course.
 */
type CourseAccess = "unknown" | "signin" | "limited" | "full";

function accessFrom(result: LessonAccess): CourseAccess | null {
  if (result.status === "signin") return "signin";
  if (result.status === "upgrade") return "limited";
  if (result.status === "ok") return result.full ? "full" : "limited";
  return null;
}

export function CoursePlayer({
  course,
  sections,
  initialLesson,
  reviews,
}: {
  course: PlayerCourse;
  sections: CurriculumSection[];
  initialLesson: string;
  reviews: PublicReview[];
}) {
  const lessons = sections.flatMap((section, s) => section.lessons.map((lesson) => ({ ...lesson, section: s })));
  const [currentSlug, setCurrentSlug] = useState(initialLesson);
  const index = Math.max(0, lessons.findIndex((l) => l.slug === currentSlug));
  const lesson = lessons[index];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];

  // Each lesson's video comes from the server, which checks sign-in and plan (openLesson).
  const [answers, setAnswers] = useState<Partial<Record<string, LessonAccess>>>({});
  const [courseAccess, setCourseAccess] = useState<CourseAccess>("unknown");
  const [retry, setRetry] = useState(0);
  const isLocked = (l: Lesson) => courseAccess === "signin" || (courseAccess === "limited" && !l.preview);
  // Locked lessons are known without asking the server again.
  const lessonLocked = isLocked(lesson);
  const gate: LessonAccess | "loading" = lessonLocked
    ? courseAccess === "signin"
      ? { status: "signin" }
      : { status: "upgrade", plan: course.access }
    : (answers[lesson.slug] ?? "loading");

  useEffect(() => {
    if (lessonLocked) return;
    let cancelled = false;
    openLesson(course.slug, lesson.slug).then(
      (result) => {
        if (cancelled) return;
        setAnswers((all) => ({ ...all, [lesson.slug]: result }));
        const access = accessFrom(result);
        if (access) setCourseAccess(access);
      },
      () => {
        if (!cancelled) {
          setAnswers((all) => ({ ...all, [lesson.slug]: { status: "error", error: "We couldn't load this lesson. Check your connection and try again." } }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [course.slug, lesson.slug, lessonLocked, retry]);

  // Progress is tracked for students whose plan includes the course: saved in this
  // browser straight away and to their account, so it follows them between devices.
  const canTrack = courseAccess === "full";
  const { completed: localCompleted, setDone: setLocalDone } = useCompletedLessons(course.slug);
  const completed = canTrack ? localCompleted : [];
  const setDone = (slug: string, done: boolean) => {
    if (!canTrack) return;
    setLocalDone(slug, done);
    saveLessonProgress(course.slug, slug, done).catch(() => {});
  };

  // Upload progress made on this device and pull in progress from other devices.
  useEffect(() => {
    if (!canTrack) return;
    let cancelled = false;
    syncCourseProgress(course.slug, readCompletedLessons(course.slug)).then(
      (result) => {
        if (!cancelled && result.ok) mergeCompletedLessons(course.slug, result.record);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [canTrack, course.slug]);
  const previewLesson = courseAccess === "limited" ? lessons.find((l) => l.preview && l.slug !== lesson.slug) : undefined;
  const doneCount = lessons.filter((l) => completed.includes(l.slug)).length;
  const percent = Math.round((doneCount / lessons.length) * 100);
  const isDone = completed.includes(lesson.slug);
  const allDone = doneCount === lessons.length;

  const [autoplay, setAutoplay] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<number[]>([lesson.section]);
  const [tab, setTab] = useState<Tab>("overview");
  const [upNext, setUpNext] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  function goTo(target: (typeof lessons)[number], play = autoplay) {
    setCurrentSlug(target.slug);
    setAutoplay(play);
    setUpNext(null);
    setOpenSections((open) => (open.includes(target.section) ? open : [...open, target.section]));
    window.history.replaceState(null, "", `?lesson=${target.slug}`);
  }

  function onVideoEnded() {
    setDone(lesson.slug, true);
    if (next && !isLocked(next)) setUpNext(UP_NEXT_SECONDS);
  }

  // "Up next" countdown after a video ends.
  useEffect(() => {
    if (upNext === null || !next) return;
    const timer = setTimeout(() => (upNext <= 1 ? goTo(next, true) : setUpNext(upNext - 1)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upNext]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
        <Logo size="xs" />
        <span aria-hidden="true" className="hidden h-6 w-px bg-border md:block" />
        <p className="hidden min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-foreground md:block">{course.title}</p>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {canTrack && <ProgressRing percent={percent} />}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-expanded={sidebarOpen}
            aria-controls="course-content"
            className="hidden h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted lg:inline-flex"
          >
            <ListIcon className="size-4" />
            {sidebarOpen ? "Hide content" : "Course content"}
          </button>
          <ThemeToggle />
          <Link
            href="/courses"
            aria-label="Exit course"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground transition hover:bg-foreground/5"
          >
            <CloseIcon className="size-5" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>
      </header>

      <div
        className={`grid flex-1 grid-cols-1 [grid-template-areas:'player''aside''details'] ${
          sidebarOpen
            ? "lg:grid-cols-[minmax(0,1fr)_24rem] lg:[grid-template-areas:'player_aside''details_aside']"
            : "lg:[grid-template-areas:'player''details']"
        }`}
      >
        {/* Video + lesson header */}
        <section aria-label="Lesson player" className="[grid-area:player]">
          <div className="bg-neutral-950">
            <div className="relative mx-auto aspect-video w-full lg:max-w-[calc((100dvh-12rem)*16/9)]">
              {gate !== "loading" && gate.status === "ok" ? (
                gate.videoId ? (
                  <YouTubePlayer key={lesson.slug} videoId={gate.videoId} title={lesson.title} autoplay={autoplay} onEnded={onVideoEnded} onPlay={() => setAutoplay(true)} />
                ) : (
                  <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/70">
                    This lesson&apos;s video isn&apos;t ready yet. Try the next lesson.
                  </p>
                )
              ) : (
                <LessonGate
                  gate={gate}
                  course={course}
                  lesson={lesson}
                  previewLesson={previewLesson}
                  onPreview={() => previewLesson && goTo(previewLesson, true)}
                  onRetry={() => {
                    setAnswers((all) => Object.fromEntries(Object.entries(all).filter(([slug]) => slug !== lesson.slug)));
                    setRetry((n) => n + 1);
                  }}
                />
              )}

              {upNext !== null && next && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/85 p-6 backdrop-blur-sm">
                  <div className="w-full max-w-sm text-center text-white" role="status">
                    <p className="text-sm text-white/70">Lesson complete. Up next in {upNext}s</p>
                    <p className="mt-2 text-xl font-semibold">{next.title}</p>
                    <div className="mt-6 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setUpNext(null)}
                        className="h-10 rounded-lg border border-white/25 px-4 text-sm font-medium hover:bg-white/10"
                      >
                        Stay here
                      </button>
                      <button
                        type="button"
                        onClick={() => goTo(next, true)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:brightness-110"
                      >
                        Play now
                        <ArrowRightIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="site-container py-5 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand">
                  Section {lesson.section + 1}: {sections[lesson.section].title} · Lesson {index + 1} of {lessons.length}
                </p>
                <h1 className="mt-1 text-xl leading-snug font-bold tracking-tight text-balance text-foreground sm:text-2xl">
                  {lesson.title}
                </h1>
                {lesson.source && (
                  <p className="mt-1 text-sm text-muted-foreground">Video by {lesson.source} on YouTube</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => prev && goTo(prev)}
                  disabled={!prev}
                  aria-label="Previous lesson"
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDone(lesson.slug, !isDone)}
                  aria-pressed={isDone}
                  disabled={!canTrack}
                  title={canTrack ? undefined : courseAccess === "signin" ? "Log in to track your progress" : "Progress is tracked once your plan includes this course"}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                    isDone
                      ? "border-brand/30 bg-brand/10 text-brand-deep dark:text-brand"
                      : "border-border bg-card text-foreground shadow-xs hover:bg-muted"
                  } disabled:opacity-50`}
                >
                  <CheckIcon className="size-4" />
                  {isDone ? "Completed" : "Mark as complete"}
                </button>
                <button
                  type="button"
                  onClick={() => next && goTo(next)}
                  disabled={!next}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white transition hover:bg-[#27272a] disabled:opacity-40 dark:bg-foreground dark:text-background"
                >
                  Next lesson
                  <ChevronRightIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Course content */}
        <aside
            id="course-content"
            aria-label="Course content"
            className={`[grid-area:aside] border-t border-border bg-muted/40 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:self-start lg:overflow-y-auto lg:border-t-0 lg:border-l ${
              sidebarOpen ? "" : "lg:hidden"
            }`}
          >
            <div className="border-b border-border bg-background/60 px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Course content</h2>
                {canTrack ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{doneCount}</span> of {lessons.length} done
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{lessons.length} lessons</p>
                )}
              </div>
              <div
                role="progressbar"
                aria-label="Course progress"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10"
              >
                <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </div>
            </div>

            <div className="space-y-3 p-4">
              {sections.map((section, s) => {
                const open = openSections.includes(s);
                const sectionLessons = lessons.filter((l) => l.section === s);
                const sectionDone = sectionLessons.filter((l) => completed.includes(l.slug)).length;
                const sectionSeconds = sectionLessons.reduce((sum, l) => sum + l.durationSeconds, 0);
                return (
                  <div key={section.title} className="overflow-hidden rounded-xl border border-border bg-card">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenSections((list) => (open ? list.filter((i) => i !== s) : [...list, s]))}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-muted"
                      >
                        <span className="min-w-0">
                          <span className="block text-[0.9375rem] font-semibold text-foreground">
                            {s + 1}. {section.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {sectionDone}/{sectionLessons.length} lessons · {formatClock(sectionSeconds)}
                          </span>
                        </span>
                        <ChevronDownIcon className={`size-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
                      </button>
                    </h3>
                    {open && (
                      <ol className="border-t border-border">
                        {sectionLessons.map((item) => (
                          <LessonRow
                            key={item.slug}
                            lesson={item}
                            number={lessons.indexOf(item) + 1}
                            current={item.slug === lesson.slug}
                            done={completed.includes(item.slug)}
                            locked={isLocked(item)}
                            showPreview={courseAccess !== "full" && !!item.preview}
                            canTrack={canTrack}
                            onSelect={() => goTo(item)}
                            onToggle={() => setDone(item.slug, !completed.includes(item.slug))}
                          />
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}

              {courseAccess === "limited" && (
                <Link
                  href={`/checkout?plan=${course.access}`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <LockIcon className="size-4" />
                  Unlock every lesson with {course.accessName}
                </Link>
              )}
              <button
                type="button"
                disabled={!allDone || !canTrack}
                onClick={() => setFinished(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:brightness-110 disabled:bg-brand/15 disabled:text-brand-deep/60 dark:disabled:text-brand/60"
              >
                <AwardIcon className="size-4" />
                {allDone ? "Finish course" : `Finish course (${lessons.length - doneCount} to go)`}
              </button>
            </div>
          </aside>

        {/* Tabs */}
        <section aria-label="Lesson details" className="[grid-area:details]">
          <div className="site-container pb-16">
            <LessonTabs
              tab={tab}
              setTab={setTab}
              course={course}
              lesson={lesson}
              lessonsCount={lessons.length}
              reviews={reviews}
              resources={gate !== "loading" && gate.status === "ok" ? gate.resources : []}
            />
          </div>
        </section>
      </div>

      {finished && <FinishedDialog course={course} onClose={() => setFinished(false)} />}
    </div>
  );
}

function LessonRow({
  lesson,
  number,
  current,
  done,
  locked,
  showPreview,
  canTrack,
  onSelect,
  onToggle,
}: {
  lesson: Lesson;
  number: number;
  current: boolean;
  done: boolean;
  locked: boolean;
  showPreview: boolean;
  canTrack: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <li className={`flex items-start gap-3 px-4 py-3 transition ${current ? "bg-brand/[0.08]" : "hover:bg-muted"}`}>
      {canTrack ? (
        <ProgressToggle title={lesson.title} done={done} onToggle={onToggle} />
      ) : (
        <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground">
          {locked ? <LockIcon className="size-4" /> : <PlayIcon className="size-3.5" />}
        </span>
      )}
      <button type="button" onClick={onSelect} aria-current={current ? "true" : undefined} className="min-w-0 flex-1 text-left">
        <span className={`block text-sm leading-snug ${current ? "font-semibold text-brand-deep dark:text-brand" : "text-foreground"}`}>
          {number}. {lesson.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <LessonIcon className="size-3.5" />
          {current ? "Now playing" : "Video"} · {formatClock(lesson.durationSeconds)}
          {showPreview && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-deep dark:text-brand">
              Free preview
            </span>
          )}
          {locked && <span className="sr-only">(locked)</span>}
        </span>
      </button>
    </li>
  );
}

function ProgressToggle({ title, done, onToggle }: { title: string; done: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={done ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
      aria-pressed={done}
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
        done ? "border-brand bg-brand text-white" : "border-foreground/25 hover:border-brand"
      }`}
    >
      {done && <CheckIcon className="size-3" strokeWidth={3.5} />}
    </button>
  );
}

function LessonGate({
  gate,
  course,
  lesson,
  previewLesson,
  onPreview,
  onRetry,
}: {
  gate: Exclude<LessonAccess, { status: "ok" }> | "loading";
  course: PlayerCourse;
  lesson: Lesson;
  previewLesson?: Lesson;
  onPreview: () => void;
  onRetry: () => void;
}) {
  const here = `/courses/${course.slug}?lesson=${lesson.slug}`;
  const button = "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition";
  const ghost = `${button} border border-white/25 text-white hover:bg-white/10`;
  let body: ReactNode;

  if (gate === "loading") {
    body = (
      <p role="status" className="flex items-center gap-3 text-sm text-white/80">
        <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        Loading lesson…
      </p>
    );
  } else if (gate.status === "signin") {
    body = (
      <div className="max-w-md">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/10">
          <PlayIcon className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-bold sm:text-2xl">Sign in to start watching</h2>
        <p className="mt-2 text-sm text-white/75 sm:text-[0.9375rem]">
          Create a free account to watch lessons, save your progress and pick up where you left off on any device.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={`/sign-up?next=${encodeURIComponent(here)}`} className={`${button} bg-brand text-white hover:brightness-110`}>
            Create free account
          </Link>
          <Link href={`/login?next=${encodeURIComponent(here)}`} className={ghost}>
            Log in
          </Link>
        </div>
      </div>
    );
  } else if (gate.status === "upgrade") {
    body = (
      <div className="max-w-md">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/10">
          <LockIcon className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-bold sm:text-2xl">Unlock this lesson with {course.accessName}</h2>
        <p className="mt-2 text-sm text-white/75 sm:text-[0.9375rem]">
          {course.title} is included in the {course.accessName} plan and up. Pay once, keep it for life, and track your progress.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={`/checkout?plan=${gate.plan}`} className={`${button} bg-brand text-white hover:brightness-110`}>
            Upgrade to {course.accessName}
            <ArrowRightIcon className="size-4" />
          </Link>
          {previewLesson ? (
            <button type="button" onClick={onPreview} className={ghost}>
              Watch a free preview
            </button>
          ) : (
            <Link href="/pricing" className={ghost}>
              Compare plans
            </Link>
          )}
        </div>
      </div>
    );
  } else if (gate.status === "not_found") {
    body = <p className="text-white/80">This lesson isn&apos;t available right now. Pick another from the course content.</p>;
  } else {
    body = (
      <div className="max-w-md">
        <p className="text-white/85">{gate.error}</p>
        <button type="button" onClick={onRetry} className={`${ghost} mt-4`}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image src={course.image} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover opacity-30" priority />
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-neutral-950/60 p-6 text-center text-white">{body}</div>
    </div>
  );
}

function LessonTabs({
  tab,
  setTab,
  course,
  lesson,
  lessonsCount,
  reviews,
  resources,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  course: PlayerCourse;
  lesson: Lesson;
  lessonsCount: number;
  reviews: PublicReview[];
  resources: LessonResource[];
}) {
  const baseId = useId();
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "notes", label: "My notes" },
    { id: "reviews", label: course.reviews ? `Reviews (${course.reviews})` : "Reviews" },
    { id: "instructor", label: "Instructor" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Lesson details" className="flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${baseId}-${t.id}-tab`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${baseId}-${t.id}-panel`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition ${
              tab === t.id ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${baseId}-${tab}-panel`} aria-labelledby={`${baseId}-${tab}-tab`} className="pt-6">
        {tab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div>
              <h2 className="text-lg font-semibold text-foreground">About this lesson</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{lesson.summary}</p>
              {resources.length > 0 && (
                <>
                  <h2 className="mt-8 text-lg font-semibold text-foreground">Lesson downloads</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {resources.map((r) => (
                      <li key={r.id}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                        >
                          <DownloadIcon className="size-4 text-brand" />
                          {r.label || "Download"}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <h2 className="mt-8 text-lg font-semibold text-foreground">About this course</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{course.summary}</p>
            </div>
            <dl className="grid h-fit grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <Fact icon={<AwardIcon className="size-4" />} label="Level" value={course.level} />
              <Fact icon={<LessonIcon className="size-4" />} label="Lessons" value={String(lessonsCount)} />
              <Fact icon={<ClockIcon className="size-4" />} label="Length" value={course.durationLabel} />
              {course.students > 0 && <Fact icon={<UsersIcon className="size-4" />} label="Students" value={course.students.toLocaleString("en-US")} />}
              <div className="col-span-2 flex items-center gap-1.5 border-t border-border pt-3 text-muted-foreground">
                {course.reviews > 0 ? (
                  <>
                    <StarIcon fill="currentColor" className="size-4 text-accent-amber" />
                    <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span> ({course.reviews} {course.reviews === 1 ? "review" : "reviews"})
                  </>
                ) : (
                  "New course. Be the first to review it."
                )}
              </div>
            </dl>
          </div>
        )}
        {tab === "notes" && <LessonNotes courseSlug={course.slug} lesson={lesson} />}
        {tab === "reviews" && <CourseReviews courseSlug={course.slug} rating={course.rating} total={course.reviews} reviews={reviews} />}
        {tab === "instructor" && (
          <div className="flex flex-col gap-5 sm:flex-row">
            <Image
              src={course.instructor.image}
              alt={`Portrait of ${course.instructor.name}`}
              width={160}
              height={160}
              className="size-20 shrink-0 rounded-2xl object-cover object-top"
            />
            <div>
              <p className="text-lg font-semibold text-foreground">{course.instructor.name}</p>
              <p className="text-sm text-brand">{course.instructor.specialty} Instructor</p>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">{course.instructor.bio}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function LessonNotes({ courseSlug, lesson }: { courseSlug: string; lesson: Lesson }) {
  const [note, setNote] = useLessonNote(courseSlug, lesson.slug);
  const id = useId();
  return (
    <div className="max-w-3xl">
      <label htmlFor={id} className="text-lg font-semibold text-foreground">
        Notes for this lesson
      </label>
      <p className="mt-1 text-sm text-muted-foreground">Jot down tips, cue points or tracks to practice with. Notes save automatically on this device.</p>
      <textarea
        id={id}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={7}
        placeholder="e.g. Practice the bass swap on the next phrase change…"
        className="mt-4 w-full resize-y rounded-xl border border-border bg-background p-4 text-[0.9375rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {note ? `Saved · ${note.trim().split(/\s+/).filter(Boolean).length} words` : "Nothing saved yet"}
      </p>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2" title={`${percent}% complete`}>
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" className="stroke-foreground/10" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${percent} 100`}
          className="stroke-brand transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="hidden text-sm font-medium text-foreground sm:block">
        {percent}%<span className="sr-only"> of the course complete</span>
      </span>
    </div>
  );
}

function FinishedDialog({ course, onClose }: { course: PlayerCourse; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finished-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <AwardIcon className="size-8" />
        </span>
        <h2 id="finished-title" className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Course complete!
        </h2>
        <p className="mt-2 text-pretty text-muted-foreground">
          You finished <span className="font-semibold text-foreground">{course.title}</span>. Record a mix to lock in what you
          learned, then pick your next course.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Keep reviewing
          </button>
          <Link
            href="/courses"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
          >
            Browse more courses
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
