/*
 * Pricing plans: Warm-Up is free, Resident and Headliner are paid monthly
 * (each payment gives 30 days), Lifetime is paid once (lib/plan-tiers.ts).
 * These are the defaults: names, prices and highlights saved in Studio →
 * Settings → Pricing override them on the pricing page and at checkout.
 * A plan priced 0 (other than Warm-Up) isn't for sale and isn't shown.
 */

import type { PlanSlug } from "./plan-tiers";

export type Plan = {
  slug: PlanSlug;
  name: string;
  tagline: string;
  /** In the store currency (Studio → Settings → Currency): a month for Resident and Headliner, once for Lifetime; 0 = free (Warm-Up) or not for sale */
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
  {
    slug: "lifetime",
    name: "Lifetime",
    tagline: "Everything in Headliner, paid once and yours for good.",
    // Not for sale until a price is set in Studio → Settings → Pricing.
    price: 0,
    cta: "Get Lifetime",
    href: "/checkout?plan=lifetime",
    highlights: ["Everything in Headliner", "One payment: nothing to renew", "Every future course and template included"],
  },
];

type Cell = boolean | string;
/** One value per plan, in the order of `plans` (Warm-Up, Resident, Headliner, Lifetime). */
export const comparison: { group: string; rows: { label: string; values: [Cell, Cell, Cell, Cell] }[] }[] = [
  {
    group: "Billing",
    rows: [
      { label: "How you pay", values: ["Free", "Monthly", "Monthly", "Once"] },
      { label: "Ends if you stop paying", values: [false, "After 30 days", "After 30 days", false] },
    ],
  },
  {
    group: "Learning",
    rows: [
      { label: "DJ Fundamentals course", values: [true, true, true, true] },
      { label: "Beginner & Intermediate courses", values: ["Free lessons", true, true, true] },
      { label: "Advanced courses", values: [false, false, true, true] },
      { label: "Future courses", values: [false, "Beginner & Intermediate", true, true] },
      { label: "Practice tracks, stems & cue sheets", values: [false, true, true, true] },
      { label: "Certificates of completion", values: [false, true, true, true] },
    ],
  },
  {
    group: "Feedback & coaching",
    rows: [
      { label: "Mix feedback from instructors", values: [false, "2 recordings", "Unlimited", "Unlimited"] },
      { label: "Monthly live Q&A", values: [false, false, true, true] },
      { label: "Press-kit & booking review", values: [false, false, true, true] },
    ],
  },
  {
    group: "Community",
    rows: [
      { label: "Community access", values: [true, true, true, true] },
      { label: "Progress tracking & notes", values: [true, true, true, true] },
    ],
  },
];
