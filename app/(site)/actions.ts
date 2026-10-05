"use server";

import { validateEmail } from "@/lib/auth";
import { getViewer } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/*
 * Site-wide forms. The newsletter sign-up is saved with the secret key
 * (visitors can't write the subscribers table), after checking the address.
 * Studio → Subscribers lists and exports them.
 */

export type NewsletterState = { status: "idle" | "done" | "error"; message?: string };

export async function subscribeToNewsletter(_previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Bots fill every field; people never see this one.
  if (String(formData.get("company") ?? "")) return { status: "done" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const problem = validateEmail(email);
  if (problem) return { status: "error", message: problem };
  const source = String(formData.get("source") ?? "website").slice(0, 60) || "website";

  try {
    const viewer = await getViewer();
    const admin = createAdminClient();
    const own = viewer && viewer.email.toLowerCase() === email ? viewer.id : null;
    const { data: existing } = await admin.from("newsletter_subscribers").select("id, unsubscribed_at").eq("email", email).maybeSingle();
    const { error } = existing
      ? await admin.from("newsletter_subscribers").update({ unsubscribed_at: null, ...(own ? { user_id: own } : {}) }).eq("id", existing.id)
      : await admin.from("newsletter_subscribers").insert({ email, source, user_id: own });
    if (error && error.code !== "23505") throw error;

    // Signed in with this address: tick "Newsletter" in their email settings too.
    if (viewer && own) {
      const supabase = await createClient();
      const { data: profile } = await supabase.from("profiles").select("email_prefs").eq("id", viewer.id).single();
      const prefs = profile?.email_prefs && typeof profile.email_prefs === "object" && !Array.isArray(profile.email_prefs) ? profile.email_prefs : {};
      await supabase.from("profiles").update({ email_prefs: { ...prefs, newsletter: true } }).eq("id", viewer.id);
    }
    return { status: "done" };
  } catch (error) {
    console.error("[subscribeToNewsletter]", error);
    return { status: "error", message: "We couldn't sign you up just now. Please try again." };
  }
}
