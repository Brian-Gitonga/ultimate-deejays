"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { logIn } from "@/app/(auth)/actions";
import { HOME_AFTER_AUTH, initialAuthState, type AuthFormState } from "@/lib/auth";
import {
  FormMessage,
  GoogleButton,
  OrDivider,
  PasswordField,
  SubmitButton,
  TextField,
  useFieldErrors,
} from "./auth-form-parts";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(logIn, initialError ? { status: "error", message: initialError } : initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />

      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        error={errorFor("email")}
        onEdit={markEdited}
        required
      />

      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errorFor("password")}
        onEdit={markEdited}
        required
        labelAside={
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition hover:text-brand hover:decoration-brand"
          >
            Forgot password?
          </Link>
        }
      />

      <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          name="remember"
          defaultChecked={state.values?.remember}
          className="size-[1.125rem] cursor-pointer rounded-[0.3125rem] border-border accent-brand"
        />
        Keep me logged in
      </label>

      <SubmitButton pending={pending} pendingLabel="Logging in…">
        Log in
      </SubmitButton>

      <OrDivider />
      <GoogleButton pending={pending} />

      <p className="pt-1 text-center text-[0.9375rem] text-muted-foreground">
        New to Ultimate Deejays?{" "}
        <Link
          href={next === HOME_AFTER_AUTH ? "/sign-up" : `/sign-up?next=${encodeURIComponent(next)}`}
          className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition hover:text-brand hover:decoration-brand"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
