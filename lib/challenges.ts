/*
 * DJ challenges. PLACEHOLDER content: challenge briefs, entry counts and
 * community winners are sample data. "Inspiration" videos are real, public
 * championship routines (verified embeddable), always credited to their DJs.
 */

export type ChallengeType = "scratch" | "mixing" | "transitions" | "genre";
export type ChallengeStatus = "live" | "upcoming" | "ended";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Inspiration = { youtube: string; title: string; dj: string; note: string };
export type Winner = { place: 1 | 2 | 3; name: string; avatar: string; city: string };

export type Challenge = {
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

const avatar = (n: number) => `/images/students/student-${n}.jpg`;

export const challenges: Challenge[] = [
  {
    slug: "baby-scratch-bootcamp",
    title: "Baby Scratch Bootcamp",
    tagline: "One scratch, 60 seconds, total control.",
    type: "scratch",
    difficulty: "Beginner",
    status: "live",
    opens: "2026-09-15",
    closes: "2026-10-18",
    image: "/images/courses/scratch-school.jpg",
    entries: 148,
    prize: "Free Scratch School course + featured on our socials",
    brief:
      "Every great scratch DJ started with the baby scratch. Record 60 seconds of baby scratches over a steady beat, showing clean rhythm, varied patterns and tight timing. No transforms, no fader tricks: just your hand, the record and the beat.",
    rules: [
      "Use only the baby scratch (hand on the record, no crossfader cuts).",
      "Keep it to 60 seconds, recorded in one take.",
      "Any beat between 85 and 100 BPM.",
      "Show your hands on the platter or jog wheel in the video.",
      "Upload to YouTube (public or unlisted) and submit the link.",
    ],
    judging: [
      { label: "Timing & rhythm", weight: 50 },
      { label: "Sound quality & control", weight: 30 },
      { label: "Creativity", weight: 20 },
    ],
    inspiration: [inspo.chell, inspo.kSwizz],
  },
  {
    slug: "one-minute-house-blend",
    title: "The One-Minute House Blend",
    tagline: "Two tracks. One seamless minute.",
    type: "mixing",
    difficulty: "Beginner",
    status: "live",
    opens: "2026-09-22",
    closes: "2026-10-25",
    image: "/images/courses/house-techno-mixing.jpg",
    entries: 96,
    prize: "Resident plan free for a year + mix feedback from Leo Moreno",
    brief:
      "Blend two house tracks so smoothly that nobody could say where one ends and the next begins. Show a clean beatmatch, a well-timed bass swap and a transition that lands on the phrase.",
    rules: [
      "Exactly two house tracks, blended in one continuous take.",
      "At least 60 seconds of the tracks playing together.",
      "Any gear: controller, CDJs or turntables.",
      "No pre-made mixes, loops or edits of the blend.",
      "Submit a YouTube link showing your hands and your mixer.",
    ],
    judging: [
      { label: "Beatmatch & phrasing", weight: 40 },
      { label: "EQ and sound", weight: 40 },
      { label: "Track selection", weight: 20 },
    ],
    inspiration: [inspo.puffy, inspo.damianito],
  },
  {
    slug: "amapiano-log-drum-switch",
    title: "Amapiano Log Drum Switch",
    tagline: "Swap the log drum, keep the groove.",
    type: "genre",
    difficulty: "Intermediate",
    status: "live",
    opens: "2026-09-10",
    closes: "2026-10-12",
    image: "/images/courses/afrobeats-amapiano-mixing.jpg",
    entries: 211,
    prize: "Afrobeats & Amapiano course + a guest mix slot on our stream",
    brief:
      "Amapiano is all about patience. Build a 3-minute mini-set of amapiano with at least two transitions, using clean log drum swaps so the bass never doubles up and the groove never drops.",
    rules: [
      "3 minutes, at least three amapiano tracks.",
      "At least two transitions, both with a clean low-end swap.",
      "Tempo between 108 and 116 BPM.",
      "Record in one take and submit a YouTube link.",
    ],
    judging: [
      { label: "Low-end control", weight: 40 },
      { label: "Groove & flow", weight: 35 },
      { label: "Selection", weight: 25 },
    ],
    inspiration: [inspo.afro, inspo.damianito],
  },
  {
    slug: "transform-and-flare-battle",
    title: "Transform & Flare Battle",
    tagline: "Crossfader cuts, full speed.",
    type: "scratch",
    difficulty: "Advanced",
    status: "upcoming",
    opens: "2026-10-20",
    closes: "2026-11-22",
    image: "/images/blog/crate-digging.jpg",
    entries: 0,
    prize: "Headliner plan for life + a scratch session with Marcus Reid",
    brief:
      "Take it to the fader. Put together a 90-second scratch routine built around transforms and flares, with a clear structure: intro, build and a finishing combo that makes judges rewind.",
    rules: [
      "90 seconds maximum, recorded in one take.",
      "Must include transforms and at least one flare pattern.",
      "Show both hands clearly throughout.",
      "Original routine: no copied routines from other DJs.",
    ],
    judging: [
      { label: "Technique", weight: 45 },
      { label: "Musicality", weight: 30 },
      { label: "Originality", weight: 25 },
    ],
    inspiration: [inspo.skillz, inspo.matsunaga],
  },
  {
    slug: "three-genre-open-format",
    title: "Three-Genre Open Format",
    tagline: "Hip-hop, Afrobeats, house. Five minutes.",
    type: "transitions",
    difficulty: "Intermediate",
    status: "upcoming",
    opens: "2026-11-01",
    closes: "2026-12-06",
    image: "/images/courses/open-format-djing.jpg",
    entries: 0,
    prize: "Open-Format course + a feature in our newsletter",
    brief:
      "Show you can move a crowd between worlds. Mix hip-hop, Afrobeats and house in a 5-minute set, with transitions that feel natural even when the tempo and genre change completely.",
    rules: [
      "5 minutes, with all three genres in any order.",
      "At least two genre changes with a tempo shift.",
      "Clean versions only: this is a party-friendly set.",
      "Submit one continuous take as a YouTube link.",
    ],
    judging: [
      { label: "Transitions", weight: 45 },
      { label: "Energy & flow", weight: 35 },
      { label: "Selection", weight: 20 },
    ],
    inspiration: [inspo.damianito, inspo.eskei],
  },
  {
    slug: "juggle-the-break",
    title: "Juggle the Break",
    tagline: "Two copies. One brand-new groove.",
    type: "scratch",
    difficulty: "Advanced",
    status: "ended",
    opens: "2026-07-01",
    closes: "2026-08-10",
    image: "/images/courses/vinyl-djing-essentials.jpg",
    entries: 184,
    prize: "Headliner plan for life",
    brief:
      "Beat juggling turns two copies of a break into something new. Entrants built 60-second juggles that rearranged a classic break into original patterns.",
    rules: [
      "60 seconds, two copies of the same break.",
      "No looping features or sync.",
      "One continuous take.",
    ],
    judging: [
      { label: "Precision", weight: 50 },
      { label: "Creativity", weight: 30 },
      { label: "Musicality", weight: 20 },
    ],
    inspiration: [inspo.vekked, inspo.brace],
    winners: [
      { place: 1, name: "Kofi A.", avatar: avatar(4), city: "Accra" },
      { place: 2, name: "Lena M.", avatar: avatar(2), city: "Berlin" },
      { place: 3, name: "Ravi P.", avatar: avatar(1), city: "Toronto" },
    ],
  },
  {
    slug: "festival-drop-remix",
    title: "Festival Drop Moment",
    tagline: "Build it up. Drop it big.",
    type: "transitions",
    difficulty: "Intermediate",
    status: "ended",
    opens: "2026-05-15",
    closes: "2026-06-20",
    image: "/images/courses/festival-sets.jpg",
    entries: 237,
    prize: "Festival Sets course + mentoring call",
    brief:
      "Entrants built a 2-minute moment that a festival crowd would never forget: a tension-building transition that ends on a huge drop.",
    rules: ["2 minutes maximum.", "One transition into a drop.", "One continuous take."],
    judging: [
      { label: "Build & tension", weight: 40 },
      { label: "Drop impact", weight: 40 },
      { label: "Technique", weight: 20 },
    ],
    inspiration: [inspo.eskei, inspo.puffy],
    winners: [
      { place: 1, name: "Sam O.", avatar: avatar(5), city: "London" },
      { place: 2, name: "Nia K.", avatar: avatar(3), city: "Nairobi" },
      { place: 3, name: "Diego R.", avatar: avatar(1), city: "Madrid" },
    ],
  },
];

export const getChallenge = (slug: string) => challenges.find((c) => c.slug === slug);

/** Famous routines for the "Legendary routines" strip on the challenges page. */
export const legendaryRoutines: Inspiration[] = [inspo.kSwizz, inspo.skillz, inspo.matsunaga, inspo.damianito];
