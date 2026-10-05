"use server";

import { z } from "zod";
import { isUuid, type ActionResult } from "@/lib/action-result";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { toEntry, toStudioChallenge } from "@/lib/db/studio/challenges";
import { challengeProblems, type ChallengeEntry, type StudioChallenge } from "@/lib/studio-challenges";
import { adminAction, must, StudioError } from "@/lib/studio-action";

const challengeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The challenge URL can only use lowercase letters, numbers and dashes.").max(100),
  title: z.string().trim().max(120),
  tagline: z.string().trim().max(200),
  type: z.enum(["scratch", "mixing", "transitions", "genre"]),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  opens: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Set the opening date."),
  closes: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Set the closing date."),
  image: z.string().max(500),
  prize: z.string().trim().max(300),
  brief: z.string().trim().max(5000),
  rules: z.array(z.string().trim().max(300)).max(30),
  judging: z.array(z.object({ label: z.string().trim().max(60), weight: z.number().min(0).max(100) })).max(10),
  inspiration: z.array(z.object({ youtube: z.string().max(300), title: z.string().max(200), dj: z.string().max(120), note: z.string().max(300) })).max(12),
  winners: z
    .array(z.object({ place: z.union([z.literal(1), z.literal(2), z.literal(3)]), name: z.string().max(80), avatar: z.string().max(500), city: z.string().max(80) }))
    .max(3)
    .optional(),
  published: z.boolean(),
});

/** Creates or updates a challenge. Publishing requires everything in "Before publishing". */
export async function saveChallenge(challenge: StudioChallenge): Promise<ActionResult<StudioChallenge>> {
  return adminAction(
    "save the challenge",
    async ({ supabase }) => {
      const parsed = challengeSchema.safeParse(challenge);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const c = parsed.data;
      if (c.closes < c.opens) throw new StudioError("The closing date must be after the opening date.");
      if (c.published) {
        const problems = Object.values(challengeProblems(challenge));
        if (problems.length) throw new StudioError(`Before publishing: ${problems.join(" ")}`);
      }

      const values = {
        slug: c.slug,
        title: c.title,
        tagline: c.tagline,
        type: c.type,
        difficulty: c.difficulty,
        opens: c.opens,
        closes: c.closes,
        image: c.image,
        prize: c.prize,
        brief: c.brief,
        rules: c.rules.filter(Boolean),
        judging: c.judging.filter((j) => j.label),
        inspiration: c.inspiration,
        winners: c.winners?.length ? c.winners : null,
        published: c.published,
      };
      const query = isUuid(challenge.id)
        ? supabase.from("challenges").update(values).eq("id", challenge.id)
        : supabase.from("challenges").insert(values);
      return toStudioChallenge(must(await query.select("*").single()));
    },
    { tags: [CONTENT_TAGS.challenges] },
  );
}

export async function deleteChallenge(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the challenge",
    async ({ supabase }) => {
      must(await supabase.from("challenges").delete().eq("id", id));
      return null;
    },
    { tags: [CONTENT_TAGS.challenges] },
  );
}

const entrySchema = z.object({
  status: z.enum(["submitted", "shortlisted", "winner", "disqualified"]),
  score: z.number().min(0).max(100).nullable(),
  notes: z.string().max(2000),
});

/** Judging: status, score (0–100) and private notes. */
export async function saveEntry(entry: ChallengeEntry): Promise<ActionResult<ChallengeEntry>> {
  return adminAction("save the entry", async ({ supabase }) => {
    const parsed = entrySchema.safeParse(entry);
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    return toEntry(must(await supabase.from("challenge_entries").update(parsed.data).eq("id", entry.id).select("*").single()));
  });
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the entry",
    async ({ supabase }) => {
      must(await supabase.from("challenge_entries").delete().eq("id", id));
      return null;
    },
    { tags: [CONTENT_TAGS.challenges] },
  );
}
