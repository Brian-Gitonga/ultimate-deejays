"use client";

import Image from "next/image";
import { useState, type DragEvent } from "react";
import { inspectYouTube } from "@/app/(studio)/studio/courses/actions";
import { formatClock, youtubeId } from "@/lib/curriculum";
import { uid, type StudioLesson, type StudioSection } from "@/lib/studio-courses";
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  LessonIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
} from "../icons";
import { Field, Input, Textarea, ghostIconButton, inputClass, primaryButton, secondaryButton } from "./ui";

type Drag = { sectionId: string; lessonId: string } | null;

/** "7:36" or "1:02:05" -> seconds; returns null for anything else. */
function parseClock(text: string): number | null {
  const parts = text.trim().split(":").map(Number);
  if (!parts.length || parts.some((n) => !Number.isInteger(n) || n < 0) || parts.length > 3) return null;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

const newLesson = (partial: Partial<StudioLesson> = {}): StudioLesson => ({
  id: uid(),
  title: "",
  youtube: "",
  durationSeconds: 0,
  summary: "",
  preview: false,
  resources: [],
  ...partial,
});

export function CurriculumBuilder({
  sections,
  onChange: update,
}: {
  sections: StudioSection[];
  /** Receives an updater, applied to the latest sections (so async YouTube lookups never overwrite newer edits) */
  onChange: (fn: (sections: StudioSection[]) => StudioSection[]) => void;
}) {
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [fetching, setFetching] = useState<string[]>([]);
  const [videoErrors, setVideoErrors] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<Drag>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [bulkFor, setBulkFor] = useState<string | null>(null);

  const patchLesson = (lessonId: string, patch: Partial<StudioLesson>) =>
    update((all) => all.map((s) => ({ ...s, lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) })));

  async function fetchDetails(lessonId: string, link: string, { overwriteTitle }: { overwriteTitle: boolean }) {
    setFetching((f) => [...f, lessonId]);
    setVideoErrors((errors) => {
      const next = { ...errors };
      delete next[lessonId];
      return next;
    });
    const info = await inspectYouTube(link);
    setFetching((f) => f.filter((id) => id !== lessonId));
    if (!info.ok) {
      setVideoErrors((e) => ({ ...e, [lessonId]: info.error }));
      return;
    }
    update((all) =>
      all.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, title: overwriteTitle || !l.title ? info.title : l.title, durationSeconds: info.durationSeconds ?? l.durationSeconds }
            : l,
        ),
      })),
    );
  }

  function addLessons(sectionId: string, inputs: string[]) {
    const lessons = inputs.map((text) => (youtubeId(text) ? newLesson({ youtube: text.trim() }) : newLesson({ title: text.trim() })));
    update((all) => all.map((s) => (s.id === sectionId ? { ...s, lessons: [...s.lessons, ...lessons] } : s)));
    for (const lesson of lessons) if (lesson.youtube) fetchDetails(lesson.id, lesson.youtube, { overwriteTitle: true });
    if (lessons.length === 1 && !lessons[0].youtube) setOpenLesson(lessons[0].id);
  }

  function moveLesson(lessonId: string, toSectionId: string, toIndex: number) {
    update((all) => {
      const lesson = all.flatMap((s) => s.lessons).find((l) => l.id === lessonId);
      if (!lesson) return all;
      const without = all.map((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }));
      return without.map((s) => {
        if (s.id !== toSectionId) return s;
        const lessons = [...s.lessons];
        lessons.splice(Math.min(toIndex, lessons.length), 0, lesson);
        return { ...s, lessons };
      });
    });
  }

  function onDrop(event: DragEvent, sectionId: string, index: number) {
    event.preventDefault();
    setDropTarget(null);
    if (!drag) return;
    const from = sections.find((s) => s.id === drag.sectionId)!;
    const fromIndex = from.lessons.findIndex((l) => l.id === drag.lessonId);
    // Dropping lower in the same section: account for the lesson leaving its old slot.
    const adjusted = drag.sectionId === sectionId && fromIndex < index ? index - 1 : index;
    moveLesson(drag.lessonId, sectionId, adjusted);
    setDrag(null);
  }

  const moveSection = (index: number, delta: number) =>
    update((all) => {
      const next = [...all];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  // Lessons are numbered across the whole course, like the player shows them.
  const offsets = sections.map((_, i) => sections.slice(0, i).reduce((sum, sec) => sum + sec.lessons.length, 0));

  return (
    <div className="space-y-5">
      {sections.map((section, sIndex) => {
        const isCollapsed = collapsed.includes(section.id);
        const seconds = section.lessons.reduce((sum, l) => sum + l.durationSeconds, 0);
        return (
          <section key={section.id} aria-label={`Section ${sIndex + 1}: ${section.title}`} className="rounded-2xl border border-border bg-muted/40">
            <header className="flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setCollapsed((c) => (isCollapsed ? c.filter((id) => id !== section.id) : [...c, section.id]))}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
                className={ghostIconButton}
              >
                <ChevronDownIcon className={`size-4 transition ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
              <span className="shrink-0 text-sm font-semibold text-foreground">Section {sIndex + 1}:</span>
              <input
                value={section.title}
                onChange={(e) => update((all) => all.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s)))}
                placeholder="Section title"
                aria-label={`Section ${sIndex + 1} title`}
                maxLength={80}
                className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-brand focus:bg-background focus:ring-4 focus:ring-brand/15"
              />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {section.lessons.length} lessons · {formatClock(seconds)}
              </span>
              <div className="flex shrink-0">
                <button type="button" onClick={() => moveSection(sIndex, -1)} disabled={sIndex === 0} aria-label="Move section up" className={ghostIconButton}>
                  <ChevronDownIcon className="size-4 rotate-180" />
                </button>
                <button type="button" onClick={() => moveSection(sIndex, 1)} disabled={sIndex === sections.length - 1} aria-label="Move section down" className={ghostIconButton}>
                  <ChevronDownIcon className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete section"
                  onClick={() => {
                    if (section.lessons.length && !window.confirm(`Delete "${section.title}" and its ${section.lessons.length} lessons?`)) return;
                    update((all) => all.filter((s) => s.id !== section.id));
                  }}
                  className={`${ghostIconButton} hover:text-red-600`}
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
            </header>

            {!isCollapsed && (
              <div className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
                <ol className="space-y-2">
                  {section.lessons.map((lesson, lIndex) => {
                    const lessonNumber = offsets[sIndex] + lIndex + 1;
                    const open = openLesson === lesson.id;
                    const id = youtubeId(lesson.youtube);
                    const loading = fetching.includes(lesson.id);
                    const dropKey = `${section.id}:${lIndex}`;
                    return (
                      <li
                        key={lesson.id}
                        onDragOver={(e) => {
                          if (!drag) return;
                          e.preventDefault();
                          setDropTarget(dropKey);
                        }}
                        onDrop={(e) => onDrop(e, section.id, lIndex)}
                        className={`rounded-xl border bg-card transition ${dropTarget === dropKey ? "border-brand shadow-[0_-3px_0_0_var(--brand)]" : "border-border"} ${
                          drag?.lessonId === lesson.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 px-2 py-2 sm:px-3">
                          <span
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "move";
                              setDrag({ sectionId: section.id, lessonId: lesson.id });
                            }}
                            onDragEnd={() => {
                              setDrag(null);
                              setDropTarget(null);
                            }}
                            title="Drag to reorder"
                            aria-hidden="true"
                            className="hidden cursor-grab px-1 text-muted-foreground active:cursor-grabbing sm:block"
                          >
                            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                              {[5, 12, 19].flatMap((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
                            </svg>
                          </span>
                          <span
                            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                              loading ? "animate-pulse bg-brand/10 text-brand" : id ? "bg-brand/10 text-brand" : "bg-accent-amber/15 text-[#9a6400] dark:text-accent-amber"
                            }`}
                            title={id ? "Video linked" : "Needs a YouTube link"}
                          >
                            <LessonIcon className="size-4" />
                          </span>
                          <button type="button" onClick={() => setOpenLesson(open ? null : lesson.id)} aria-expanded={open} className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-medium text-foreground">
                              <span className="text-muted-foreground">Lesson {lessonNumber}:</span>{" "}
                              {loading && !lesson.title ? "Fetching video details…" : lesson.title || "Untitled lesson"}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              {lesson.durationSeconds ? formatClock(lesson.durationSeconds) : "No length yet"}
                              {!id && <span className="font-medium text-[#9a6400] dark:text-accent-amber">· Needs a YouTube link</span>}
                              {lesson.resources.length > 0 && <span>· {lesson.resources.length} resources</span>}
                            </span>
                          </button>
                          {lesson.preview && (
                            <span className="hidden shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-deep sm:inline dark:text-brand">Free preview</span>
                          )}
                          <button type="button" onClick={() => setOpenLesson(open ? null : lesson.id)} aria-label={open ? "Close lesson editor" : "Edit lesson"} className={ghostIconButton}>
                            {open ? <ChevronDownIcon className="size-4 rotate-180" /> : <PencilIcon className="size-4" />}
                          </button>
                        </div>

                        {open && (
                          <LessonEditor
                            lesson={lesson}
                            loading={loading}
                            videoError={videoErrors[lesson.id]}
                            sections={sections}
                            sectionId={section.id}
                            onPatch={(patch) => patchLesson(lesson.id, patch)}
                            onFetch={(link) => fetchDetails(lesson.id, link, { overwriteTitle: false })}
                            onMove={(delta) => moveLesson(lesson.id, section.id, lIndex + delta)}
                            canMoveUp={lIndex > 0}
                            canMoveDown={lIndex < section.lessons.length - 1}
                            onMoveTo={(targetId) => moveLesson(lesson.id, targetId, Infinity)}
                            onDelete={() => update((all) => all.map((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== lesson.id) })))}
                            onClose={() => setOpenLesson(null)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>

                {/* End-of-section drop zone */}
                {drag && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTarget(`${section.id}:end`);
                    }}
                    onDrop={(e) => onDrop(e, section.id, section.lessons.length)}
                    className={`rounded-xl border-2 border-dashed py-3 text-center text-xs text-muted-foreground ${
                      dropTarget === `${section.id}:end` ? "border-brand bg-brand/5" : "border-border"
                    }`}
                  >
                    Drop here to move to the end of this section
                  </div>
                )}

                {bulkFor === section.id ? (
                  <BulkAdd
                    onAdd={(lines) => {
                      addLessons(section.id, lines);
                      setBulkFor(null);
                    }}
                    onCancel={() => setBulkFor(null)}
                  />
                ) : (
                  <QuickAdd onAdd={(text) => addLessons(section.id, [text])} onBulk={() => setBulkFor(section.id)} />
                )}
              </div>
            )}
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => update((all) => [...all, { id: uid(), title: `Section ${all.length + 1}`, lessons: [] }])}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-foreground transition hover:border-brand hover:bg-brand/5 hover:text-brand"
      >
        <PlusIcon className="size-4" />
        Add section
      </button>
    </div>
  );
}

function QuickAdd({ onAdd, onBulk }: { onAdd: (text: string) => void; onBulk: () => void }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text);
        setText("");
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <LinkIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a YouTube link, or type a lesson title"
          aria-label="New lesson: YouTube link or title"
          className={`${inputClass} h-10 pl-9 text-sm`}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={!text.trim()} className={`${primaryButton} flex-1 sm:flex-none`}>
          <PlusIcon className="size-4" /> Add lesson
        </button>
        <button type="button" onClick={onBulk} className={secondaryButton}>
          Bulk add
        </button>
      </div>
    </form>
  );
}

function BulkAdd({ onAdd, onCancel }: { onAdd: (lines: string[]) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const links = lines.filter((l) => youtubeId(l)).length;
  return (
    <div className="rounded-xl border border-brand/30 bg-card p-3">
      <label htmlFor="bulk-links" className="text-sm font-semibold text-foreground">
        Bulk add lessons
      </label>
      <p className="mt-0.5 text-xs text-muted-foreground">One YouTube link (or title) per line. Titles and lengths fill in automatically.</p>
      <Textarea
        id="bulk-links"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"https://youtu.be/…\nhttps://www.youtube.com/watch?v=…"}
        className="mt-2 font-mono text-xs"
        autoFocus
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {lines.length} lessons · {links} YouTube links
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" disabled={!lines.length} onClick={() => onAdd(lines)} className={primaryButton}>
            Add {lines.length || ""} lessons
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonEditor({
  lesson,
  loading,
  videoError,
  sections,
  sectionId,
  onPatch,
  onFetch,
  onMove,
  canMoveUp,
  canMoveDown,
  onMoveTo,
  onDelete,
  onClose,
}: {
  lesson: StudioLesson;
  loading: boolean;
  videoError?: string;
  sections: StudioSection[];
  sectionId: string;
  onPatch: (patch: Partial<StudioLesson>) => void;
  onFetch: (link: string) => void;
  onMove: (delta: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveTo: (sectionId: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const id = youtubeId(lesson.youtube);
  const [clock, setClock] = useState(lesson.durationSeconds ? formatClock(lesson.durationSeconds) : "");
  const [seenDuration, setSeenDuration] = useState(lesson.durationSeconds);
  if (lesson.durationSeconds !== seenDuration) {
    setSeenDuration(lesson.durationSeconds);
    setClock(lesson.durationSeconds ? formatClock(lesson.durationSeconds) : "");
  }
  const clockInvalid = clock !== "" && parseClock(clock) === null;
  const p = `lesson-${lesson.id}`;

  return (
    <div className="border-t border-border p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-4">
          <Field label="Lesson title" htmlFor={`${p}-title`} required>
            <Input id={`${p}-title`} value={lesson.title} maxLength={100} onChange={(e) => onPatch({ title: e.target.value })} placeholder="e.g. Counting phrases in house music" />
          </Field>

          <Field
            label="YouTube link"
            htmlFor={`${p}-yt`}
            required
            error={videoError ?? (lesson.youtube && !id ? "That isn't a YouTube link." : undefined)}
            hint="Public or unlisted videos with embedding allowed."
          >
            <div className="flex gap-2">
              <Input
                id={`${p}-yt`}
                type="url"
                value={lesson.youtube}
                onChange={(e) => onPatch({ youtube: e.target.value })}
                onBlur={(e) => youtubeId(e.target.value) && !lesson.durationSeconds && onFetch(e.target.value)}
                placeholder="https://youtu.be/…"
                aria-invalid={videoError || (lesson.youtube && !id) ? true : undefined}
              />
              <button type="button" disabled={!id || loading} onClick={() => onFetch(lesson.youtube)} className={`${secondaryButton} h-11 shrink-0`}>
                {loading ? "Checking…" : "Get details"}
              </button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Length" htmlFor={`${p}-len`} error={clockInvalid ? "Use mm:ss" : undefined}>
              <Input
                id={`${p}-len`}
                inputMode="numeric"
                value={clock}
                onChange={(e) => {
                  setClock(e.target.value);
                  const seconds = parseClock(e.target.value);
                  if (seconds !== null) {
                    setSeenDuration(seconds);
                    onPatch({ durationSeconds: seconds });
                  }
                }}
                placeholder="mm:ss"
                aria-invalid={clockInvalid || undefined}
              />
            </Field>
            <div className="flex items-end">
              <label className="flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3.5 text-sm">
                <span>
                  <span className="font-medium text-foreground">Free preview</span>
                  <span className="block text-xs text-muted-foreground">Anyone can watch it before buying</span>
                </span>
                <input type="checkbox" checked={lesson.preview} onChange={(e) => onPatch({ preview: e.target.checked })} className="size-[1.125rem] accent-brand" />
              </label>
            </div>
          </div>

          <Field label="Lesson summary" htmlFor={`${p}-summary`} hint="Shown under the video in the player.">
            <Textarea id={`${p}-summary`} rows={3} maxLength={500} value={lesson.summary} onChange={(e) => onPatch({ summary: e.target.value })} placeholder="What will students practice in this lesson?" />
          </Field>

          <Resources lesson={lesson} onPatch={onPatch} />
        </div>

        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
            {id ? (
              <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill sizes="256px" className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center px-4 text-center text-xs text-white/60">Video preview appears when you add a link</span>
            )}
            {loading && <span className="absolute inset-0 animate-pulse bg-white/10" />}
          </div>
          {id && (
            <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" className="block text-xs font-medium text-brand hover:underline">
              Open on YouTube ↗
            </a>
          )}

          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Arrange</p>
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={!canMoveUp} onClick={() => onMove(-1)} className={`${secondaryButton} h-9 flex-1 px-2 text-xs`}>
                Move up
              </button>
              <button type="button" disabled={!canMoveDown} onClick={() => onMove(1)} className={`${secondaryButton} h-9 flex-1 px-2 text-xs`}>
                Move down
              </button>
            </div>
            {sections.length > 1 && (
              <select
                value=""
                onChange={(e) => e.target.value && onMoveTo(e.target.value)}
                aria-label="Move to another section"
                className={`${inputClass} mt-2 h-9 text-xs dark:[color-scheme:dark]`}
              >
                <option value="">Move to section…</option>
                {sections.filter((s) => s.id !== sectionId).map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {i + 1}. {s.title || "Untitled section"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={() => window.confirm(`Delete "${lesson.title || "this lesson"}"?`) && onDelete()} className="text-sm font-medium text-red-600 hover:underline dark:text-red-400">
          Delete lesson
        </button>
        <button type="button" onClick={onClose} className={primaryButton}>
          <CheckIcon className="size-4" /> Done
        </button>
      </div>
    </div>
  );
}

function Resources({ lesson, onPatch }: { lesson: StudioLesson; onPatch: (patch: Partial<StudioLesson>) => void }) {
  const set = (resources: StudioLesson["resources"]) => onPatch({ resources });
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">Downloadable resources</legend>
      <p className="mt-0.5 text-xs text-muted-foreground">Practice tracks, stems or cue sheets, as links (Google Drive, Dropbox…).</p>
      <ul className="mt-2 space-y-2">
        {lesson.resources.map((r, i) => (
          <li key={r.id} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={r.label}
              onChange={(e) => set(lesson.resources.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)))}
              placeholder="Label, e.g. Practice track (WAV)"
              aria-label={`Resource ${i + 1} label`}
              className={`${inputClass} h-10 text-sm sm:w-56`}
            />
            <div className="flex flex-1 gap-2">
              <input
                type="url"
                value={r.url}
                onChange={(e) => set(lesson.resources.map((x) => (x.id === r.id ? { ...x, url: e.target.value } : x)))}
                placeholder="https://"
                aria-label={`Resource ${i + 1} link`}
                aria-invalid={r.url && !/^https:\/\/\S+$/.test(r.url) ? true : undefined}
                className={`${inputClass} h-10 text-sm`}
              />
              <button type="button" aria-label={`Remove resource ${i + 1}`} onClick={() => set(lesson.resources.filter((x) => x.id !== r.id))} className={`${ghostIconButton} size-10`}>
                <CloseIcon className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => set([...lesson.resources, { id: uid(), label: "", url: "" }])}
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-deep hover:bg-brand/10 dark:text-brand"
      >
        <PlusIcon className="size-4" /> Add resource
      </button>
    </fieldset>
  );
}
