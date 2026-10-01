import Link from "next/link";
import type { ComponentType, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, SVGProps, TextareaHTMLAttributes } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "../icons";

/* Shared building blocks for studio pages: page header, cards and form fields. */

export function StudioPageHeader({
  title,
  crumbs,
  actions,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {crumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRightIcon className="size-3.5" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-1.5 truncate text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className = "" }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] ${className}`}>
      {title && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 text-[0.9375rem] text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/75 hover:border-foreground/20 focus:border-brand focus:ring-4 focus:ring-brand/15 aria-invalid:border-red-500 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-600 dark:text-red-400"> *</span>}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} h-11 ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} resize-y py-2.5 leading-relaxed ${props.className ?? ""}`} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputClass} h-11 cursor-pointer appearance-none pr-10 dark:[color-scheme:dark] ${props.className ?? ""}`}>
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export const primaryButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#18181b] px-4 text-sm font-semibold text-white transition hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90";
export const secondaryButton =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-xs transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
export const ghostIconButton =
  "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-30";

export function Kpi({ icon: Icon, label, value, note }: { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; value: string; note?: ReactNode }) {
  return (
    <li className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:flex">
          <Icon className="size-[1.125rem]" />
        </span>
      </div>
      <p className="mt-2 text-2xl leading-none font-bold tracking-tight text-foreground tabular-nums sm:text-[1.75rem]">{value}</p>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </li>
  );
}

/** An on/off switch with a visible label and hint. */
export function Switch({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-foreground">
          {label}
        </p>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none ${checked ? "bg-brand" : "bg-foreground/15"}`}
      >
        <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
