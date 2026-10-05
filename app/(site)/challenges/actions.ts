"use server";

import { updateTag } from "next/cache";
import { validateName, type AuthField, type AuthFormState } from "@/lib/auth";
import { youtubeId } from "@/lib/curriculum";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { getSiteSettings } from "@/lib/db/settings";
import { getViewer } from "@/lib/dal";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/*
 * Challenge entries, for members only (one per member per challenge).
 * Warm-Up members can enter Beginner challenges; Resident and Headliner
 * members can enter all of them. The database checks the same rules again
 * (migration 012), and that the challenge is open, so a stale page can't
 * sneak an entry in late. The challenge page stays static: the form asks
 * getEntryStatus() what to show once it loads.
 */

export type EntryStatus =
  | { state: "signin" }
  | { state: "upgrade"; planName: string; difficulty: string }
  | { state: "entered"; youtubeId: string; status: string; submittedAt: string }
  | { state: "open"; name: string; email: string }
  | { state: "closed" };

async function openChallenge(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("challenges").select("id, title, opens, closes, published, difficulty").eq("slug", slug).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const open = !!data && data.published && today >= data.opens && today <= data.closes;
  return { supabase, challenge: data, open };
}

const allowed = (difficulty: string, plan: string, role: string) => role === "admin" || difficulty === "Beginner" || plan !== "warm-up";

export async function getEntryStatus(slug: string): Promise<EntryStatus> {
  if (typeof slug !== "string" || slug.length > 120) return { state: "closed" };
  const viewer = await getViewer();
  if (!viewer) return { state: "signin" };
  const { supabase, challenge, open } = await openChallenge(slug);
  if (!challenge) return { state: "closed" };

  const { data: entry } = await supabase
    .from("challenge_entries")
    .select("youtube_id, status, created_at")
    .eq("challenge_id", challenge.id)
    .eq("user_id", viewer.id)
    .maybeSingle();
  if (entry) return { state: "entered", youtubeId: entry.youtube_id, status: entry.status, submittedAt: entry.created_at };
  if (!open) return { state: "closed" };
  if (!allowed(challenge.difficulty, viewer.plan, viewer.role)) {
    const settings = await getSiteSettings();
    return { state: "upgrade", planName: settings.plans.find((p) => p.slug === "resident")?.name ?? "Resident", difficulty: challenge.difficulty };
  }
  return { state: "open", name: viewer.profile.djName || viewer.profile.fullName, email: viewer.email };
}

export async function submitEntry(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const slug = field(formData, "challenge");
  const name = field(formData, "name").replace(/\s+/g, " ");
  const youtube = field(formData, "youtube");
  const values = { name, youtube };

  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Log in to enter this challenge.", values };
  if (viewer.status === "suspended") return { status: "error", message: "Your account is suspended.", values };

  const { supabase, challenge, open } = await openChallenge(slug);
  if (!challenge || !open) return { status: "error", message: "This challenge isn't accepting entries right now.", values };
  if (!allowed(challenge.difficulty, viewer.plan, viewer.role)) {
    return { status: "error", message: `${challenge.difficulty} challenges are open to Resident and Headliner members.`, values };
  }

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  const nameError = validateName(name);
  if (nameError) fieldErrors.name = nameError;
  const videoId = youtube ? youtubeId(youtube) : null;
  if (!youtube) fieldErrors.youtube = "Paste the YouTube link to your entry.";
  else if (!videoId) fieldErrors.youtube = "That doesn't look like a YouTube link. Try copying it from the Share button.";
  if (formData.get("rules") !== "on") fieldErrors.rules = "Please confirm your entry follows the rules.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  const { error } = await supabase.from("challenge_entries").insert({
    challenge_id: challenge.id,
    user_id: viewer.id,
    name,
    email: viewer.email,
    youtube_url: youtube,
    youtube_id: videoId!,
  });

  if (error) {
    if (error.code === "23505") return { status: "notice", message: `You've already entered "${challenge.title}". One entry per person, good luck!`, values };
    if (error.code === "42501") return { status: "error", message: "This challenge isn't accepting entries right now.", values };
    console.error("[submitEntry]", error);
    return { status: "error", message: withDetail("We couldn't save your entry. Please try again.", error), values };
  }

  // The entry count on the challenge pages.
  updateTag(CONTENT_TAGS.challenges);
  return {
    status: "notice",
    message: `You're in! Your entry for "${challenge.title}" is saved. Winners are announced after the challenge closes.`,
  };
}
