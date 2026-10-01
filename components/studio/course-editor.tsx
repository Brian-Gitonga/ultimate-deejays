"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { courseLevels, formatDuration } from "@/lib/course-taxonomy";
import { youtubeId } from "@/lib/curriculum";
import { checklist, languages, lessonsOf, slugify, totalSeconds, type EditorStep, type StudioCourse } from "@/lib/studio-courses";
import { useStudioCourses } from "@/lib/studio-store";
import { ArrowUpRightIcon, CheckIcon, ChevronLeftIcon, LessonIcon, UsersIcon } from "../icons";
import { AccessPicker, CategorySelect, ThumbnailPicker } from "./course-fields";
import { CurriculumBuilder } from "./curriculum-builder";
import { DescriptionEditor } from "./description-editor";
import { ListEditor } from "./list-editor";
import { StatusBadge } from "./status";
import { Field, Input, Panel, Select, primaryButton, secondaryButton } from "./ui";

const steps: { id: EditorStep; group: string; label: string }[] = [
  { id: "learners", group: "Plan your course", label: "Intended learners" },
  { id: "curriculum", group: "Create your content", label: "Curriculum" },
  { id: "landing", group: "Publish your course", label: "Landing page" },
  { id: "access", group: "Publish your course", label: "Access & delivery" },
  { id: "publish", group: "Publish your course", label: "Review & publish" },
];

export function CourseEditor({ seed, courseId }: { seed: StudioCourse[]; courseId: string }) {
  const { courses } = useStudioCourses(seed);
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <Panel>
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Course not found</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been deleted, or it was created in another browser.</p>
          <Link href="/studio/courses" className={`${primaryButton} mt-5`}>
            Back to courses
          </Link>
        </div>
      </Panel>
    );
  }

  return <Editor key={course.id} seed={seed} initial={course} />;
}

function Editor({ seed, initial }: { seed: StudioCourse[]; initial: StudioCourse }) {
  const router = useRouter();
  const params = useSearchParams();
  const { courses, save, remove } = useStudioCourses(seed);
  const [draft, setDraft] = useState(initial);
  const [step, setStepState] = useState<EditorStep>(() => (steps.find((s) => s.id === params.get("step"))?.id ?? "learners"));
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [saveError, setSaveError] = useState("");
  const [welcome, setWelcome] = useState(params.get("created") === "1");
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));

  const items = checklist(draft);
  const doneCount = items.filter((i) => i.done).length;
  const ready = doneCount === items.length;
  const lessons = lessonsOf(draft);
  const dirty = JSON.stringify(draft) !== savedJson;

  function setStep(next: EditorStep) {
    setStepState(next);
    window.history.replaceState(null, "", `?step=${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const set = <K extends keyof StudioCourse>(key: K, value: StudioCourse[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function persist(next = draft) {
    try {
      const saved = save(next);
      setSavedJson(JSON.stringify(next));
      setSaveState("saved");
      setSaveError("");
      return saved;
    } catch (error) {
      setSaveState("error");
      setSaveError((error as Error).message);
    }
  }

  // Autosave a moment after the last change.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      setSaveState("saving");
      persist();
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Ctrl/Cmd+S saves now; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        persist();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  });

  function changeStatus(status: StudioCourse["status"]) {
    const next = { ...draft, status };
    setDraft(next);
    persist(next);
  }

  const stepDone = (id: EditorStep) => {
    const own = items.filter((i) => i.step === id);
    return own.length > 0 && own.every((i) => i.done);
  };

  const slugTaken = courses.some((c) => c.id !== draft.id && c.slug === draft.slug);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/studio/courses" aria-label="Back to courses" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted">
            <ChevronLeftIcon className="size-4" />
          </Link>
          <div className="relative hidden h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
            {draft.thumbnail && <Image src={draft.thumbnail} alt="" fill sizes="72px" unoptimized={draft.thumbnail.startsWith("data:")} className="object-cover" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={draft.status} />
              <span aria-live="polite" className="text-xs text-muted-foreground">
                {saveState === "error" ? (
                  <span className="text-red-600 dark:text-red-400">{saveError}</span>
                ) : dirty || saveState === "saving" ? (
                  "Saving…"
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <CheckIcon className="size-3 text-brand" strokeWidth={3} /> All changes saved
                  </span>
                )}
              </span>
            </div>
            <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">{draft.title || "Untitled course"}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft.status === "published" ? (
            <Link href={`/courses/${draft.slug}`} target="_blank" className={secondaryButton}>
              View on site <ArrowUpRightIcon className="size-4" />
            </Link>
          ) : (
            lessons[0] &&
            youtubeId(lessons[0].youtube) && (
              <Link href={`https://www.youtube.com/watch?v=${youtubeId(lessons[0].youtube)}`} target="_blank" className={secondaryButton}>
                Preview first lesson <ArrowUpRightIcon className="size-4" />
              </Link>
            )
          )}
          <button type="button" onClick={() => setStep("publish")} className={primaryButton}>
            {draft.status === "draft" ? `Submit for review (${doneCount}/${items.length})` : "Review & publish"}
          </button>
        </div>
      </div>

      {welcome && (
        <div role="status" className="flex items-start justify-between gap-4 rounded-2xl border border-brand/25 bg-brand/[0.07] p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Course created as a draft.</span> Now add your sections and lessons: paste YouTube links and we&apos;ll fill in the
            titles and lengths.
          </p>
          <button type="button" onClick={() => setWelcome(false)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Step navigation */}
        <nav aria-label="Course editor steps" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="px-2 pt-1 pb-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Course readiness</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {doneCount}/{items.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(doneCount / items.length) * 100}%` }} />
              </div>
            </div>
            <ol className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col" data-lenis-prevent-horizontal>
              {steps.map((s, i) => (
                <li key={s.id} className="shrink-0">
                  {(i === 0 || steps[i - 1].group !== s.group) && (
                    <p className="mt-2 mb-1 hidden px-2 text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase first:mt-0 lg:block">{s.group}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    aria-current={step === s.id ? "step" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium whitespace-nowrap transition ${
                      step === s.id ? "bg-foreground text-background" : "text-foreground/80 hover:bg-foreground/5"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] ${
                        stepDone(s.id) ? "border-brand bg-brand text-white" : step === s.id ? "border-background/40" : "border-foreground/25"
                      }`}
                    >
                      {stepDone(s.id) ? <CheckIcon className="size-3" strokeWidth={3.5} /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          {step === "learners" && (
            <>
              <StepIntro title="Intended learners" text="These answers appear on your course page and help students decide if it's right for them." />
              <Panel title="What will students learn?" description="At least 4 skills or results students will have by the end.">
                <ListEditor
                  id="outcomes"
                  items={draft.outcomes}
                  onChange={(v) => set("outcomes", v)}
                  min={4}
                  placeholders={["Beatmatch two tracks by ear", "Use EQ to swap basslines cleanly", "Plan a 30-minute set", "Record and share a clean mix"]}
                />
              </Panel>
              <Panel title="Requirements" description="Gear, software or skills students need before starting.">
                <ListEditor id="requirements" items={draft.requirements} onChange={(v) => set("requirements", v)} placeholders={["A laptop and headphones", "Any DJ controller"]} />
              </Panel>
              <Panel title="Who is this course for?" description="Describe the students who will get the most out of it.">
                <ListEditor id="audience" items={draft.audience} onChange={(v) => set("audience", v)} placeholders={["Bedroom DJs preparing for their first gig"]} />
              </Panel>
              <StepNav onNext={() => setStep("curriculum")} nextLabel="Next: Curriculum" />
            </>
          )}

          {step === "curriculum" && (
            <>
              <StepIntro
                title="Curriculum"
                text="Organise lessons into sections. Paste a YouTube link and we'll fetch the title and length; drag lessons to reorder."
                stats={
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <LessonIcon className="size-4" /> {lessons.length} lessons
                    </span>
                    <span>{formatDuration(Math.round(totalSeconds(draft) / 60)) || "0min"} total</span>
                  </div>
                }
              />
              <CurriculumBuilder sections={draft.sections} onChange={(fn) => setDraft((d) => ({ ...d, sections: fn(d.sections) }))} />
              <StepNav onBack={() => setStep("learners")} onNext={() => setStep("landing")} nextLabel="Next: Landing page" />
            </>
          )}

          {step === "landing" && (
            <>
              <StepIntro title="Course landing page" text="Your landing page is how students discover and decide on your course. Make it specific and inviting." />
              <Panel>
                <div className="grid gap-6">
                  <Field label="Course title" htmlFor="title" required aside={<Count n={draft.title.length} max={80} />}>
                    <Input id="title" value={draft.title} maxLength={80} onChange={(e) => set("title", e.target.value)} />
                  </Field>
                  <Field label="Subtitle" htmlFor="subtitle" required aside={<Count n={draft.subtitle.length} max={160} />} hint="Shown on course cards and in search results.">
                    <Input id="subtitle" value={draft.subtitle} maxLength={160} onChange={(e) => set("subtitle", e.target.value)} />
                  </Field>
                  <Field label="Description" htmlFor="description" required hint="At least 50 words. Use headings and lists to make it easy to scan.">
                    <DescriptionEditor id="description" value={draft.description} onChange={(v) => set("description", v)} />
                  </Field>
                  <div className="grid gap-6 md:grid-cols-3">
                    <Field label="Category" htmlFor="category" required>
                      <CategorySelect
                        id="category"
                        category={draft.category}
                        subcategory={draft.subcategory}
                        onChange={(category, subcategory) => setDraft((d) => ({ ...d, category, subcategory }))}
                      />
                    </Field>
                    <Field label="Level" htmlFor="level" required>
                      <Select id="level" value={draft.level} onChange={(e) => set("level", e.target.value as StudioCourse["level"])}>
                        {courseLevels.map((l) => (
                          <option key={l.slug}>{l.name}</option>
                        ))}
                        <option>All Levels</option>
                      </Select>
                    </Field>
                    <Field label="Language" htmlFor="language" required>
                      <Select id="language" value={draft.language} onChange={(e) => set("language", e.target.value)}>
                        {languages.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Field
                    label="Course URL"
                    htmlFor="slug"
                    error={slugTaken ? "Another course already uses this URL." : undefined}
                    hint="Lowercase letters, numbers and dashes. Changing it after publishing breaks old links."
                  >
                    <div className="flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">/courses/</span>
                      <Input id="slug" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="rounded-l-none" aria-invalid={slugTaken || undefined} />
                    </div>
                  </Field>
                </div>
              </Panel>
              <Panel title="Course image" description="Shown on course cards, search results and social shares.">
                <ThumbnailPicker id="thumbnail" value={draft.thumbnail} onChange={(src) => set("thumbnail", src)} />
              </Panel>
              <Panel title="Promo video" description="A short YouTube trailer students can watch before enrolling. Optional, but courses with one get more sign-ups.">
                <Field label="YouTube link" htmlFor="promo" error={draft.promoVideo && !youtubeId(draft.promoVideo) ? "That isn't a YouTube link." : undefined}>
                  <Input id="promo" type="url" value={draft.promoVideo} onChange={(e) => set("promoVideo", e.target.value)} placeholder="https://youtu.be/…" />
                </Field>
                {youtubeId(draft.promoVideo) && (
                  <div className="relative mt-4 aspect-video max-w-sm overflow-hidden rounded-xl bg-neutral-900">
                    <Image src={`https://i.ytimg.com/vi/${youtubeId(draft.promoVideo)}/hqdefault.jpg`} alt="Promo video thumbnail" fill sizes="384px" className="object-cover" />
                  </div>
                )}
              </Panel>
              <StepNav onBack={() => setStep("curriculum")} onNext={() => setStep("access")} nextLabel="Next: Access & delivery" />
            </>
          )}

          {step === "access" && (
            <>
              <StepIntro title="Access & delivery" text="Courses are unlocked by the one-time plans on your pricing page. Choose the lowest plan that includes this course." />
              <Panel title="Plan access">
                <AccessPicker value={draft.access} onChange={(plan) => set("access", plan)} />
              </Panel>
              <Panel title="Delivery">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p id="drip-label" className="text-sm font-medium text-foreground">
                      Drip content
                    </p>
                    <p className="text-sm text-muted-foreground">Unlock one section per week after a student enrolls, instead of everything at once.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.drip}
                    aria-labelledby="drip-label"
                    onClick={() => set("drip", !draft.drip)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${draft.drip ? "bg-brand" : "bg-foreground/15"}`}
                  >
                    <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${draft.drip ? "translate-x-5" : ""}`} />
                  </button>
                </div>
                {draft.drip && (
                  <ol className="mt-4 space-y-1.5 rounded-xl bg-muted/60 p-3 text-sm">
                    {draft.sections.map((s, i) => (
                      <li key={s.id} className="flex justify-between gap-4">
                        <span className="truncate text-foreground">
                          {i + 1}. {s.title || "Untitled section"}
                        </span>
                        <span className="shrink-0 text-muted-foreground">{i === 0 ? "On enrollment" : `Week ${i + 1}`}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <StepNav onBack={() => setStep("landing")} onNext={() => setStep("publish")} nextLabel="Next: Review & publish" />
            </>
          )}

          {step === "publish" && (
            <>
              <StepIntro title="Review & publish" text="Complete every item, then submit your course. Our team reviews new courses within 2 working days." />
              <Panel title="Publishing checklist" description={ready ? "Everything's ready." : `${items.length - doneCount} items left.`}>
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-brand text-white" : "border-2 border-foreground/20"}`}>
                        {item.done && <CheckIcon className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 text-sm ${item.done ? "text-muted-foreground" : "font-medium text-foreground"}`}>{item.label}</span>
                      {!item.done && (
                        <button type="button" onClick={() => setStep(item.step)} className="text-sm font-semibold text-brand hover:underline">
                          Fix
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Status">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={draft.status} />
                    <p className="text-sm text-muted-foreground">
                      {draft.status === "draft" && "Only you can see this course."}
                      {draft.status === "review" && "Waiting for review. You can still edit while you wait."}
                      {draft.status === "published" && "Live on the site for students with the right plan."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.status === "draft" && (
                      <button type="button" disabled={!ready} onClick={() => changeStatus("review")} className={primaryButton}>
                        Submit for review
                      </button>
                    )}
                    {draft.status === "review" && (
                      <>
                        <button type="button" onClick={() => changeStatus("draft")} className={secondaryButton}>
                          Withdraw
                        </button>
                        <button type="button" disabled={!ready} onClick={() => changeStatus("published")} className={primaryButton}>
                          Approve & publish
                        </button>
                      </>
                    )}
                    {draft.status === "published" && (
                      <button type="button" onClick={() => changeStatus("draft")} className={secondaryButton}>
                        Unpublish
                      </button>
                    )}
                  </div>
                </div>
                {draft.students > 0 && (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                    <UsersIcon className="size-4 shrink-0" />
                    {draft.students.toLocaleString("en-US")} students are enrolled. Unpublishing hides the course from new students, but enrolled students keep access.
                  </p>
                )}
              </Panel>

              <Panel title="Delete course" className="border-red-500/25">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Permanently delete this course and all its lessons.</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Delete "${draft.title}"? This can't be undone.`)) return;
                      remove(draft.id);
                      router.push("/studio/courses");
                    }}
                    className="inline-flex h-10 items-center rounded-lg border border-red-500/40 px-4 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    Delete course
                  </button>
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIntro({ title, text, stats }: { title: string; text: string; stats?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{text}</p>
      </div>
      {stats}
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-border pt-5">
      {onBack ? (
        <button type="button" onClick={onBack} className={secondaryButton}>
          Back
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={onNext} className={primaryButton}>
        {nextLabel}
      </button>
    </div>
  );
}

function Count({ n, max }: { n: number; max: number }) {
  return (
    <span className={`text-xs tabular-nums ${n > max * 0.9 ? "text-[#9a6400] dark:text-accent-amber" : "text-muted-foreground"}`}>
      {n}/{max}
    </span>
  );
}
