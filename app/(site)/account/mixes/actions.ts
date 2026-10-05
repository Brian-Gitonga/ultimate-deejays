"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { isUuid } from "@/lib/action-result";
import type { AuthField, AuthFormState } from "@/lib/auth";
import { getViewer } from "@/lib/dal";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/*
 * Sends a mix for instructor feedback. The database enforces the plan's
 * allowance (Warm-Up 0, Resident 2, Headliner unlimited), so this can't be
 * worked around from the browser.
 */
export async function submitMix(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const title = field(formData, "title").replace(/\s+/g, " ");
  const link = field(formData, "link");
  const courseId = field(formData, "course");
  const notes = field(formData, "notes");
  const values = { title, link, course: courseId, notes };

  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Your session has ended. Log in again to send a mix.", values };

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  if (title.length < 2) fieldErrors.title = "Give your mix a name.";
  else if (title.length > 120) fieldErrors.title = "Keep the name to 120 characters.";
  if (!/^https:\/\/\S+\.\S+$/.test(link)) fieldErrors.link = "Paste the full link, starting with https:// (SoundCloud, Mixcloud, YouTube, Google Drive…).";
  else if (link.length > 500) fieldErrors.link = "That link is too long.";
  if (notes.length > 1000) fieldErrors.notes = "Keep it to 1,000 characters.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase.from("mix_submissions").insert({
    user_id: viewer.id,
    title,
    link,
    notes,
    course_id: isUuid(courseId) ? courseId : null,
  });

  if (error) {
    if (error.code === "42501") {
      return {
        status: "error",
        message: viewer.plan === "warm-up" ? "Mix feedback comes with the Resident and Headliner plans." : "You've used all the mix reviews in your plan. Upgrade to Headliner for unlimited feedback.",
        values,
      };
    }
    console.error("[submitMix]", error);
    return { status: "error", message: withDetail("We couldn't send your mix. Please try again.", error), values };
  }

  revalidatePath("/account/mixes");
  return { status: "notice", message: "Mix sent! An instructor will listen and reply here, usually within a few days." };
}

/** Withdraws a mix that hasn't been reviewed yet (it no longer counts toward the plan's allowance). */
export async function withdrawMix(id: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Log in first." };
  const supabase = await createClient();
  const { error, count } = await supabase.from("mix_submissions").delete({ count: "exact" }).eq("id", id).eq("user_id", viewer.id).eq("status", "pending");
  if (error) return { ok: false, error: withDetail("We couldn't withdraw the mix.", error) };
  if (!count) return { ok: false, error: "Reviewed mixes can't be withdrawn." };
  revalidatePath("/account/mixes");
  return { ok: true, record: null };
}
