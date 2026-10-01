"use server";

import { redirect } from "next/navigation";
import { validateEmail, validateNewPassword, type AuthField, type AuthFormState } from "@/lib/auth";

/*
 * Account settings actions. Each validates on the server and ends at a TODO
 * where your auth provider takes over (see app/(auth)/actions.ts).
 */

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");
const notLive = (message: string, values?: AuthFormState["values"]): AuthFormState => ({ status: "notice", message, values });

export async function changeEmail(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const current = field(formData, "currentEmail").trim().toLowerCase();
  const next = field(formData, "newEmail").trim().toLowerCase();
  const values = { newEmail: next };
  const error = validateEmail(next) ?? (next === current ? "That's already your email address." : undefined);
  if (error) return { status: "error", fieldErrors: { newEmail: error }, values };
  // TODO: send a confirmation link to the new address; switch emails only once it's clicked.
  return notLive(`We'll send a confirmation link to ${next} once accounts are live.`, values);
}

export async function sendPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "resetEmail").trim().toLowerCase();
  const error = validateEmail(email);
  if (error) return { status: "error", fieldErrors: { resetEmail: error } };
  // TODO: email a single-use reset link. Always show the same message, whether or not the address exists.
  return notLive(`If an account exists for ${email}, a reset link will be on its way once accounts are live.`);
}

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const current = field(formData, "currentPassword");
  const next = field(formData, "newPassword");
  const confirm = field(formData, "confirmNewPassword");
  const fieldErrors: Partial<Record<AuthField, string>> = {};
  if (!current) fieldErrors.currentPassword = "Enter your current password.";
  const nextError = validateNewPassword(next) ?? (next && next === current ? "Choose a password you haven't used here." : undefined);
  if (nextError) fieldErrors.newPassword = nextError;
  if (!confirm) fieldErrors.confirmNewPassword = "Confirm your new password.";
  else if (confirm !== next) fieldErrors.confirmNewPassword = "Passwords don't match.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };
  // TODO: verify the current password with your auth provider, then update it and end other sessions.
  return notLive("Your new password looks good. Password changes will work once accounts are live.");
}

export async function logOut() {
  // TODO: end the session with your auth provider.
  redirect("/login");
}
