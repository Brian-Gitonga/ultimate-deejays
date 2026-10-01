/*
 * The vocabulary of the course catalogue: categories, levels, duration ranges
 * and sort orders. Kept apart from lib/content so browser code (the filter
 * sidebar) can import it without pulling in the catalogue itself.
 */

type Topic = { slug: string; name: string; description: string };
export type CourseCategory = Topic & { children?: readonly Topic[] };

export const courseCategories = [
  {
    slug: "fundamentals",
    name: "DJ Fundamentals",
    description: "Start here: how a DJ setup works, beatmatching, phrasing and recording your first confident mix.",
  },
  {
    slug: "mixing",
    name: "Mixing & Transitions",
    description: "EQ, harmonic mixing and tight transitions that make two tracks sound like one.",
  },
  {
    slug: "scratch",
    name: "Scratch & Turntablism",
    description: "Scratch patterns, vinyl technique and turntable skills, built up one drill at a time.",
  },
  {
    slug: "production",
    name: "Music Production",
    description: "Make edits, remixes and original tracks that work on a dance floor.",
  },
  {
    slug: "software-gear",
    name: "DJ Software & Gear",
    description: "Master the software and hardware working DJs rely on, from Serato to club-standard CDJs.",
    children: [
      { slug: "serato", name: "Serato DJ", description: "Learn Serato DJ Pro inside out, from crate management to performance features." },
      { slug: "rekordbox", name: "rekordbox & CDJs", description: "Prepare your music in rekordbox and play confidently on club-standard CDJs." },
    ],
  },
  {
    slug: "genres",
    name: "Genres & Styles",
    description: "Learn the techniques, track selection and culture behind the sounds that fill dance floors.",
    children: [
      { slug: "afrobeats-amapiano", name: "Afrobeats & Amapiano", description: "Long blends, log drum swaps and the grooves driving African dance music worldwide." },
      { slug: "house-techno", name: "House & Techno", description: "Patient blends, tension and release, from deep warm-ups to peak-time techno." },
      { slug: "open-format", name: "Hip-Hop & Open Format", description: "Quick mixes, edits and genre switches for bars, parties and open-format sets." },
    ],
  },
  {
    slug: "performance",
    name: "Live Performance",
    description: "Read the crowd, shape the energy of a night and deliver sets people remember.",
  },
  {
    slug: "branding-gigs",
    name: "Branding & Gigs",
    description: "Land bookings, run events and build a lasting career behind the decks.",
  },
] as const satisfies readonly CourseCategory[];

export type CategorySlug = (typeof courseCategories)[number]["slug"];
type WithChildren = Extract<(typeof courseCategories)[number], { children: readonly unknown[] }>;
export type SubcategorySlug = WithChildren["children"][number]["slug"];
export type TopicSlug = CategorySlug | SubcategorySlug;

/** Finds a category or subcategory by slug, with its parent when it's a subcategory. */
export function findTopic(slug: string | null): { topic: Topic; parent?: CourseCategory } | undefined {
  if (!slug) return undefined;
  for (const category of courseCategories as readonly CourseCategory[]) {
    if (category.slug === slug) return { topic: category };
    const child = category.children?.find((c) => c.slug === slug);
    if (child) return { topic: child, parent: category };
  }
  return undefined;
}

export const courseLevels = [
  { slug: "beginner", name: "Beginner" },
  { slug: "intermediate", name: "Intermediate" },
  { slug: "advanced", name: "Advanced" },
] as const;

export type LevelSlug = (typeof courseLevels)[number]["slug"];

/** A course's level: one of the three, or suitable for everyone. */
export type Level = (typeof courseLevels)[number]["name"] | "All Levels";

export const courseDurations = [
  { slug: "under-6", name: "Under 6 hours", min: 0, max: 360 },
  { slug: "6-10", name: "6 to 10 hours", min: 360, max: 600 },
  { slug: "over-10", name: "Over 10 hours", min: 600, max: Infinity },
] as const;

export type DurationSlug = (typeof courseDurations)[number]["slug"];

export const courseSorts = [
  { slug: "popular", name: "Most popular" },
  { slug: "newest", name: "Newest" },
  { slug: "rating", name: "Highest rated" },
  { slug: "shortest", name: "Shortest first" },
] as const;

export type SortSlug = (typeof courseSorts)[number]["slug"];

/** 860 -> "14hr 20min" */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}min`;
  return rest ? `${hours}hr ${rest}min` : `${hours}hr`;
}

/** 860 -> "PT14H20M" (ISO 8601, for structured data) */
export function isoDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `PT${hours ? `${hours}H` : ""}${rest || !hours ? `${rest}M` : ""}`;
}
