"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { courseLevels } from "@/lib/course-taxonomy";
import { languages, newCourse, slugify, type StudioCourse } from "@/lib/studio-courses";
import { useStudioCourses } from "@/lib/studio-store";
import { ArrowRightIcon } from "../icons";
import { AccessPicker, CategorySelect, ThumbnailPicker } from "./course-fields";
import { Field, Input, Panel, Select, Textarea, primaryButton } from "./ui";

const TITLE_MAX = 80;
const SUBTITLE_MAX = 160;

export function CourseCreateForm({ seed, instructor }: { seed: StudioCourse[]; instructor: StudioCourse["instructor"] }) {
  const router = useRouter();
  const { courses, save } = useStudioCourses(seed);
  const [draft, setDraft] = useState(() => newCourse({}, instructor));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = <K extends keyof StudioCourse>(key: K, value: StudioCourse[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const title = draft.title.trim();
    const found: Record<string, string> = {};
    if (title.length < 10) found.title = "Give your course a title of at least 10 characters.";
    if (!draft.category) found.category = "Choose the category students will find this course in.";
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }

    // Keep URLs unique: add a suffix if another course already uses this slug.
    let slug = slugify(title);
    while (courses.some((c) => c.slug === slug)) slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 5)}`;

    setBusy(true);
    try {
      const created = save({ ...draft, title, subtitle: draft.subtitle.trim(), slug });
      router.push(`/studio/courses/${created.id}/edit?step=curriculum&created=1`);
    } catch (error) {
      setSaveError((error as Error).message);
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <Panel>
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Field
              label="Title"
              htmlFor="title"
              required
              error={errors.title}
              aside={<span className="text-xs text-muted-foreground tabular-nums">{draft.title.length}/{TITLE_MAX}</span>}
              hint="Be specific: say what students will be able to do. E.g. “Beat Juggling 101: Build Your First Routine”."
            >
              <Input
                id="title"
                value={draft.title}
                maxLength={TITLE_MAX}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Enter a course title"
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={errors.title ? "title-error" : undefined}
                autoFocus
              />
            </Field>

            <Field
              label="Short description"
              htmlFor="subtitle"
              aside={<span className="text-xs text-muted-foreground tabular-nums">{draft.subtitle.length}/{SUBTITLE_MAX}</span>}
              hint="One or two sentences shown on course cards and search results."
            >
              <Textarea
                id="subtitle"
                rows={3}
                maxLength={SUBTITLE_MAX}
                value={draft.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="What will students learn, and who is it for?"
              />
            </Field>

            <Field label="Course image" htmlFor="thumbnail" hint="You can change this later in the course editor.">
              <ThumbnailPicker id="thumbnail" value={draft.thumbnail} onChange={(src) => set("thumbnail", src)} />
            </Field>
          </div>

          <div className="space-y-6">
            <Field label="Category" htmlFor="category" required error={errors.category}>
              <CategorySelect
                id="category"
                category={draft.category}
                subcategory={draft.subcategory}
                invalid={!!errors.category}
                onChange={(category, subcategory) => {
                  set("category", category);
                  set("subcategory", subcategory);
                }}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Course level" htmlFor="level" required>
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

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-foreground">
                Who gets access <span className="text-red-600 dark:text-red-400">*</span>
              </legend>
              <p className="mb-3 text-xs text-muted-foreground">Courses are unlocked by a one-time plan, not sold one by one.</p>
              <AccessPicker value={draft.access} onChange={(plan) => set("access", plan)} />
            </fieldset>

            <div className="flex items-start justify-between gap-6 rounded-xl border border-border p-4">
              <div>
                <p id="drip-label" className="text-sm font-medium text-foreground">
                  Drip content
                </p>
                <p className="text-xs text-muted-foreground">Unlock one section per week instead of everything at once.</p>
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
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">It starts as a draft. Nothing is visible to students until you publish.</p>
          <div className="flex flex-col items-end gap-2">
            <button type="submit" disabled={busy} className={`${primaryButton} h-11 px-5`}>
              {busy ? "Creating…" : "Create course & add lessons"}
              <ArrowRightIcon className="size-4" />
            </button>
            {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}
          </div>
        </div>
      </Panel>
    </form>
  );
}
