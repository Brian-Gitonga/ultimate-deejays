"use client";

import { useActionState, useId } from "react";
import { subscribeToNewsletter, type NewsletterState } from "@/app/(site)/actions";
import { CheckIcon, MailIcon } from "./icons";

export function NewsletterForm({ source = "website" }: { source?: string }) {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, { status: "idle" });
  const inputId = useId();

  return (
    <div aria-live="polite" className="mx-auto mt-8 max-w-[30rem]">
      {state.status === "done" ? (
        <p className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-5 py-3 font-medium text-white">
          <CheckIcon className="size-5" />
          You&apos;re on the list. Watch your inbox for new lessons and tips.
        </p>
      ) : (
        <>
          <form
            action={formAction}
            className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:rounded-full sm:bg-white sm:p-1.5 sm:shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)] sm:focus-within:ring-4 sm:focus-within:ring-white/30"
          >
            <input type="hidden" name="source" value={source} />
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <div className="relative flex-1">
              <MailIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-neutral-400" />
              <input
                id={inputId}
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="Enter your email address"
                aria-invalid={state.status === "error"}
                aria-describedby={state.status === "error" ? `${inputId}-error` : undefined}
                className="h-12 w-full rounded-full bg-white pr-4 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-white/30 sm:bg-transparent sm:focus-visible:ring-0"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="h-12 rounded-full bg-neutral-900 px-7 text-base font-medium text-white transition hover:bg-neutral-700 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none disabled:opacity-70"
            >
              {pending ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
          {state.status === "error" && (
            <p id={`${inputId}-error`} className="mt-3 text-sm font-medium text-white">
              {state.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
