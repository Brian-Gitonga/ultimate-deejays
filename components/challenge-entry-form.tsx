"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { submitEntry } from "@/app/(site)/challenges/actions";
import { initialAuthState } from "@/lib/auth";
import { youtubeId } from "@/lib/curriculum";
import { FormMessage, SubmitButton, TextField, useFieldErrors } from "./auth-form-parts";
import { CheckIcon } from "./icons";

export function ChallengeEntryForm({ challenge }: { challenge: string }) {
  const [state, formAction, pending] = useActionState(submitEntry, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  const [link, setLink] = useState(String(state.values?.youtube ?? ""));
  const videoId = youtubeId(link.trim());

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="challenge" value={challenge} />
      <FormMessage state={state} />

      <TextField
        name="name"
        label="DJ name"
        autoComplete="nickname"
        placeholder="e.g. DJ Jordan"
        defaultValue={String(state.values?.name ?? "")}
        error={errorFor("name")}
        onEdit={markEdited}
        required
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={String(state.values?.email ?? "")}
        error={errorFor("email")}
        onEdit={markEdited}
        required
      />
      <TextField
        name="youtube"
        label="YouTube link"
        type="url"
        inputMode="url"
        placeholder="https://youtu.be/…"
        value={link}
        onChange={(event) => setLink(event.target.value)}
        error={errorFor("youtube")}
        onEdit={markEdited}
        hint="Public or unlisted videos both work."
        required
      />

      {videoId && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/25 bg-brand/[0.06] p-2.5">
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            width={120}
            height={90}
            className="aspect-video w-24 rounded-lg object-cover"
          />
          <p className="flex items-center gap-1.5 text-sm font-medium text-brand-deep dark:text-brand">
            <CheckIcon className="size-4" />
            Video found
          </p>
        </div>
      )}

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            name="rules"
            onChange={() => markEdited("rules")}
            aria-invalid={errorFor("rules") ? true : undefined}
            className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer accent-brand"
          />
          <span>
            My entry is one continuous take and follows the challenge rules. I agree to the{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-brand">
              terms
            </Link>
            .
          </span>
        </label>
        {errorFor("rules") && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorFor("rules")}</p>}
      </div>

      <SubmitButton pending={pending} pendingLabel="Checking your entry…">
        Submit entry
      </SubmitButton>
    </form>
  );
}
