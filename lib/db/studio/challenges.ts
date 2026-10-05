import "server-only";
import { isUuid } from "@/lib/action-result";
import type { Difficulty, Inspiration, Winner } from "@/lib/challenges";
import type { ChallengeEntry, EntryStatus, StudioChallenge } from "@/lib/studio-challenges";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/* Challenges and their entries for the studio (admins see drafts and every entry, via RLS). */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function toStudioChallenge(row: Tables<"challenges">): StudioChallenge {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    type: row.type,
    difficulty: row.difficulty as Difficulty,
    opens: row.opens,
    closes: row.closes,
    image: row.image,
    entries: row.sample_entries + row.entry_count,
    prize: row.prize,
    brief: row.brief,
    rules: row.rules,
    judging: (row.judging as StudioChallenge["judging"]) ?? [],
    inspiration: (row.inspiration as Inspiration[]) ?? [],
    winners: (row.winners as Winner[] | null) ?? undefined,
    published: row.published,
    updatedAt: row.updated_at,
  };
}

export function toEntry(row: Tables<"challenge_entries">): ChallengeEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    youtubeUrl: row.youtube_url,
    youtubeId: row.youtube_id,
    status: row.status as EntryStatus,
    score: row.score === null ? null : Number(row.score),
    notes: row.notes,
    hasAccount: !!row.user_id,
    createdAt: row.created_at,
  };
}

export async function getStudioChallenges(client?: Supabase): Promise<StudioChallenge[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("challenges").select("*").order("opens", { ascending: false });
  if (error) throw new Error(`Couldn't load challenges: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return data.map(toStudioChallenge);
}

export async function getStudioChallenge(id: string, client?: Supabase): Promise<StudioChallenge | null> {
  if (!isUuid(id)) return null;
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("challenges").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Couldn't load the challenge: ${error.message}.`);
  return data ? toStudioChallenge(data) : null;
}

/** A challenge's entries, best score first, then newest. */
export async function getChallengeEntries(challengeId: string, client?: Supabase): Promise<ChallengeEntry[]> {
  if (!isUuid(challengeId)) return [];
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("challenge_entries")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load entries: ${error.message}.`);
  return data.map(toEntry);
}
