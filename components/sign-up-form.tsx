"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { signUp } from "@/app/(auth)/actions";
import { HOME_AFTER_AUTH, initialAuthState, PASSWORD_MIN_LENGTH, passwordStrength } from "@/lib/auth";
import {
  FormMessage,
  GoogleButton,
  OrDivider,
  PasswordField,
  SubmitButton,
  TextField,
  useFieldErrors,
} from "./auth-form-parts";

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-red-500", "bg-accent-amber", "bg-accent-blue", "bg-brand"];

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);
  const { errorFor, markEdited } = useFieldErrors(state, formRef);

  // The form clears password fields after each submit, so the meter starts over with it.
  const [password, setPassword] = useState("");
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    setPassword("");
  }
  const strength = passwordStrength(password);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />

      <TextField
        name="name"
        label="Full name"
        autoComplete="name"
        placeholder="e.g. Jordan Blake"
        defaultValue={state.values?.name}
        error={errorFor("name")}
        onEdit={markEdited}
        required
      />

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
        autoComplete="new-password"
        placeholder="Create a password"
        minLength={PASSWORD_MIN_LENGTH}
        error={errorFor("password")}
        onEdit={markEdited}
        onChange={(event) => setPassword(event.target.value)}
        required
        hint={
          password ? (
            <div className="flex items-center gap-3">
              <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 rounded-full transition-colors ${step <= strength ? strengthColors[strength] : "bg-foreground/10"}`}
                  />
                ))}
              </div>
              <span className="w-12 text-right text-xs font-medium text-foreground">{strengthLabels[strength]}</span>
            </div>
          ) : (
            `At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`
          )
        }
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Type it again"
        error={errorFor("confirmPassword")}
        onEdit={markEdited}
        required
      />

      <SubmitButton pending={pending} pendingLabel="Creating your account…">
        Create account
      </SubmitButton>

      <OrDivider />
      <GoogleButton pending={pending} />

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-[0.9375rem] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={next === HOME_AFTER_AUTH ? "/login" : `/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-foreground underline decoration-foreground/25 underline-offset-4 transition hover:text-brand hover:decoration-brand"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
