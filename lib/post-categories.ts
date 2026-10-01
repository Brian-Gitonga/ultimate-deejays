/* Kept apart from lib/content so browser code can import it without pulling in the whole catalogue. */
export const postCategories = [
  { slug: "mixing-techniques", name: "Mixing Techniques" },
  { slug: "gear-software", name: "Gear & Software" },
  { slug: "music-production", name: "Music Production" },
  { slug: "genres-culture", name: "Genres & Culture" },
  { slug: "gigs-career", name: "Gigs & Career" },
  { slug: "practice-wellbeing", name: "Practice & Wellbeing" },
] as const;

export type PostCategory = (typeof postCategories)[number];
