"use server";

import { validateEmail, validateName, type AuthField, type AuthFormState } from "@/lib/auth";
import { getChallenge } from "@/lib/challenges";
import { youtubeId } from "@/lib/curriculum";

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export async function submitEntry(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const challenge = getChallenge(field(formData, "challenge"));
  const name = field(formData, "name").replace(/\s+/g, " ");
  const email = field(formData, "email").toLowerCase();
  const youtube = field(formData, "youtube");
  const values = { name, email, youtube };

  if (!challenge || challenge.status !== "live") {
    return { status: "error", message: "This challenge isn't accepting entries right now.", values };
  }

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  const nameError = validateName(name);
  if (nameError) fieldErrors.name = nameError;
  const emailError = validateEmail(email);
  if (emailError) fieldErrors.email = emailError;
  if (!youtube) fieldErrors.youtube = "Paste the YouTube link to your entry.";
  else if (!youtubeId(youtube)) fieldErrors.youtube = "That doesn't look like a YouTube link. Try copying it from the Share button.";
  if (formData.get("rules") !== "on") fieldErrors.rules = "Please confirm your entry follows the rules.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  // TODO: save the entry (challenge, user, video ID) to your database and email a confirmation.
  return {
    status: "notice",
    message: `Your link checks out. Online entries open with student accounts, so we'll add "${challenge.title}" entries soon.`,
    values,
  };
}
