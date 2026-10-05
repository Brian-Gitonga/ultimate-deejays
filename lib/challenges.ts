/*
 * DJ challenges: the shape the site renders and the vocabulary (types,
 * statuses). Challenges themselves live in the database and are edited in
 * Studio → Challenges. "Inspiration" videos are real, public championship
 * routines (verified embeddable), always credited to their DJs.
 */

export type ChallengeType = "scratch" | "mixing" | "transitions" | "genre";
export type ChallengeStatus = "live" | "upcoming" | "ended";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Inspiration = { youtube: string; title: string; dj: string; note: string };
export type Winner = { place: 1 | 2 | 3; name: string; avatar: string; city: string };

export type Challenge = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  type: ChallengeType;
  difficulty: Difficulty;
  status: ChallengeStatus;
  /** ISO dates */
  opens: string;
  closes: string;
  image: string;
  entries: number;
  prize: string;
  brief: string;
  rules: string[];
  judging: { label: string; weight: number }[];
  inspiration: Inspiration[];
  winners?: Winner[];
};

export const challengeTypes: { slug: ChallengeType; name: string }[] = [
  { slug: "scratch", name: "Scratch" },
  { slug: "mixing", name: "Mixing" },
  { slug: "transitions", name: "Transitions" },
  { slug: "genre", name: "Genre" },
];

export const challengeStatuses: { slug: ChallengeStatus; name: string }[] = [
  { slug: "live", name: "Live now" },
  { slug: "upcoming", name: "Upcoming" },
  { slug: "ended", name: "Ended" },
];

const inspo = {
  kSwizz: {
    youtube: "https://www.youtube.com/watch?v=lrXFmNjNQZ0",
    title: "2023 DMC World Champion winning routine",
    dj: "K-Swizz (New Zealand)",
    note: "Watch how every cut lands exactly on the beat, even at full speed.",
  },
  skillz: {
    youtube: "https://www.youtube.com/watch?v=irQXrpQdv_Y",
    title: "2018 DMC World Championship winning routine",
    dj: "DJ Skillz",
    note: "A masterclass in routine structure: every section builds on the last.",
  },
  vekked: {
    youtube: "https://www.youtube.com/watch?v=bFlkhnPfU3Y",
    title: "DMC World Championship winning routine",
    dj: "DJ Vekked",
    note: "Beat juggling so clean it sounds like a new record.",
  },
  matsunaga: {
    youtube: "https://www.youtube.com/watch?v=hUcH9LLqPpA",
    title: "DMC World DJ Championships 2019 winning routine",
    dj: "DJ Matsunaga",
    note: "Creative sample choice and flawless precision under pressure.",
  },
  chell: {
    youtube: "https://www.youtube.com/watch?v=FVshXe200RI",
    title: "2026 DMC Scratch Wildcard champion",
    dj: "Chell (Russia)",
    note: "Pure scratch technique: tone, rhythm and control.",
  },
  brace: {
    youtube: "https://www.youtube.com/watch?v=44F0d2CbjM0",
    title: "2016 DMC Online Finals winning routine",
    dj: "DJ Brace",
    note: "Proof that a great routine can be recorded at home.",
  },
  damianito: {
    youtube: "https://www.youtube.com/watch?v=TnHqMVAX-c0",
    title: "Red Bull 3Style 2018 World Champion winning set",
    dj: "DJ Damianito",
    note: "Genre-hopping with perfect crowd energy from start to finish.",
  },
  puffy: {
    youtube: "https://www.youtube.com/watch?v=fmVPTmOnNQg",
    title: "Red Bull Thre3style 2016 World Finals winning set",
    dj: "DJ Puffy",
    note: "Tight transitions and big moments, all in fifteen minutes.",
  },
  afro: {
    youtube: "https://www.youtube.com/watch?v=R8vh_xFAIvc",
    title: "Red Bull 3Style World Finals 2019 set",
    dj: "DJ Afro",
    note: "Selection that tells a story and keeps surprising the room.",
  },
  eskei: {
    youtube: "https://www.youtube.com/watch?v=OUJA3TkyFRI",
    title: "Red Bull 3Style World Finals 2019 full set",
    dj: "Eskei83",
    note: "Huge energy and creative blends across bass, trap and future bass.",
  },
} satisfies Record<string, Inspiration>;

export const legendaryRoutines: Inspiration[] = [inspo.kSwizz, inspo.skillz, inspo.matsunaga, inspo.damianito];
