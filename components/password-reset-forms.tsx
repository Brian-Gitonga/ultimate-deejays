"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { sendPasswordReset, setNewPassword } from "@/app/(site)/account/actions";
import { initialAuthState, PASSWORD_MIN_LENGTH } from "@/lib/auth";
import { FormMessage, PasswordField, SubmitButton, TextField, useFieldErrors } from "./auth-form-parts";

const backLink =
  "font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition hover:text-brand hover:decoration-brand";

/** /forgot-password: emails a single-use link that opens /reset-password. */
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(sendPasswordReset, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  return (
    <form ref={formRef} action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <TextField
        name="resetEmail"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        defaultValue={String(state.values?.resetEmail ?? "")}
        error={errorFor("resetEmail")}
        onEdit={markEdited}
        required
      />
      <SubmitButton pending={pending} pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
      <p className="text-center text-[0.9375rem] text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className={backLink}>
          Log in
        </Link>
      </p>
    </form>
  );
}

/** /reset-password: the link signed them in; they pick a new password. */
export function NewPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);
  return (
    <form ref={formRef} action={action} noValidate className="space-y-5">
      <FormMessage state={state} />
      <PasswordField
        name="newPassword"
        label="New password"
        autoComplete="new-password"
        placeholder="Create a new password"
        minLength={PASSWORD_MIN_LENGTH}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`}
        error={errorFor("newPassword")}
        onEdit={markEdited}
        required
      />
      <PasswordField
        name="confirmNewPassword"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Type it again"
        error={errorFor("confirmNewPassword")}
        onEdit={markEdited}
        required
      />
      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
