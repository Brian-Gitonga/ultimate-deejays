"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { validateEmail, validateNewPassword, type AuthField, type AuthFormState } from "@/lib/auth";
import { getViewer, requireViewer } from "@/lib/dal";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/*
 * Account settings, backed by Supabase Auth. Each validates on the server
 * first. Email and password-reset links come back through /auth/callback.
 */

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");
const callbackUrl = (next: string) => `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

export async function changeEmail(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const viewer = await requireViewer("/account/settings");
  const next = field(formData, "newEmail").trim().toLowerCase();
  const values = { newEmail: next };
  const error = validateEmail(next) ?? (next === viewer.email.toLowerCase() ? "That's already your email address." : undefined);
  if (error) return { status: "error", fieldErrors: { newEmail: error }, values };

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: callbackUrl("/account/settings") });
  if (authError) {
    if (authError.code === "email_exists") return { status: "error", fieldErrors: { newEmail: "Another account already uses that email." }, values };
    if (authError.status === 429) return { status: "error", message: "Too many emails in a short time. Wait a few minutes, then try again.", values };
    return { status: "error", message: withDetail("We couldn't change your email. Please try again.", authError), values };
  }
  // The profile copy of the email updates itself once the change is confirmed (migration 001's trigger).
  return { status: "notice", message: `Almost done: open the link we sent to ${next} to confirm. Until then you log in with ${viewer.email}.` };
}

/** Works signed in (Settings) and signed out (/forgot-password). Same message whether or not the account exists. */
export async function sendPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "resetEmail").trim().toLowerCase();
  const error = validateEmail(email);
  if (error) return { status: "error", fieldErrors: { resetEmail: error }, values: { resetEmail: email } };

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/reset-password") });
  if (authError?.status === 429) return { status: "error", message: "Too many emails in a short time. Wait a few minutes, then try again.", values: { resetEmail: email } };
  if (authError) console.error("[sendPasswordReset]", authError.code, authError.message);
  return { status: "notice", message: `If an account exists for ${email}, a reset link is on its way. It works once, for an hour.`, values: { resetEmail: email } };
}

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const viewer = await requireViewer("/account/settings");
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

  const supabase = await createClient();
  // Prove it's really them before changing anything.
  const check = await supabase.auth.signInWithPassword({ email: viewer.email, password: current });
  if (check.error) {
    if (check.error.status === 429) return { status: "error", message: "Too many attempts. Wait a minute, then try again." };
    return {
      status: "error",
      fieldErrors: { currentPassword: "That's not your current password. Signed up with Google? Use “Forgot your password?” below to set one." },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    if (error.code === "weak_password") return { status: "error", fieldErrors: { newPassword: error.message } };
    return { status: "error", message: withDetail("We couldn't update your password. Please try again.", error) };
  }
  // Log out every other device; this one stays signed in.
  await supabase.auth.signOut({ scope: "others" });
  return { status: "notice", message: "Password updated. Other devices have been logged out." };
}

/** /reset-password: the recovery link signed them in; now they choose a new password. */
export async function setNewPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "That reset link has expired. Request a new one below." };
  const next = field(formData, "newPassword");
  const confirm = field(formData, "confirmNewPassword");
  const fieldErrors: Partial<Record<AuthField, string>> = {};
  const nextError = validateNewPassword(next);
  if (nextError) fieldErrors.newPassword = nextError;
  if (!confirm) fieldErrors.confirmNewPassword = "Confirm your new password.";
  else if (confirm !== next) fieldErrors.confirmNewPassword = "Passwords don't match.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    if (error.code === "same_password") return { status: "error", fieldErrors: { newPassword: "Choose a password you haven't used here." } };
    if (error.code === "weak_password") return { status: "error", fieldErrors: { newPassword: error.message } };
    return { status: "error", message: withDetail("We couldn't save your new password. Please try again.", error) };
  }
  await supabase.auth.signOut({ scope: "others" });
  redirect("/account/profile");
}

const prefsSchema = z.object({ "new-courses": z.boolean(), challenges: z.boolean(), feedback: z.boolean(), newsletter: z.boolean() });
export type EmailPrefs = z.infer<typeof prefsSchema>;

/** Settings → Email notifications. The newsletter switch also joins or leaves the subscriber list. */
export async function saveEmailPrefs(prefs: EmailPrefs): Promise<ActionResult<EmailPrefs>> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Your session has ended. Log in again." };
  const parsed = prefsSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false, error: "Those settings didn't look right. Refresh and try again." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ email_prefs: parsed.data }).eq("id", viewer.id);
  if (error) return { ok: false, error: withDetail("We couldn't save your email settings.", error) };

  try {
    const admin = createAdminClient();
    const email = viewer.email.toLowerCase();
    const { data: existing } = await admin.from("newsletter_subscribers").select("id").eq("email", email).maybeSingle();
    if (existing) {
      await admin.from("newsletter_subscribers").update({ unsubscribed_at: parsed.data.newsletter ? null : new Date().toISOString(), user_id: viewer.id }).eq("id", existing.id);
    } else if (parsed.data.newsletter) {
      await admin.from("newsletter_subscribers").insert({ email, user_id: viewer.id, source: "account settings" });
    }
  } catch (subscriberError) {
    console.error("[saveEmailPrefs] newsletter list", subscriberError);
  }
  return { ok: true, record: parsed.data };
}

/** Deletes the login and profile. Payments stay (without the link to them) for the accounts. */
export async function deleteMyAccount(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const viewer = await requireViewer("/account/settings");
  if (field(formData, "confirm") !== "DELETE") return { status: "error", fieldErrors: { confirm: "Type DELETE to confirm." } };
  if (viewer.role === "admin") {
    return { status: "error", message: "Admin accounts can't be deleted here. Make someone else an admin first, then ask them to remove you (supabase/scripts/delete-user.sql)." };
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(viewer.id);
  if (error) return { status: "error", message: withDetail("We couldn't delete your account. Please contact support.", error) };
  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => {});
  redirect("/?account=deleted");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
