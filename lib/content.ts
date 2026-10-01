/*
 * Placeholder catalogue for the site. Figures, instructors, team and posts
 * are sample content — replace them with real data (CMS or database) later.
 * Photos are from Pexels (free to use, no attribution required).
 */

import { articles, readingMinutes, type ArticleSlug } from "./articles";
import type { CategorySlug, Level, SubcategorySlug } from "./course-taxonomy";
import { postCategories, type PostCategory } from "./post-categories";

export type Course = {
  slug: string;
  title: string;
  /** One or two sentences: shown in list view, search and structured data */
  summary: string;
  image: string;
  level: Level;
  category: CategorySlug;
  subcategory?: SubcategorySlug;
  instructor: Instructor;
  students: number;
  durationMinutes: number;
  rating: number;
  reviews: number;
  publishedAt: string;
};

export type Instructor = {
  slug: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
};

export type Post = {
  slug: ArticleSlug;
  title: string;
  excerpt: string;
  category: PostCategory;
  image: string;
  author: Instructor;
  readMinutes: number;
  publishedAt: string;
};

const instructor = (i: Omit<Instructor, "image">): Instructor => ({
  ...i,
  image: `/images/instructors/${i.slug}.jpg`,
});

export const instructors: Instructor[] = [
  instructor({
    slug: "marcus-reid",
    name: "Marcus Reid",
    specialty: "Scratch & Turntablism",
    bio: "Marcus is a turntablist and club DJ who believes every DJ should be able to mix by ear. He teaches scratching, beatmatching and the fundamentals that make everything else easier.",
  }),
  instructor({
    slug: "sofia-martins",
    name: "Sofia Martins",
    specialty: "Music Production",
    bio: "Sofia is a producer and DJ who makes edits and originals for her own sets. She teaches production with one goal: music that works on a dance floor.",
  }),
  instructor({
    slug: "daniel-mensah",
    name: "Daniel Mensah",
    specialty: "Afrobeats & Amapiano",
    bio: "Daniel plays Afrobeats and amapiano for clubs and events, and is known for long, patient blends that keep the floor moving all night.",
  }),
  instructor({
    slug: "amara-okafor",
    name: "Amara Okafor",
    specialty: "Open-Format & Events",
    bio: "Amara is an open-format and wedding DJ who teaches the business side of DJing, from pitching promoters to running a flawless event.",
  }),
  instructor({
    slug: "leo-moreno",
    name: "Leo Moreno",
    specialty: "House & Techno",
    bio: "Leo is a house and techno DJ who cares about clean mixes, careful gain staging and healthy ears, in that order.",
  }),
  instructor({
    slug: "mei-tanaka",
    name: "Mei Tanaka",
    specialty: "Serato & Controllers",
    bio: "Mei specializes in Serato and DJ controllers, and helps new DJs choose the right gear and get the most out of it.",
  }),
];

const instructorBySlug = (slug: string) => instructors.find((i) => i.slug === slug)!;

const course = (c: Omit<Course, "image" | "instructor"> & { instructor: string }): Course => ({
  ...c,
  image: `/images/courses/${c.slug}.jpg`,
  instructor: instructorBySlug(c.instructor),
});

export const courses: Course[] = [
  course({
    slug: "dj-fundamentals",
    title: "DJ Fundamentals: Beatmatching & Your First Mix",
    summary:
      "Learn how a DJ setup works, beatmatch by ear, count phrases and blend two tracks cleanly, then record a confident first mix you're proud to share.",
    level: "Beginner",
    category: "fundamentals",
    instructor: "marcus-reid",
    students: 1284,
    durationMinutes: 860,
    rating: 4.9,
    reviews: 412,
    publishedAt: "2025-09-15",
  }),
  course({
    slug: "serato-dj-pro-masterclass",
    title: "Serato DJ Pro Masterclass: From Setup to Stage",
    summary:
      "Set up Serato DJ Pro, build a crate system that scales, and master hot cues, loops, effects and recording on any Serato-compatible controller.",
    level: "Beginner",
    category: "software-gear",
    subcategory: "serato",
    instructor: "mei-tanaka",
    students: 963,
    durationMinutes: 705,
    rating: 4.8,
    reviews: 287,
    publishedAt: "2025-10-20",
  }),
  course({
    slug: "rekordbox-cdj-club-ready",
    title: "rekordbox & CDJs: Get Club-Ready on Pro Gear",
    summary:
      "Prepare USB drives in rekordbox, set hot cues and memory cues, and walk into any booth confident on club-standard CDJs and mixers.",
    level: "Intermediate",
    category: "software-gear",
    subcategory: "rekordbox",
    instructor: "leo-moreno",
    students: 842,
    durationMinutes: 570,
    rating: 4.9,
    reviews: 231,
    publishedAt: "2025-11-18",
  }),
  course({
    slug: "scratch-school",
    title: "Scratch School: From Baby Scratch to Flares",
    summary:
      "Build real scratch technique step by step, from baby scratches and chops to transforms and flares, with drills you can practice on any setup.",
    level: "Intermediate",
    category: "scratch",
    instructor: "marcus-reid",
    students: 611,
    durationMinutes: 495,
    rating: 4.8,
    reviews: 176,
    publishedAt: "2025-12-10",
  }),
  course({
    slug: "afrobeats-amapiano-mixing",
    title: "Afrobeats & Amapiano Mixing Blueprint",
    summary:
      "Mix Afrobeats and amapiano with long, patient blends, clean log drum swaps and smooth tempo changes that keep the whole room moving.",
    level: "Intermediate",
    category: "genres",
    subcategory: "afrobeats-amapiano",
    instructor: "daniel-mensah",
    students: 1027,
    durationMinutes: 460,
    rating: 4.9,
    reviews: 305,
    publishedAt: "2026-01-14",
  }),
  course({
    slug: "harmonic-mixing",
    title: "Harmonic Mixing: Mix in Key Like a Pro",
    summary:
      "Use key detection and the Camelot wheel to plan blends that sound musical, lift the energy with key changes and avoid clashes.",
    level: "Intermediate",
    category: "mixing",
    instructor: "leo-moreno",
    students: 538,
    durationMinutes: 310,
    rating: 4.7,
    reviews: 142,
    publishedAt: "2026-02-11",
  }),
  course({
    slug: "ableton-production-for-djs",
    title: "Music Production for DJs in Ableton Live",
    summary:
      "Go from DJ to producer in Ableton Live: make edits, build DJ-friendly intros and outros, and finish your first original track.",
    level: "Beginner",
    category: "production",
    instructor: "sofia-martins",
    students: 704,
    durationMinutes: 965,
    rating: 4.8,
    reviews: 198,
    publishedAt: "2026-03-12",
  }),
  course({
    slug: "open-format-djing",
    title: "Open-Format DJing: Hip-Hop, R&B & Top 40",
    summary:
      "Move between hip-hop, R&B, Afrobeats and Top 40 without losing the room, with quick-mix techniques, edits and smart request handling.",
    level: "Intermediate",
    category: "genres",
    subcategory: "open-format",
    instructor: "amara-okafor",
    students: 489,
    durationMinutes: 410,
    rating: 4.8,
    reviews: 121,
    publishedAt: "2026-04-08",
  }),
  course({
    slug: "vinyl-djing-essentials",
    title: "Vinyl DJing: Needle Drops, Cueing & Record Care",
    summary:
      "Learn to DJ on real turntables: cueing by hand, needle drops, riding the pitch and looking after your records and stylus.",
    level: "Beginner",
    category: "scratch",
    instructor: "marcus-reid",
    students: 214,
    durationMinutes: 380,
    rating: 4.8,
    reviews: 38,
    publishedAt: "2026-09-22",
  }),
  course({
    slug: "wedding-event-dj",
    title: "Wedding & Event DJ: Run the Whole Night",
    summary:
      "Plan and run weddings and private events from first dance to last song, including timelines, MC skills, announcements and backup gear.",
    level: "Intermediate",
    category: "branding-gigs",
    instructor: "amara-okafor",
    students: 186,
    durationMinutes: 475,
    rating: 4.9,
    reviews: 41,
    publishedAt: "2026-09-08",
  }),
  course({
    slug: "reading-the-crowd",
    title: "Reading the Crowd: Sets That Keep the Floor Full",
    summary:
      "Learn to read a dance floor, pick the right next track and shape the energy of a night, whether you're opening or closing.",
    level: "All Levels",
    category: "performance",
    instructor: "daniel-mensah",
    students: 342,
    durationMinutes: 270,
    rating: 4.9,
    reviews: 67,
    publishedAt: "2026-08-25",
  }),
  course({
    slug: "house-techno-mixing",
    title: "House & Techno: Long Blends and Big Build-Ups",
    summary:
      "Master long blends, EQ control and tension-building in house and techno, from deep warm-ups to peak-time grooves.",
    level: "Intermediate",
    category: "genres",
    subcategory: "house-techno",
    instructor: "leo-moreno",
    students: 258,
    durationMinutes: 520,
    rating: 4.7,
    reviews: 49,
    publishedAt: "2026-08-11",
  }),
  course({
    slug: "controller-djing",
    title: "Controller DJing: Get the Most From Your First Setup",
    summary:
      "Get the most out of your first controller: layout, performance pads, loops and effects, plus the habits that carry over to club gear.",
    level: "Beginner",
    category: "fundamentals",
    instructor: "mei-tanaka",
    students: 397,
    durationMinutes: 325,
    rating: 4.8,
    reviews: 73,
    publishedAt: "2026-07-28",
  }),
  course({
    slug: "festival-sets",
    title: "Festival Sets: Energy, Drops & Big-Room Moments",
    summary:
      "Plan and perform big-stage sets with dramatic drops, clean edits and energy that carries across a crowd of thousands.",
    level: "Advanced",
    category: "performance",
    instructor: "daniel-mensah",
    students: 129,
    durationMinutes: 370,
    rating: 4.8,
    reviews: 22,
    publishedAt: "2026-07-14",
  }),
  course({
    slug: "radio-mixshow-dj",
    title: "Radio & Mixshow DJing: Talk-Ups and Tight Mixes",
    summary:
      "Build tight, high-energy mixshows for radio and streaming, with clean talk-ups, timed segments and precise quick mixes.",
    level: "Intermediate",
    category: "mixing",
    instructor: "amara-okafor",
    students: 97,
    durationMinutes: 345,
    rating: 4.7,
    reviews: 18,
    publishedAt: "2026-06-30",
  }),
  course({
    slug: "first-club-gig",
    title: "Your First Club Gig: Prep, Etiquette & Performance",
    summary:
      "Everything to know before your first club booking: preparing your music, booth etiquette, warm-up sets and getting booked again.",
    level: "Beginner",
    category: "branding-gigs",
    instructor: "leo-moreno",
    students: 276,
    durationMinutes: 230,
    rating: 4.9,
    reviews: 54,
    publishedAt: "2026-06-16",
  }),
];

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);

const byStudents =(a: Course, b: Course) => b.students - a.students;
const byNewest = (a: Course, b: Course) => b.publishedAt.localeCompare(a.publishedAt);

/* Home page rows: the most-enrolled and the most recently published courses. */
export const popularCourses = [...courses].sort(byStudents).slice(0, 8);
export const latestCourses = [...courses].sort(byNewest).slice(0, 8);

export type TeamMember = { slug: string; name: string; role: string; image: string };

/* Everyone on the About page: the founder, every instructor, and student support. */
export const team: TeamMember[] = [
  { slug: "andre-wallace", name: "Andre Wallace", role: "Founder & Lead Instructor", image: "/images/instructors/andre-wallace.jpg" },
  ...instructors.map(({ slug, name, specialty, image }) => ({ slug, name, role: specialty, image })),
  { slug: "chloe-bennett", name: "Chloe Bennett", role: "Student Success Lead", image: "/images/instructors/chloe-bennett.jpg" },
];

export const courseCount = courses.length;

const post = (
  p: Omit<Post, "image" | "author" | "category" | "excerpt" | "readMinutes"> & {
    author: string;
    category: PostCategory["slug"];
  },
): Post => ({
  ...p,
  excerpt: articles[p.slug].excerpt,
  readMinutes: readingMinutes(articles[p.slug]),
  image: `/images/blog/${p.slug}.jpg`,
  author: instructorBySlug(p.author),
  category: postCategories.find((c) => c.slug === p.category)!,
});

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

/* Newest first. */
export const posts: Post[] = [
  post({
    slug: "how-to-beatmatch-by-ear",
    title: "How to Beatmatch by Ear: A Beginner's Guide",
    category: "mixing-techniques",
    author: "marcus-reid",
    publishedAt: "2026-09-24",
  }),
  post({
    slug: "serato-vs-rekordbox",
    title: "Serato vs rekordbox: Which Should You Learn First?",
    category: "gear-software",
    author: "mei-tanaka",
    publishedAt: "2026-09-19",
  }),
  post({
    slug: "amapiano-transitions",
    title: "10 Amapiano Transitions That Always Pack the Dance Floor",
    category: "mixing-techniques",
    author: "daniel-mensah",
    publishedAt: "2026-09-15",
  }),
  post({
    slug: "land-your-first-club-booking",
    title: "Land Your First Club Booking Without a Big Following",
    category: "gigs-career",
    author: "amara-okafor",
    publishedAt: "2026-09-11",
  }),
  post({
    slug: "eq-mixing-101",
    title: "EQ Mixing 101: Stop Your Transitions Sounding Muddy",
    category: "mixing-techniques",
    author: "leo-moreno",
    publishedAt: "2026-09-08",
  }),
  post({
    slug: "home-dj-studio-on-a-budget",
    title: "How to Build a Home DJ Studio on a Budget",
    category: "gear-software",
    author: "sofia-martins",
    publishedAt: "2026-09-04",
  }),
  post({
    slug: "practice-in-20-minutes-a-day",
    title: "How to Practice DJing in Just 20 Minutes a Day",
    category: "practice-wellbeing",
    author: "marcus-reid",
    publishedAt: "2026-08-31",
  }),
  post({
    slug: "make-your-first-edit-in-ableton",
    title: "Make Your First DJ Edit in Ableton Live",
    category: "music-production",
    author: "sofia-martins",
    publishedAt: "2026-08-27",
  }),
  post({
    slug: "how-amapiano-went-global",
    title: "How Amapiano Went From South Africa to the World",
    category: "genres-culture",
    author: "daniel-mensah",
    publishedAt: "2026-08-22",
  }),
  post({
    slug: "dj-press-kit",
    title: "Build a DJ Press Kit Promoters Actually Read",
    category: "gigs-career",
    author: "amara-okafor",
    publishedAt: "2026-08-18",
  }),
  post({
    slug: "harmonic-mixing-camelot-wheel",
    title: "The Camelot Wheel: Harmonic Mixing in 5 Minutes",
    category: "mixing-techniques",
    author: "leo-moreno",
    publishedAt: "2026-08-14",
  }),
  post({
    slug: "choosing-your-first-dj-controller",
    title: "What to Look for in Your First DJ Controller",
    category: "gear-software",
    author: "mei-tanaka",
    publishedAt: "2026-08-10",
  }),
  post({
    slug: "wedding-dj-checklist",
    title: "Wedding DJ Checklist: 12 Things to Confirm First",
    category: "gigs-career",
    author: "amara-okafor",
    publishedAt: "2026-08-05",
  }),
  post({
    slug: "crate-digging",
    title: "Crate Digging: Where Working DJs Find Fresh Music",
    category: "genres-culture",
    author: "marcus-reid",
    publishedAt: "2026-07-31",
  }),
  post({
    slug: "dj-friendly-intros-and-outros",
    title: "Make DJ-Friendly Intros and Outros for Your Tracks",
    category: "music-production",
    author: "sofia-martins",
    publishedAt: "2026-07-27",
  }),
  post({
    slug: "protect-your-hearing",
    title: "Protect Your Ears: Hearing Safety Every DJ Should Know",
    category: "practice-wellbeing",
    author: "leo-moreno",
    publishedAt: "2026-07-22",
  }),
];
