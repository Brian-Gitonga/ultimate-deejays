import "server-only";
import { cache } from "react";
import type { Challenge, ChallengeStatus, Difficulty, Inspiration, Winner } from "@/lib/challenges";
import type { Tables } from "@/lib/supabase/database.types";
import { contentClient, maybeOrThrow, orThrow } from "./content-client";

/* Published challenges for the public site. Live / upcoming / ended is worked out from the dates. */

export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function challengeStatus(opens: string, closes: string, today = todayUtc()): ChallengeStatus {
  if (today < opens) return "upcoming";
  if (today > closes) return "ended";
  return "live";
}

export function toChallenge(row: Tables<"challenges">): Challenge {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    type: row.type,
    difficulty: row.difficulty as Difficulty,
    status: challengeStatus(row.opens, row.closes),
    opens: row.opens,
    closes: row.closes,
    image: row.image || "/images/hero-dj.webp",
    entries: row.sample_entries + row.entry_count,
    prize: row.prize,
    brief: row.brief,
    rules: row.rules,
    judging: (row.judging as Challenge["judging"]) ?? [],
    inspiration: (row.inspiration as Inspiration[]) ?? [],
    winners: (row.winners as Winner[] | null) ?? undefined,
  };
}

const order: Record<ChallengeStatus, number> = { live: 0, upcoming: 1, ended: 2 };

/** Live first, then upcoming (soonest first), then ended (most recent first). */
export const getPublicChallenges = cache(async (): Promise<Challenge[]> => {
  const rows = orThrow(await contentClient("challenges").from("challenges").select("*").order("opens", { ascending: false }), "challenges");
  return rows
    .map(toChallenge)
    .sort((a, b) => order[a.status] - order[b.status] || (a.status === "upcoming" ? a.opens.localeCompare(b.opens) : b.closes.localeCompare(a.closes)));
});

export const getPublicChallenge = cache(async (slug: string): Promise<Challenge | null> => {
  const row = maybeOrThrow(await contentClient("challenges").from("challenges").select("*").eq("slug", slug).maybeSingle(), "the challenge");
  return row ? toChallenge(row) : null;
});
