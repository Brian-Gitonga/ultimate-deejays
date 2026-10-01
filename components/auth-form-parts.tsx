"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type RefObject } from "react";
import type { AuthField, AuthFormState } from "@/lib/auth";
import { EyeIcon, EyeOffIcon } from "./icons";

/*
 * Field errors from the last submission, hidden again as soon as the user edits
 * that field, plus focus on the first invalid field after a failed submit.
 */
export function useFieldErrors(state: AuthFormState, formRef: RefObject<HTMLFormElement | null>) {
  const [edited, setEdited] = useState<AuthField[]>([]);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    setEdited([]);
  }

  useEffect(() => {
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [state, formRef]);

  return {
    errorFor: (name: AuthField) => (edited.includes(name) ? undefined : state.fieldErrors?.[name]),
    markEdited: (name: AuthField) => setEdited((fields) => (fields.includes(name) ? fields : [...fields, name])),
  };
}

type FieldProps = {
  name: AuthField;
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Shown at the right end of the label row (e.g. "Forgot password?") */
  labelAside?: ReactNode;
  onEdit?: (name: AuthField) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name">;

const inputClass = (invalid: boolean) =>
  `h-12 w-full rounded-xl border bg-background px-4 text-[0.9375rem] text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/80 focus:ring-4 ${
    invalid
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/15 dark:border-red-400"
      : "border-border hover:border-foreground/20 focus:border-brand focus:ring-brand/15"
  }`;

function FieldShell({
  id,
  label,
  labelAside,
  error,
  errorId,
  hint,
  hintId,
  children,
}: {
  id: string;
  label: string;
  labelAside?: ReactNode;
  error?: string;
  errorId: string;
  hint?: ReactNode;
  hintId: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {labelAside}
      </div>
      {children}
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <div id={hintId} className="mt-2 text-sm text-muted-foreground">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

export function TextField({ name, label, error, hint, labelAside, onEdit, ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <FieldShell id={id} label={label} labelAside={labelAside} error={error} errorId={errorId} hint={hint} hintId={hintId}>
      <input
        {...input}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        onInput={() => onEdit?.(name)}
        className={inputClass(!!error)}
      />
    </FieldShell>
  );
}

export function PasswordField({ name, label, error, hint, labelAside, onEdit, onChange, ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FieldShell id={id} label={label} labelAside={labelAside} error={error} errorId={errorId} hint={hint} hintId={hintId}>
      <div className="relative">
        <input
          {...input}
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          onInput={() => onEdit?.(name)}
          onChange={onChange}
          className={`${inputClass(!!error)} pr-12`}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
            inputRef.current?.focus();
          }}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
        >
          {visible ? <EyeOffIcon className="size-[1.125rem]" /> : <EyeIcon className="size-[1.125rem]" />}
        </button>
      </div>
    </FieldShell>
  );
}

export function SubmitButton({ pending, children, pendingLabel }: { pending: boolean; children: ReactNode; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#18181b] text-[0.9375rem] font-semibold text-white shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] transition hover:bg-[#27272a] focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-80 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground" role="separator" aria-label="Or">
      <span className="h-px flex-1 bg-border" />
      Or continue with
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** A second submit button on the same form, so the Server Action sees intent=google. */
export function GoogleButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      name="intent"
      value="google"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-[0.9375rem] font-semibold text-foreground shadow-xs transition hover:border-foreground/20 hover:bg-muted focus-visible:ring-4 focus-visible:ring-brand/20 focus-visible:outline-none disabled:opacity-60"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5">
        <path
          fill="#FFC107"
          d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9Z"
        />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9Z" />
      </svg>
      Continue with Google
    </button>
  );
}

/** The form-level outcome: an error summary or a neutral notice. */
export function FormMessage({ state }: { state: AuthFormState }) {
  if (!state.message) return null;
  const notice = state.status === "notice";

  return (
    <div
      role={notice ? "status" : "alert"}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
        notice
          ? "border-brand/25 bg-brand/[0.07] text-foreground"
          : "border-red-500/30 bg-red-500/[0.07] text-red-700 dark:text-red-300"
      }`}
    >
      {state.message}
    </div>
  );
}
