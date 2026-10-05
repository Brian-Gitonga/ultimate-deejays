"use client";

import { useActionState, useId, useRef, useState } from "react";
import { changeEmail, changePassword, deleteMyAccount, saveEmailPrefs, sendPasswordReset, type EmailPrefs } from "@/app/(site)/account/actions";
import { initialAuthState } from "@/lib/auth";
import { AccountCard } from "./account-card";
import { FormMessage, PasswordField, TextField, useFieldErrors } from "./auth-form-parts";

const buttonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#18181b] px-5 text-sm font-semibold text-white transition hover:bg-[#27272a] disabled:cursor-wait disabled:opacity-70 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90";

export function AccountSettings({ email, prefs, canDelete }: { email: string; prefs: EmailPrefs; canDelete: boolean }) {
  return (
    <>
      <div>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your login details, notifications and account.</p>
      </div>
      <ChangeEmailForm currentEmail={email} />
      <ChangePasswordForm />
      <ResetPasswordForm email={email} />
      <Notifications initial={prefs} />
      {canDelete && <DeleteAccount />}
    </>
  );
}

function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, action, pending] = useActionState(changeEmail, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  return (
    <AccountCard title="Change email" description="We'll send a link to confirm your new address before switching.">
      <form ref={formRef} action={action} noValidate className="space-y-5">
        <FormMessage state={state} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="currentEmail" label="Current email" value={currentEmail} readOnly />
          <TextField
            name="newEmail"
            label="New email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={String(state.values?.newEmail ?? "")}
            error={errorFor("newEmail")}
            onEdit={markEdited}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Sending…" : "Send confirmation link"}
          </button>
        </div>
      </form>
    </AccountCard>
  );
}

function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  return (
    <AccountCard title="Change password" description="Use at least 8 characters, with a letter and a number.">
      <form ref={formRef} action={action} noValidate className="space-y-5">
        <FormMessage state={state} />
        <PasswordField
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          placeholder="Enter your current password"
          error={errorFor("currentPassword")}
          onEdit={markEdited}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            name="newPassword"
            label="New password"
            autoComplete="new-password"
            placeholder="Create a new password"
            error={errorFor("newPassword")}
            onEdit={markEdited}
          />
          <PasswordField
            name="confirmNewPassword"
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Type it again"
            error={errorFor("confirmNewPassword")}
            onEdit={markEdited}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </AccountCard>
  );
}

function ResetPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(sendPasswordReset, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  return (
    <AccountCard title="Forgot your password?" description="We'll email you a link to set a new one.">
      <form ref={formRef} action={action} noValidate className="space-y-5">
        <FormMessage state={state} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <TextField
              key={email}
              name="resetEmail"
              label="Your email"
              type="email"
              autoComplete="email"
              defaultValue={email}
              error={errorFor("resetEmail")}
              onEdit={markEdited}
            />
          </div>
          <button type="submit" disabled={pending} className={`${buttonClass} sm:mt-7`}>
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </div>
      </form>
    </AccountCard>
  );
}

const notificationOptions: { name: keyof EmailPrefs; label: string; hint: string }[] = [
  { name: "new-courses", label: "New courses", hint: "When a new course launches in a style you play." },
  { name: "challenges", label: "Challenges", hint: "New challenges and results." },
  { name: "feedback", label: "Mix feedback", hint: "When an instructor replies to your mix." },
  { name: "newsletter", label: "Weekly newsletter", hint: "Practice tips and free packs every week." },
];

function Notifications({ initial }: { initial: EmailPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [error, setError] = useState("");

  // Saved straight away; flips back if the server refuses.
  function toggle(name: keyof EmailPrefs) {
    const before = prefs;
    const next = { ...prefs, [name]: !prefs[name] };
    setPrefs(next);
    setError("");
    saveEmailPrefs(next).then(
      (result) => {
        if (!result.ok) {
          setPrefs(before);
          setError(result.error);
        }
      },
      () => {
        setPrefs(before);
        setError("We couldn't reach the server. Check your connection and try again.");
      },
    );
  }

  return (
    <AccountCard title="Email notifications" description="Choose what we email you about. Changes save instantly.">
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-border">
        {notificationOptions.map((option) => (
          <Toggle key={option.name} {...option} on={prefs[option.name]} onToggle={() => toggle(option.name)} />
        ))}
      </ul>
    </AccountCard>
  );
}

function Toggle({ label, hint, on, onToggle }: { label: string; hint: string; on: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div>
        <p id={id} className="font-medium text-foreground">
          {label}
        </p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-brand/25 focus-visible:outline-none ${
          on ? "bg-brand" : "bg-foreground/15"
        }`}
      >
        <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </li>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState(deleteMyAccount, initialAuthState);
  const id = useId();

  return (
    <AccountCard title="Delete account" description="Permanently remove your account, progress, reviews and mixes. This can't be undone." danger>
      {confirming ? (
        <form action={action} className="space-y-4">
          <FormMessage state={state} />
          <label htmlFor={id} className="block text-sm text-foreground">
            Type <span className="font-semibold">DELETE</span> to confirm.
          </label>
          <input
            id={id}
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-11 w-full max-w-xs rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setTyped("");
              }}
              className="h-11 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={typed !== "DELETE" || pending}
              className="h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Delete my account"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Receipts for past payments are kept for our accounts, without your name attached.</p>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-11 rounded-lg border border-red-500/40 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
        >
          Delete account…
        </button>
      )}
    </AccountCard>
  );
}
