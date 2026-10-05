/*
 * Pricing plans. One-time payments: pay once, keep access for life.
 * These are the defaults: names, prices and highlights saved in Studio →
 * Settings → Pricing override them on the pricing page and at checkout.
 */

export type Plan = {
  slug: "warm-up" | "resident" | "headliner";
  name: string;
  tagline: string;
  /** One-time price in the store currency (Studio → Settings → Currency); 0 = free */
  price: number;
  cta: string;
  href: string;
  featured?: boolean;
  highlights: string[];
};

export const plans: Plan[] = [
  {
    slug: "warm-up",
    name: "Warm-Up",
    tagline: "Get your hands on the decks and find your sound.",
    price: 0,
    cta: "Start free",
    href: "/sign-up",
    highlights: [
      "DJ Fundamentals course",
      "Free lessons from every category",
      "Enter beginner challenges",
      "Community access",
      "Progress tracking & lesson notes",
    ],
  },
  {
    slug: "resident",
    name: "Resident",
    tagline: "Everything you need to play your first real gigs.",
    price: 10000,
    cta: "Become a Resident",
    // Signed out: /checkout sends them to sign up first, then back here.
    href: "/checkout?plan=resident",
    featured: true,
    highlights: [
      "Everything in Warm-Up",
      "All Beginner & Intermediate courses",
      "Practice tracks, stems & cue sheets",
      "Enter every challenge",
      "Certificates of completion",
      "Mix feedback on 2 recordings",
    ],
  },
  {
    slug: "headliner",
    name: "Headliner",
    tagline: "The full library and direct coaching from working DJs.",
    price: 19000,
    cta: "Go Headliner",
    href: "/checkout?plan=headliner",
    highlights: [
      "Everything in Resident",
      "Every course, including Advanced",
      "All future courses included",
      "Unlimited mix feedback",
      "Monthly live Q&A with instructors",
      "Press-kit & booking review",
    ],
  },
];

type Cell = boolean | string;
export const comparison: { group: string; rows: { label: string; values: [Cell, Cell, Cell] }[] }[] = [
  {
    group: "Learning",
    rows: [
      { label: "DJ Fundamentals course", values: [true, true, true] },
      { label: "Beginner & Intermediate courses", values: ["Free lessons", true, true] },
      { label: "Advanced courses", values: [false, false, true] },
      { label: "Future courses", values: [false, "Beginner & Intermediate", true] },
      { label: "Practice tracks, stems & cue sheets", values: [false, true, true] },
      { label: "Certificates of completion", values: [false, true, true] },
    ],
  },
  {
    group: "Feedback & coaching",
    rows: [
      { label: "Mix feedback from instructors", values: [false, "2 recordings", "Unlimited"] },
      { label: "Monthly live Q&A", values: [false, false, true] },
      { label: "Press-kit & booking review", values: [false, false, true] },
    ],
  },
  {
    group: "Community",
    rows: [
      { label: "Challenges", values: ["Beginner", "All", "All"] },
      { label: "Community access", values: [true, true, true] },
      { label: "Progress tracking & notes", values: [true, true, true] },
    ],
  },
];
