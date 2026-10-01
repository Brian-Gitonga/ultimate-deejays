import type { Course } from "./content";
import type { CategorySlug } from "./course-taxonomy";

/*
 * Course curricula. Lessons are YouTube links: paste any form of YouTube URL
 * (watch?v=, youtu.be/, /embed/, /shorts/) or a bare video ID.
 *
 * PLACEHOLDER: until your own lessons are recorded, every course is built from
 * a shared set of public DJ tutorials (verified embeddable, with their real
 * lengths), credited to their channels in the player. Replace them per course.
 */

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  youtube: string;
  durationSeconds: number;
  /** Channel credit for videos you didn't make; leave empty for your own */
  source?: string;
};

export type CurriculumSection = { title: string; lessons: Lesson[] };

const library = {
  firstBeatmatch: {
    slug: "first-beatmatch",
    title: "Your first beatmatch in five steps",
    summary:
      "A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.",
    youtube: "https://www.youtube.com/watch?v=ASUiL2pJp7w",
    durationSeconds: 456,
    source: "DJ Phil Harris",
  },
  beatmatchByEarQuick: {
    slug: "beatmatch-by-ear-quick",
    title: "Beatmatching by ear: the two-minute version",
    summary: "The whole idea of beatmatching by ear in two minutes, so you know exactly what you're listening for before you practice.",
    youtube: "https://youtu.be/8LWLJF7i8ZI",
    durationSeconds: 120,
    source: "Club Ready DJ School",
  },
  beatmatchStepByStep: {
    slug: "beatmatching-step-by-step",
    title: "Beatmatching, step by step",
    summary:
      "A slower, detailed look at beatmatching: hearing which track is faster, making small pitch adjustments and nudging the jog wheel until the kicks lock.",
    youtube: "https://www.youtube.com/watch?v=F6c62PKj-Ns",
    durationSeconds: 1126,
    source: "P4NTH3R",
  },
  earTraining: {
    slug: "mix-without-the-screen",
    title: "Train your ears: mixing without the screen",
    summary:
      "Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.",
    youtube: "https://www.youtube.com/watch?v=8_erWzDmlj4",
    durationSeconds: 2485,
    source: "Club Ready DJ School",
  },
  phrasing: {
    slug: "phrase-mixing",
    title: "Phrasing: mix on the right bar",
    summary:
      "Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.",
    youtube: "https://www.youtube.com/watch?v=_O-yX9MnGMw",
    durationSeconds: 455,
    source: "Zeeshan Khamis",
  },
  eq: {
    slug: "eq-essentials",
    title: "EQ essentials for clean blends",
    summary: "How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.",
    youtube: "https://www.youtube.com/watch?v=_zbtcdxKwsY",
    durationSeconds: 449,
    source: "Soundflow Music Academy",
  },
  transitions: {
    slug: "transitions-masterclass",
    title: "Transitions masterclass: phrasing, EQ & filters",
    summary: "Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.",
    youtube: "https://www.youtube.com/watch?v=Fd9jEpFG6II",
    durationSeconds: 1104,
    source: "Club Ready DJ School",
  },
  scratchSerato: {
    slug: "scratching-in-serato",
    title: "Scratching in Serato: the basics",
    summary: "Set up your controller for scratching in Serato and learn the first moves: hand position, the baby scratch and clean cuts.",
    youtube: "https://www.youtube.com/watch?v=p-D38xJH9Ko",
    durationSeconds: 421,
    source: "DJ Blighty",
  },
  recordScratches: {
    slug: "record-your-scratches",
    title: "Record your scratches on a controller",
    summary: "Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.",
    youtube: "https://www.youtube.com/watch?v=GEMlHyNFwao",
    durationSeconds: 427,
    source: "Kyle James Jezwinski",
  },
  abletonScratchTool: {
    slug: "ableton-scratch-tool",
    title: "Build a scratch tool in Ableton Live",
    summary: "Bring DJ technique into production: build a scratch tool in Ableton Live and use it alongside Serato.",
    youtube: "https://www.youtube.com/watch?v=cOtcWU6bL8g",
    durationSeconds: 2029,
    source: "Pointblank Music School",
  },
} satisfies Record<string, Lesson>;

const L = library;

const curricula: Record<CategorySlug, CurriculumSection[]> = {
  fundamentals: [
    { title: "Getting started", lessons: [L.beatmatchByEarQuick, L.firstBeatmatch] },
    { title: "Beatmatching", lessons: [L.beatmatchStepByStep, L.earTraining] },
    { title: "Your first mix", lessons: [L.phrasing, L.eq, L.transitions] },
  ],
  mixing: [
    { title: "Song structure", lessons: [L.phrasing] },
    { title: "EQ and blending", lessons: [L.eq, L.transitions] },
    { title: "Ear training", lessons: [L.beatmatchByEarQuick, L.earTraining] },
  ],
  scratch: [
    { title: "Scratch basics", lessons: [L.scratchSerato] },
    { title: "Practice and recording", lessons: [L.recordScratches] },
    { title: "Scratching in production", lessons: [L.abletonScratchTool] },
  ],
  production: [
    { title: "Arrangement for DJs", lessons: [L.phrasing] },
    { title: "Production tools", lessons: [L.abletonScratchTool, L.recordScratches] },
  ],
  "software-gear": [
    { title: "Setting up", lessons: [L.scratchSerato, L.recordScratches] },
    { title: "Mixing on your setup", lessons: [L.firstBeatmatch, L.beatmatchStepByStep, L.eq] },
  ],
  genres: [
    { title: "Groove and structure", lessons: [L.phrasing, L.eq] },
    { title: "Long blends", lessons: [L.transitions] },
    { title: "Playing by ear", lessons: [L.earTraining] },
  ],
  performance: [
    { title: "Planning your set", lessons: [L.phrasing] },
    { title: "Transitions that keep the floor", lessons: [L.transitions, L.eq] },
    { title: "Trusting your ears", lessons: [L.earTraining] },
  ],
  "branding-gigs": [
    { title: "Be gig-ready", lessons: [L.firstBeatmatch, L.phrasing] },
    { title: "Sound professional", lessons: [L.transitions] },
    { title: "Play anywhere", lessons: [L.earTraining] },
  ],
};

export function getCurriculum(course: Course): CurriculumSection[] {
  return curricula[course.category];
}

/** The video ID from any YouTube link (or a bare 11-character ID). */
export function youtubeId(link: string): string | null {
  const bare = /^[\w-]{11}$/;
  if (bare.test(link)) return link;
  try {
    const url = new URL(link);
    if (url.hostname === "youtu.be") return url.pathname.slice(1, 12) || null;
    const v = url.searchParams.get("v");
    if (v && bare.test(v)) return v;
    const match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** 1126 -> "18:46", 2485 -> "41:25", 4000 -> "1:06:40" */
export function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
