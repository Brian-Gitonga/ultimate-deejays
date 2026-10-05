import { z } from "zod";
import { validateName } from "./auth";
import type { Enums, Tables } from "./supabase/database.types";

/*
 * The student profile: field options, the shape the profile form edits, and
 * validation shared by the form (instant feedback) and the server action (the
 * real check). Limits match the constraints in supabase/migrations.
 */

export const BIO_MAX = 280;

export const genreOptions = ["House", "Techno", "Amapiano", "Afrobeats", "Hip-Hop", "R&B", "Drum & Bass", "Open Format", "Disco", "Reggaeton"] as const;

export type Experience = Enums<"dj_experience">;

export const experienceOptions: { value: Experience; label: string; hint: string }[] = [
  { value: "new", label: "Brand new", hint: "Never touched the decks" },
  { value: "bedroom", label: "Bedroom DJ", hint: "Practicing at home" },
  { value: "gigging", label: "Gigging", hint: "Playing parties & bars" },
  { value: "pro", label: "Working pro", hint: "Regular paid bookings" },
];

/** What the profile page shows and edits. */
export type Profile = {
  fullName: string;
  djName: string;
  /** From the login; changed in Settings, not here */
  email: string;
  location: string;
  bio: string;
  experience: Experience;
  genres: string[];
  instagram: string;
  soundcloud: string;
  /** Public URL (Supabase Storage or Google), or null for initials */
  avatarUrl: string | null;
};

export function toProfile(row: Tables<"profiles">): Profile {
  return {
    fullName: row.full_name,
    djName: row.dj_name,
    email: row.email,
    location: row.location,
    bio: row.bio,
    experience: row.experience,
    genres: row.genres,
    instagram: row.instagram,
    soundcloud: row.soundcloud,
    avatarUrl: row.avatar_url,
  };
}

/** The editable fields, validated and normalized (trimmed, "@" stripped from Instagram). */
export const profileInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .superRefine((value, ctx) => {
      const error = validateName(value);
      if (error) ctx.addIssue({ code: "custom", message: error });
    }),
  djName: z.string().trim().max(40, "Keep your DJ name to 40 characters or fewer."),
  location: z.string().trim().max(80, "Keep your location to 80 characters or fewer."),
  bio: z.string().trim().max(BIO_MAX, `Keep your bio to ${BIO_MAX} characters.`),
  experience: z.enum(["new", "bedroom", "gigging", "pro"], "Choose your experience level."),
  genres: z.array(z.enum(genreOptions)).max(genreOptions.length),
  instagram: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@/, ""))
    .refine((v) => v === "" || /^[A-Za-z0-9._]{1,30}$/.test(v), "Enter your Instagram handle, like @djjordan."),
  soundcloud: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (v.length <= 200 && /^https:\/\/(www\.|on\.)?soundcloud\.com\/\S+$/.test(v)),
      "Paste your full SoundCloud link, starting with https://soundcloud.com/.",
    ),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

/** First error message per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Initials for an avatar placeholder: "Jordan Blake" → "JB". */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
