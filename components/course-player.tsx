"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { formatClock, youtubeId, type CurriculumSection, type Lesson } from "@/lib/curriculum";
import { useCompletedLessons, useLessonNote } from "@/lib/learning-store";
import {
  ArrowRightIcon,
  AwardIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloseIcon,
  LessonIcon,
  ListIcon,
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
  level: string;
  durationLabel: string;
  students: number;
  rating: number;
  reviews: number;
  instructor: { name: string; image: string; specialty: string; bio: string };
};

type Tab = "overview" | "notes" | "instructor";
const UP_NEXT_SECONDS = 8;

export function CoursePlayer({
  course,
  sections,
  initialLesson,
}: {
  course: PlayerCourse;
  sections: CurriculumSection[];
  initialLesson: string;
}) {
  const lessons = sections.flatMap((section, s) => section.lessons.map((lesson) => ({ ...lesson, section: s })));
  const [currentSlug, setCurrentSlug] = useState(initialLesson);
  const index = Math.max(0, lessons.findIndex((l) => l.slug === currentSlug));
  const lesson = lessons[index];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];

  const { completed, setDone } = useCompletedLessons(course.slug);
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
    if (next) setUpNext(UP_NEXT_SECONDS);
  }

  // "Up next" countdown after a video ends.
  useEffect(() => {
    if (upNext === null || !next) return;
    const timer = setTimeout(() => (upNext <= 1 ? goTo(next, true) : setUpNext(upNext - 1)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upNext]);

  const videoId = youtubeId(lesson.youtube);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
        <Logo />
        <span aria-hidden="true" className="hidden h-6 w-px bg-border md:block" />
        <p className="hidden min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-foreground md:block">{course.title}</p>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <ProgressRing percent={percent} />
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
              {videoId ? (
                <YouTubePlayer key={lesson.slug} videoId={videoId} title={lesson.title} autoplay={autoplay} onEnded={onVideoEnded} onPlay={() => setAutoplay(true)} />
              ) : (
                <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/70">
                  This lesson&apos;s video link isn&apos;t a valid YouTube URL.
                </p>
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
                  className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${
                    isDone
                      ? "border-brand/30 bg-brand/10 text-brand-deep dark:text-brand"
                      : "border-border bg-card text-foreground shadow-xs hover:bg-muted"
                  }`}
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
            data-lenis-prevent
          >
            <div className="border-b border-border bg-background/60 px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Course content</h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{doneCount}</span> of {lessons.length} done
                </p>
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
                            onSelect={() => goTo(item)}
                            onToggle={() => setDone(item.slug, !completed.includes(item.slug))}
                          />
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                disabled={!allDone}
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
            <LessonTabs tab={tab} setTab={setTab} course={course} lesson={lesson} lessonsCount={lessons.length} />
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
  onSelect,
  onToggle,
}: {
  lesson: Lesson;
  number: number;
  current: boolean;
  done: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <li className={`flex items-start gap-3 px-4 py-3 transition ${current ? "bg-brand/[0.08]" : "hover:bg-muted"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? `Mark "${lesson.title}" as not done` : `Mark "${lesson.title}" as done`}
        aria-pressed={done}
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          done ? "border-brand bg-brand text-white" : "border-foreground/25 hover:border-brand"
        }`}
      >
        {done && <CheckIcon className="size-3" strokeWidth={3.5} />}
      </button>
      <button type="button" onClick={onSelect} aria-current={current ? "true" : undefined} className="min-w-0 flex-1 text-left">
        <span className={`block text-sm leading-snug ${current ? "font-semibold text-brand-deep dark:text-brand" : "text-foreground"}`}>
          {number}. {lesson.title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <LessonIcon className="size-3.5" />
          {current ? "Now playing" : "Video"} · {formatClock(lesson.durationSeconds)}
        </span>
      </button>
    </li>
  );
}

function LessonTabs({
  tab,
  setTab,
  course,
  lesson,
  lessonsCount,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  course: PlayerCourse;
  lesson: Lesson;
  lessonsCount: number;
}) {
  const baseId = useId();
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "notes", label: "My notes" },
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
              <h2 className="mt-8 text-lg font-semibold text-foreground">About this course</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{course.summary}</p>
            </div>
            <dl className="grid h-fit grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <Fact icon={<AwardIcon className="size-4" />} label="Level" value={course.level} />
              <Fact icon={<LessonIcon className="size-4" />} label="Lessons" value={String(lessonsCount)} />
              <Fact icon={<ClockIcon className="size-4" />} label="Length" value={course.durationLabel} />
              <Fact icon={<UsersIcon className="size-4" />} label="Students" value={course.students.toLocaleString("en-US")} />
              <div className="col-span-2 flex items-center gap-1.5 border-t border-border pt-3 text-muted-foreground">
                <StarIcon fill="currentColor" className="size-4 text-accent-amber" />
                <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span> ({course.reviews} reviews)
              </div>
            </dl>
          </div>
        )}
        {tab === "notes" && <LessonNotes courseSlug={course.slug} lesson={lesson} />}
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
