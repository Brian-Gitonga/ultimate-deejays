"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { getEntryStatus, submitEntry, type EntryStatus } from "@/app/(site)/challenges/actions";
import { initialAuthState } from "@/lib/auth";
import { youtubeId } from "@/lib/curriculum";
import { FormMessage, SubmitButton, TextField, useFieldErrors } from "./auth-form-parts";
import { CheckIcon, LockIcon, TrophyIcon } from "./icons";

const button = "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition";
const statusLabel: Record<string, string> = { submitted: "Submitted", shortlisted: "Shortlisted", winner: "Winner", disqualified: "Not accepted" };

/*
 * Entering a challenge needs an account (so entries, results and feedback
 * belong to someone). The page is static, so this asks the server what this
 * visitor can do: log in, upgrade, see their entry, or enter.
 */
export function ChallengeEntryForm({ challenge }: { challenge: string }) {
  const [status, setStatus] = useState<EntryStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEntryStatus(challenge).then(
      (result) => !cancelled && setStatus(result),
      () => !cancelled && setStatus({ state: "signin" }),
    );
    return () => {
      cancelled = true;
    };
  }, [challenge]);

  if (!status) {
    return (
      <div role="status" className="space-y-3" aria-label="Loading">
        <div className="h-11 animate-pulse rounded-xl bg-foreground/[0.06]" />
        <div className="h-11 animate-pulse rounded-xl bg-foreground/[0.06]" />
        <div className="h-12 animate-pulse rounded-xl bg-foreground/[0.06]" />
      </div>
    );
  }

  if (status.state === "signin") {
    const next = encodeURIComponent(`/challenges/${challenge}#enter`);
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-5 text-center">
        <p className="font-semibold text-foreground">Log in to enter</p>
        <p className="mt-1 text-sm text-muted-foreground">Entries are linked to your account, so you can follow your results. A free account works for Beginner challenges.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/sign-up?next=${next}`} className={`${button} bg-brand text-white hover:brightness-110`}>
            Create free account
          </Link>
          <Link href={`/login?next=${next}`} className={`${button} border border-border text-foreground hover:bg-muted`}>
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (status.state === "upgrade") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-5 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-foreground/[0.07] text-foreground/70">
          <LockIcon className="size-5" />
        </span>
        <p className="mt-3 font-semibold text-foreground">{status.difficulty} challenges are for {status.planName} members and up</p>
        <p className="mt-1 text-sm text-muted-foreground">Your plan includes every Beginner challenge. Upgrade to enter this one too.</p>
        <Link href="/checkout?plan=resident" className={`${button} mt-4 bg-brand text-white hover:brightness-110`}>
          Upgrade to {status.planName}
        </Link>
      </div>
    );
  }

  if (status.state === "entered") {
    return (
      <div className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-5">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          {status.status === "winner" ? <TrophyIcon className="size-5 text-brand" /> : <CheckIcon className="size-5 text-brand" />}
          You&apos;ve entered this challenge
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Image src={`https://i.ytimg.com/vi/${status.youtubeId}/hqdefault.jpg`} alt="" width={120} height={90} className="aspect-video w-24 rounded-lg object-cover" />
          <div className="text-sm">
            <p className="text-foreground">
              Status: <span className="font-semibold">{statusLabel[status.status] ?? status.status}</span>
            </p>
            <p className="text-muted-foreground">Sent {new Date(status.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === "closed") {
    return <p className="text-sm text-muted-foreground">This challenge isn&apos;t accepting entries right now.</p>;
  }

  return <EntryForm challenge={challenge} name={status.name} email={status.email} />;
}

function EntryForm({ challenge, name, email }: { challenge: string; name: string; email: string }) {
  const [state, formAction, pending] = useActionState(submitEntry, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  const [link, setLink] = useState(String(state.values?.youtube ?? ""));
  const videoId = youtubeId(link.trim());
  const done = state.status === "notice" && !state.values;

  if (done) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-2xl border border-brand/25 bg-brand/[0.06] p-4 text-sm font-medium text-foreground">
        <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
        {state.message}
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="challenge" value={challenge} />
      <FormMessage state={state} />

      <TextField
        name="name"
        label="DJ name"
        autoComplete="nickname"
        placeholder="e.g. DJ Jordan"
        defaultValue={String(state.values?.name ?? name)}
        error={errorFor("name")}
        onEdit={markEdited}
        required
      />
      <p className="-mt-2 text-xs text-muted-foreground">Entering as {email}. Results are sent here.</p>
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
          <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" width={120} height={90} className="aspect-video w-24 rounded-lg object-cover" />
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
