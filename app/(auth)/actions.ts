"use server";

import {
  validateEmail,
  validateName,
  validateNewPassword,
  type AuthField,
  type AuthFormState,
} from "@/lib/auth";

/*
 * Server Actions for the auth forms. Validation runs here (never trust the
 * browser), and the forms work even before JavaScript loads. Each action ends
 * at a TODO where your auth provider (Auth.js, Clerk, Supabase, your own API…)
 * creates the session and redirects.
 */

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

const notLiveYet = (values: AuthFormState["values"], message: string): AuthFormState => ({
  status: "notice",
  message,
  values,
});

export async function logIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email").trim().toLowerCase();
  const password = field(formData, "password");
  const remember = formData.get("remember") === "on";
  const values = { email, remember };

  if (formData.get("intent") === "google") {
    // TODO: start the Google OAuth flow with your auth provider and redirect to it.
    return notLiveYet(values, "Google sign-in isn't available yet. It's coming with student accounts.");
  }

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  // TODO: verify the credentials, create a session (longer-lived when `remember`
  // is set), then redirect("/dashboard"). On bad credentials return one generic
  // error, e.g. "That email and password don't match", so emails can't be probed.
  return notLiveYet(values, "Student accounts aren't live yet. Log-in opens when courses launch.");
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = field(formData, "name").trim().replace(/\s+/g, " ");
  const email = field(formData, "email").trim().toLowerCase();
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");
  const values = { name, email };

  if (formData.get("intent") === "google") {
    // TODO: start the Google OAuth flow with your auth provider and redirect to it.
    return notLiveYet(values, "Google sign-up isn't available yet. It's coming with student accounts.");
  }

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  const nameError = validateName(name);
  if (nameError) fieldErrors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  const passwordError = validateNewPassword(password);
  if (passwordError) fieldErrors.password = passwordError;
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirm your password.";
  else if (confirmPassword !== password) fieldErrors.confirmPassword = "Passwords don't match.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  // TODO: create the account with your auth provider (hash the password there,
  // never store it as-is), send the confirmation email, then redirect("/welcome").
  return notLiveYet(values, "Student accounts aren't live yet. Sign-ups open when courses launch.");
}
