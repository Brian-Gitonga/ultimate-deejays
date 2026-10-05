"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { submitMix, withdrawMix } from "@/app/(site)/account/mixes/actions";
import { initialAuthState } from "@/lib/auth";
import { mixHost, type MixSubmission } from "@/lib/mixes";
import { FormMessage, SubmitButton, TextField, useFieldErrors } from "./auth-form-parts";
import { ArrowUpRightIcon, CheckIcon, ClockIcon } from "./icons";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function MixSubmitForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(submitMix, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  const courseId = useId();
  const notesId = useId();
  const value = (name: string) => String(state.values?.[name] ?? "");

  return (
    // key: a successful send clears the form.
    <form key={state.status === "notice" ? state.message : "form"} ref={formRef} action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="title" label="Mix name" placeholder="e.g. Friday warm-up set" defaultValue={value("title")} error={errorFor("title")} onEdit={markEdited} />
        <div>
          <label htmlFor={courseId} className="mb-2 block text-sm font-medium text-foreground">
            From a course <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id={courseId}
            name="course"
            defaultValue={value("course")}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-[0.9375rem] text-foreground shadow-xs outline-none transition hover:border-foreground/20 focus:border-brand focus:ring-4 focus:ring-brand/15"
          >
            <option value="">Not for a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TextField
        name="link"
        label="Link to your mix"
        type="url"
        inputMode="url"
        placeholder="https://soundcloud.com/you/your-mix"
        hint="SoundCloud, Mixcloud, YouTube or a shared Google Drive/Dropbox file. Make sure it isn't private."
        defaultValue={value("link")}
        error={errorFor("link")}
        onEdit={markEdited}
      />
      <div>
        <label htmlFor={notesId} className="mb-2 block text-sm font-medium text-foreground">
          What should we listen for? <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={notesId}
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={value("notes")}
          onInput={() => markEdited("notes")}
          placeholder="e.g. Are my transitions too long? Is the energy right for a warm-up?"
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-[0.9375rem] text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/80 hover:border-foreground/20 focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        {errorFor("notes") && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorFor("notes")}</p>}
      </div>
      <div className="sm:w-56">
        <SubmitButton pending={pending} pendingLabel="Sending…">
          Send for feedback
        </SubmitButton>
      </div>
    </form>
  );
}

export function MixList({ mixes }: { mixes: MixSubmission[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  return (
    <ul className="space-y-4">
      {error && (
        <li role="alert" className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </li>
      )}
      {mixes.map((mix) => (
        <li key={mix.id} className="rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{mix.title}</p>
              <p className="text-sm text-muted-foreground">
                Sent {dateFormat.format(new Date(mix.createdAt))}
                {mix.courseTitle ? ` · ${mix.courseTitle}` : ""}
              </p>
            </div>
            {mix.status === "reviewed" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-deep dark:text-brand">
                <CheckIcon className="size-3" strokeWidth={3} /> Feedback ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-xs font-medium text-foreground/80">
                <ClockIcon className="size-3" /> Waiting for feedback
              </span>
            )}
          </div>
          <a href={mix.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            Open on {mixHost(mix.link)} <ArrowUpRightIcon className="size-3.5" />
          </a>
          {mix.feedback && (
            <div className="mt-4 rounded-xl border-l-4 border-brand bg-brand/[0.05] px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Instructor feedback</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed whitespace-pre-line text-foreground/85">{mix.feedback}</p>
            </div>
          )}
          {mix.status === "pending" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Withdraw "${mix.title}"? It won't count toward your plan's mix reviews.`)) return;
                setError("");
                start(async () => {
                  const result = await withdrawMix(mix.id);
                  if (!result.ok) setError(result.error);
                });
              }}
              className="mt-3 text-sm font-medium text-muted-foreground hover:text-red-600"
            >
              Withdraw
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
