"use client";

import { useId, useState, type FormEvent } from "react";
import { CheckIcon, MailIcon } from "./icons";

export function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: send the address to your email provider (Mailchimp, ConvertKit, Resend…).
    setSubscribed(true);
  }

  return (
    <div aria-live="polite" className="mx-auto mt-8 max-w-[30rem]">
      {subscribed ? (
        <p className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-5 py-3 font-medium text-white">
          <CheckIcon className="size-5" />
          You&apos;re on the list. Check your inbox to confirm.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:rounded-full sm:bg-white sm:p-1.5 sm:shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)] sm:focus-within:ring-4 sm:focus-within:ring-white/30"
        >
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
              className="h-12 w-full rounded-full bg-white pr-4 pl-11 text-base text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:ring-4 focus-visible:ring-white/30 sm:bg-transparent sm:focus-visible:ring-0"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-full bg-neutral-900 px-7 text-base font-medium text-white transition hover:bg-neutral-700 focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
