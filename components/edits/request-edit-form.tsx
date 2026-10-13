"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type ReactNode } from "react";
import { requestEdit } from "@/app/(site)/account/edits/actions";
import { checkAnswers, FILE_LIMIT_BYTES, FILE_TYPES, uploadPathFor, type EditField } from "@/lib/edits";
import { normalizePhone } from "@/lib/phone";
import { formatSize } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "../auth-form-parts";
import { CheckIcon, CloseIcon, FileTextIcon, PlusIcon } from "../icons";
import { StoreCover } from "../store/store-cover";

export type EditTemplate = { slug: string; title: string; thumbnail: string; category: string; lowerThird: boolean; href: string };

/** The errors without one field's (it's being fixed). */
const without = (errors: Record<string, string>, key: string) => Object.fromEntries(Object.entries(errors).filter(([k]) => k !== key));
type Value = { value: string; name?: string; size?: number };

/*
 * An edit request for one template: the fields the team set up in Studio →
 * Store, notes, and the member's phone number for a text when it's ready.
 * Files upload straight to the member's folder in the private edits bucket;
 * the request saves their paths. Used by the modal on the template page and
 * by /account/edits/new.
 */
export function useEditRequest({ slug, form, userId, savedPhone }: { slug: string; form: EditField[]; userId: string; savedPhone: string }) {
  const [values, setValues] = useState<Record<string, Value>>({});
  const [phone, setPhoneValue] = useState(savedPhone);
  const [textMe, setTextMe] = useState(true);
  const [notes, setNotesValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const set = (id: string, value: Value) => {
    setValues((v) => ({ ...v, [id]: value }));
    setErrors((e) => without(e, id));
  };
  const setPhone = (value: string) => {
    setPhoneValue(value);
    setErrors((e) => without(e, "phone"));
  };
  const setNotes = (value: string) => {
    setNotesValue(value);
    setErrors((e) => without(e, "notes"));
  };

  const uploads = form.filter((f) => f.type === "file").flatMap((f) => (values[f.id]?.value ? [values[f.id].value] : []));
  /** They've typed or attached something that closing would lose. */
  const dirty = Object.values(values).some((v) => v.value.trim()) || !!notes.trim() || phone.trim() !== savedPhone.trim();

  /** Takes them to the first field that needs fixing. */
  function focusFirst(found: Record<string, string>) {
    const key = [...form.map((f) => f.id), "notes", "phone"].find((k) => found[k]);
    if (!key) return;
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.querySelector(`[data-field="${key}"]`)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      document.getElementById(`edit-${key}`)?.focus({ preventScroll: true });
    });
  }

  function fail(found: Record<string, string>, message?: string) {
    const count = Object.keys(found).length;
    setErrors(found);
    setFormError(message ?? (count === 1 ? "One field needs a look." : `${count} fields need a look.`));
    focusFirst(found);
  }

  /** Checks it here first (instant), then sends it. Resolves to the new request's id, or null. */
  async function submit(): Promise<string | null> {
    if (uploading.length) {
      setFormError("Wait for your files to finish uploading.");
      return null;
    }
    const found: Record<string, string> = {};
    const checked = checkAnswers(form, values, userId);
    if (!checked.ok) Object.assign(found, checked.errors);
    const normalized = normalizePhone(phone);
    if (normalized === null) found.phone = "Enter your number like 0712 345 678, or with its country code (+44…).";
    else if (textMe && !normalized) found.phone = "Add your number so we can text you, or untick the box below.";
    if (notes.trim().length > 2000) found.notes = "Keep your notes under 2,000 characters.";
    if (Object.keys(found).length) {
      fail(found);
      return null;
    }

    setBusy(true);
    setFormError("");
    const result = await requestEdit({ slug, values, notes, phone, textMe }).catch(() => ({
      ok: false as const,
      error: "We couldn't reach the server. Check your connection and try again.",
    }));
    setBusy(false);
    if (result.ok) return result.id;
    if ("fieldErrors" in result && result.fieldErrors && Object.keys(result.fieldErrors).length) fail(result.fieldErrors, result.error);
    else setFormError(result.error);
    return null;
  }

  /** Removes what they uploaded, when they discard the request. */
  function discardUploads() {
    if (uploads.length) createClient().storage.from("edits").remove(uploads).catch(() => {});
  }

  return { values, set, phone, setPhone, textMe, setTextMe, notes, setNotes, errors, formError, uploading, setUploading, busy, dirty, submit, discardUploads, form, userId };
}

export type EditRequestState = ReturnType<typeof useEditRequest>;

/* A numbered part of the form. */
function Part({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand-deep dark:text-brand">{n}</span>
        <div className="min-w-0">
          <h3 id={id} className="font-semibold text-foreground">
            {title}
          </h3>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-5 sm:pl-9">{children}</div>
    </section>
  );
}

/* Every field of the request, in numbered parts. */
export function EditRequestFields({ state }: { state: EditRequestState }) {
  const { form, values, set, errors, userId, setUploading, notes, setNotes, phone, setPhone, textMe, setTextMe } = state;
  let n = 0;
  return (
    <div className="space-y-8">
      {form.length > 0 && (
        <Part n={++n} title="What goes on it" hint="Type it exactly as it should appear. Fields marked * are needed.">
          {form.map((f) => (
            <FieldInput key={f.id} field={f} value={values[f.id]} error={errors[f.id]} onChange={(v) => set(f.id, v)} userId={userId} setUploading={setUploading} />
          ))}
        </Part>
      )}

      <Part n={++n} title="Anything else?" hint="Timing, style, a reference you like. Optional.">
        <Shell id="edit-notes" field="notes" label="Notes for our team" error={errors.notes}>
          <textarea
            id="edit-notes"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass(!!errors.notes)} h-auto min-h-24 py-3 [field-sizing:content]`}
          />
        </Shell>
      </Part>

      <Part n={++n} title="Where we reach you" hint="We'll text you when it's ready, and if we have a question.">
        <Shell id="edit-phone" field="phone" label="Phone number" error={errors.phone} hint="Kenyan numbers can start with 07. Others need their country code (+44…).">
          <input
            id="edit-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass(!!errors.phone)}
          />
        </Shell>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <input type="checkbox" checked={textMe} onChange={(e) => setTextMe(e.target.checked)} className="size-4 accent-[var(--brand)]" />
          Text me when my edit is ready
        </label>
      </Part>
    </div>
  );
}

/* /account/edits/new: the form on its own page, for anyone who lands there. */
export function RequestEditForm({
  template,
  form,
  turnaround,
  userId,
  phone,
  meter,
}: {
  template: EditTemplate;
  form: EditField[];
  turnaround: string;
  userId: string;
  phone: string;
  /** "2 of 3 edit requests left this month · resets 1 Nov", or null when unlimited */
  meter: string | null;
}) {
  const router = useRouter();
  const state = useEditRequest({ slug: template.slug, form, userId, savedPhone: phone });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const id = await state.submit();
    if (id) router.push(`/account/edits/${id}?sent=1`);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <form onSubmit={submit} noValidate className="min-w-0 rounded-2xl border border-black/[0.06] bg-card shadow-[0_8px_30px_-6px_rgb(0_0_0/0.06)] dark:border-white/10">
        <div className="p-5 sm:p-7">
          <EditRequestFields state={state} />
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.formError}
          </p>
          <SendButton state={state} />
        </footer>
      </form>

      <aside aria-label="About this request" className="space-y-4 xl:sticky xl:top-28">
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-card dark:border-white/10">
          <div className="group relative aspect-video bg-muted">
            <StoreCover resource={template} sizes="(min-width: 1280px) 304px, 92vw" />
          </div>
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Editing</p>
            <Link href={template.href} className="mt-0.5 block font-semibold text-foreground hover:text-brand">
              {template.title}
            </Link>
            {turnaround && <p className="mt-2 text-sm text-muted-foreground">{turnaround}</p>}
            {meter && <p className="mt-2 text-sm font-medium text-brand-deep dark:text-brand">{meter}</p>}
          </div>
        </div>
        <NextSteps />
      </aside>
    </div>
  );
}

const nextSteps = ["We get your request and start on it.", "If anything's unclear, we ask you in My edits (and by text).", "Your edited files land in My edits, ready to download."];

export function NextSteps({ className = "rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/10" }: { className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-foreground">What happens next</h3>
      <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
        {nextSteps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand-deep dark:text-brand">{i + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* Send request, or why it can't send yet. */
export function SendButton({ state, className = "" }: { state: EditRequestState; className?: string }) {
  const waiting = state.busy || state.uploading.length > 0;
  return (
    <button
      type="submit"
      disabled={waiting}
      className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white transition hover:bg-[#27272a] disabled:cursor-progress disabled:opacity-70 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90 ${className}`}
    >
      {waiting && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />}
      {state.busy ? "Sending…" : state.uploading.length ? "Uploading…" : "Send request"}
    </button>
  );
}

function Shell({ id, field, label, required, error, hint, children }: { id: string; field: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div data-field={field}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FieldInput({
  field: f,
  value,
  error,
  onChange,
  userId,
  setUploading,
}: {
  field: EditField;
  value: Value | undefined;
  error?: string;
  onChange: (value: Value) => void;
  userId: string;
  setUploading: (update: (list: string[]) => string[]) => void;
}) {
  const id = `edit-${f.id}`;
  const text = value?.value ?? "";
  const shell = (control: ReactNode) => (
    <Shell id={id} field={f.id} label={f.label} required={f.required} error={error} hint={f.help}>
      {control}
    </Shell>
  );

  switch (f.type) {
    case "textarea":
      return shell(
        <textarea id={id} rows={4} maxLength={2000} placeholder={f.placeholder} value={text} onChange={(e) => onChange({ value: e.target.value })} className={`${inputClass(!!error)} h-auto py-3`} />,
      );
    case "select":
      return shell(
        <select id={id} value={text} onChange={(e) => onChange({ value: e.target.value })} className={`${inputClass(!!error)} cursor-pointer dark:[color-scheme:dark]`}>
          <option value="">Choose…</option>
          {f.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>,
      );
    case "color":
      return shell(
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label={`${f.label}: pick a colour`}
            value={/^#[0-9a-f]{6}$/i.test(text) ? text : "#00a76f"}
            onChange={(e) => onChange({ value: e.target.value })}
            className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-border bg-background p-1"
          />
          <input id={id} value={text} maxLength={7} placeholder="#00A76F" onChange={(e) => onChange({ value: e.target.value })} className={`${inputClass(!!error)} max-w-40 font-mono uppercase`} />
        </div>,
      );
    case "file":
      return shell(<FileInput id={id} value={value} invalid={!!error} onChange={onChange} userId={userId} setUploading={setUploading} />);
    default:
      return shell(
        <input
          id={id}
          type={f.type === "url" ? "url" : "text"}
          inputMode={f.type === "url" ? "url" : undefined}
          maxLength={300}
          placeholder={f.placeholder}
          value={text}
          onChange={(e) => onChange({ value: e.target.value })}
          className={inputClass(!!error)}
        />,
      );
  }
}

/* Uploads to edits/uploads/<member>/… as soon as a file is picked. */
function FileInput({
  id,
  value,
  invalid,
  onChange,
  userId,
  setUploading,
}: {
  id: string;
  value: Value | undefined;
  invalid: boolean;
  onChange: (value: Value) => void;
  userId: string;
  setUploading: (update: (list: string[]) => string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > FILE_LIMIT_BYTES) {
      setState("error");
      setMessage(`That file is ${formatSize(file.size)}. Files can be up to 10 MB.`);
      return;
    }
    if (file.type && !FILE_TYPES.includes(file.type)) {
      setState("error");
      setMessage("Upload an image (PNG, JPG, WebP, SVG), a PDF or a ZIP.");
      return;
    }
    setState("uploading");
    setMessage("");
    setUploading((list) => [...list, id]);
    const path = uploadPathFor(userId, file.name);
    const { error } = await createClient().storage.from("edits").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    setUploading((list) => list.filter((x) => x !== id));
    if (error) {
      setState("error");
      setMessage("That didn't upload. Try again in a moment.");
      return;
    }
    // Replacing a file removes the earlier upload.
    if (value?.value) createClient().storage.from("edits").remove([value.value]).catch(() => {});
    setState("idle");
    onChange({ value: path, name: file.name, size: file.size });
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove() {
    if (value?.value) createClient().storage.from("edits").remove([value.value]).catch(() => {});
    onChange({ value: "" });
  }

  return (
    <div>
      <input ref={inputRef} id={id} type="file" accept={FILE_TYPES.join(",")} className="sr-only" aria-describedby={hintId} onChange={(e) => pick(e.target.files?.[0])} />
      {value?.value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <CheckIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{value.name}</span>
            {value.size ? <span className="text-xs text-muted-foreground">{formatSize(value.size)} · uploaded</span> : null}
          </span>
          <button type="button" onClick={remove} aria-label={`Remove ${value.name}`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground">
            <CloseIcon className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm transition hover:bg-foreground/[0.03] ${invalid ? "border-red-500 dark:border-red-400" : "border-border"}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-foreground">
            {state === "uploading" ? <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-brand" /> : <PlusIcon className="size-4" />}
          </span>
          <span>
            <span className="block font-medium text-foreground">{state === "uploading" ? "Uploading…" : "Choose a file"}</span>
            <span id={hintId} className="text-xs text-muted-foreground">
              PNG, JPG, WebP, SVG, PDF or ZIP, up to 10 MB
            </span>
          </span>
          <FileTextIcon className="ml-auto size-4 text-muted-foreground" />
        </label>
      )}
      {state === "error" && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message}</p>}
    </div>
  );
}
