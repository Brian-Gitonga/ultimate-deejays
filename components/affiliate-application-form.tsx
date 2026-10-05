"use client";

import { useActionState, useId, useRef } from "react";
import { applyForAffiliate } from "@/app/(site)/account/affiliate/actions";
import { affiliateChannels } from "@/lib/affiliate-program";
import { initialAuthState } from "@/lib/auth";
import { FormMessage, SubmitButton, TextField, useFieldErrors } from "./auth-form-parts";

const PITCH_MAX = 600;

export function AffiliateApplicationForm() {
  const [state, action, pending] = useActionState(applyForAffiliate, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  const channelId = useId();
  const pitchId = useId();
  const value = (name: string) => String(state.values?.[name] ?? "");

  const selectClass = (invalid: boolean) =>
    `h-12 w-full rounded-xl border bg-background px-4 text-[0.9375rem] text-foreground shadow-xs outline-none transition focus:ring-4 ${
      invalid ? "border-red-500 focus:ring-red-500/15" : "border-border hover:border-foreground/20 focus:border-brand focus:ring-brand/15"
    }`;

  return (
    <form ref={formRef} action={action} noValidate className="space-y-5">
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={channelId} className="mb-2 block text-sm font-medium text-foreground">
            Where will you promote us?
          </label>
          <select
            id={channelId}
            name="channel"
            defaultValue={value("channel")}
            aria-invalid={errorFor("channel") ? true : undefined}
            aria-describedby={errorFor("channel") ? `${channelId}-error` : undefined}
            onChange={() => markEdited("channel")}
            className={selectClass(!!errorFor("channel"))}
          >
            <option value="" disabled>
              Choose a channel
            </option>
            {affiliateChannels.map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
          </select>
          {errorFor("channel") && (
            <p id={`${channelId}-error`} className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errorFor("channel")}
            </p>
          )}
        </div>
        <TextField
          name="audience"
          label="Audience size"
          inputMode="numeric"
          placeholder="e.g. 12000"
          defaultValue={value("audience")}
          hint="Followers, subscribers or monthly readers. A rough number is fine."
          error={errorFor("audience")}
          onEdit={markEdited}
        />
      </div>

      <TextField
        name="channelUrl"
        label="Link to your channel or site"
        type="url"
        inputMode="url"
        placeholder="https://youtube.com/@yourchannel"
        defaultValue={value("channelUrl")}
        error={errorFor("channelUrl")}
        onEdit={markEdited}
      />

      <div>
        <label htmlFor={pitchId} className="mb-2 block text-sm font-medium text-foreground">
          How would you promote Ultimate Deejays?
        </label>
        <textarea
          id={pitchId}
          name="pitch"
          rows={4}
          maxLength={PITCH_MAX}
          defaultValue={value("pitch")}
          placeholder="Tell us about your audience and how you'd share the courses."
          aria-invalid={errorFor("pitch") ? true : undefined}
          aria-describedby={`${pitchId}-hint`}
          onInput={() => markEdited("pitch")}
          className={`w-full resize-y rounded-xl border bg-background px-4 py-3 text-[0.9375rem] text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/80 focus:ring-4 ${
            errorFor("pitch") ? "border-red-500 focus:ring-red-500/15" : "border-border hover:border-foreground/20 focus:border-brand focus:ring-brand/15"
          }`}
        />
        <p id={`${pitchId}-hint`} className={`mt-2 text-sm ${errorFor("pitch") ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
          {errorFor("pitch") ?? `20 to ${PITCH_MAX} characters.`}
        </p>
      </div>

      <div className="sm:w-60">
        <SubmitButton pending={pending} pendingLabel="Sending…">
          Send application
        </SubmitButton>
      </div>
    </form>
  );
}
