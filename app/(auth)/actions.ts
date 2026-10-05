"use server";

import { redirect } from "next/navigation";
import {
  safeNextPath,
  validateEmail,
  validateName,
  validateNewPassword,
  type AuthField,
  type AuthFormState,
} from "@/lib/auth";
import { supabaseEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site";
import { withDetail } from "@/lib/supabase/errors";
import { attachReferral } from "@/lib/referrals.server";
import { createClient } from "@/lib/supabase/server";

/*
 * Server Actions for the auth forms, backed by Supabase Auth. Validation runs
 * here (never trust the browser), and the forms work before JavaScript loads.
 * Everyone lands on their profile afterwards, or on ?next= when a protected
 * page sent them here.
 */

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

const callbackUrl = (next: string) => `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

/** Whether Google is switched on in Supabase → Authentication → Providers. */
async function googleEnabled() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key } = supabaseEnv();
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    const settings = (await response.json()) as { external?: { google?: boolean } };
    return settings.external?.google === true;
  } catch {
    return false;
  }
}

async function continueWithGoogle(next: string, values: AuthFormState["values"]): Promise<AuthFormState> {
  if (!(await googleEnabled())) {
    return { status: "notice", message: "Google sign-in isn't switched on yet. Use your email and password for now.", values };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(next) } });
  if (error || !data.url) return { status: "error", message: withDetail("We couldn't reach Google. Please try again.", error), values };
  redirect(data.url);
}

export async function logIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email").trim().toLowerCase();
  const password = field(formData, "password");
  const remember = formData.get("remember") === "on";
  const next = safeNextPath(field(formData, "next"));
  const values = { email, remember };

  if (formData.get("intent") === "google") return continueWithGoogle(next, values);

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  // TODO: honour `remember` (session-only cookies when unticked). Sessions currently last until log-out.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { status: "error", message: "Confirm your email first: open the link we sent when you signed up, then log in.", values };
    }
    if (error.code === "invalid_credentials") {
      // One message for both wrong email and wrong password, so emails can't be probed.
      return { status: "error", message: "That email and password don't match. Try again, or reset your password.", values };
    }
    if (error.status === 429) {
      return { status: "error", message: "Too many attempts. Wait a minute, then try again.", values };
    }
    return { status: "error", message: withDetail("We couldn't log you in. Please try again.", error), values };
  }

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
    return { status: "error", message: "This account is suspended. If you think that's a mistake, contact support.", values };
  }

  redirect(next);
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = field(formData, "name").trim().replace(/\s+/g, " ");
  const email = field(formData, "email").trim().toLowerCase();
  const password = field(formData, "password");
  const confirmPassword = field(formData, "confirmPassword");
  const next = safeNextPath(field(formData, "next"));
  const values = { name, email };

  if (formData.get("intent") === "google") return continueWithGoogle(next, values);

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

  const supabase = await createClient();
  // full_name is copied into public.profiles by the on_auth_user_created trigger.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name }, emailRedirectTo: callbackUrl(next) },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { status: "error", fieldErrors: { email: "An account with this email already exists. Log in instead." }, values };
    }
    if (error.code === "weak_password") {
      return { status: "error", fieldErrors: { password: error.message }, values };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { status: "error", message: "We've sent too many emails in a short time. Wait a few minutes, then try again.", values };
    }
    if (error.code === "signup_disabled") {
      return { status: "notice", message: "New sign-ups are paused right now. Please check back soon.", values };
    }
    // "Database error saving new user" means the profile trigger failed: run supabase/diagnostics/00_health_check.sql.
    return { status: "error", message: withDetail("We couldn't create your account. Please try again.", error), values };
  }

  // Email confirmation off: signed in already, straight to the profile (or back to the lesson or checkout).
  if (data.session) {
    await attachReferral(supabase);
    redirect(next);
  }

  // Email confirmation on: the link in the email signs them in and opens their profile (or ?next=).
  return {
    status: "notice",
    message: `Almost there! We sent a confirmation link to ${email}. Open it to finish creating your account.`,
    values,
  };
}
