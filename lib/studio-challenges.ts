import type { Challenge, ChallengeStatus } from "./challenges";

/*
 * Challenges as the studio edits them. Live/upcoming/ended comes from the
 * dates, so it never goes stale. Stored in the challenges table; entries in
 * challenge_entries (see ChallengeEntry).
 */

export type StudioChallenge = Omit<Challenge, "status"> & { published: boolean; updatedAt: string };

export type ChallengeState = ChallengeStatus | "draft";

export type EntryStatus = "submitted" | "shortlisted" | "winner" | "disqualified";

export type ChallengeEntry = {
  id: string;
  name: string;
  email: string;
  youtubeUrl: string;
  youtubeId: string;
  status: EntryStatus;
  score: number | null;
  notes: string;
  /** Signed in when they entered */
  hasAccount: boolean;
  createdAt: string;
};

export const entryStatuses: { value: EntryStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "winner", label: "Winner" },
  { value: "disqualified", label: "Disqualified" },
];

export function challengeState(c: Pick<StudioChallenge, "published" | "opens" | "closes">, today = new Date().toISOString().slice(0, 10)): ChallengeState {
  if (!c.published) return "draft";
  if (today < c.opens) return "upcoming";
  if (today > c.closes) return "ended";
  return "live";
}

export function challengeProblems(c: StudioChallenge): Record<string, string> {
  const problems: Record<string, string> = {};
  if (c.title.trim().length < 5) problems.title = "Give the challenge a title of at least 5 characters.";
  if (!c.tagline.trim()) problems.tagline = "Add a one-line tagline.";
  if (!c.image) problems.image = "Add a cover image.";
  if (!c.opens || !c.closes) problems.closes = "Set both dates.";
  else if (c.closes < c.opens) problems.closes = "The closing date must be after the opening date.";
  if (c.brief.trim().split(/\s+/).length < 20) problems.brief = "Write a brief of at least 20 words.";
  if (c.rules.filter((r) => r.trim()).length < 2) problems.rules = "Add at least 2 rules.";
  const total = c.judging.reduce((sum, j) => sum + (Number(j.weight) || 0), 0);
  if (!c.judging.length || total !== 100) problems.judging = `Judging weights must add up to 100% (now ${total}%).`;
  if (!c.prize.trim()) problems.prize = "Describe the prize.";
  return problems;
}
