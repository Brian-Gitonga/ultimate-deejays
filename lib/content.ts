import type { CategorySlug, Level, SubcategorySlug } from "./course-taxonomy";
import type { Plan } from "./plans";
import type { PostCategory } from "./post-categories";

/*
 * The shapes the public site renders. The content itself lives in the
 * database (courses, blog_posts, challenges, instructors) and is read through
 * lib/db; the studio edits it. supabase/migrations/…_seed_content.sql holds
 * the original sample content.
 */

export type Instructor = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  /** One or two sentences: shown in list view, search and structured data */
  summary: string;
  image: string;
  level: Level;
  category: CategorySlug;
  subcategory?: SubcategorySlug;
  /** The cheapest plan that includes this course */
  access: Plan["slug"];
  instructor: Instructor;
  students: number;
  durationMinutes: number;
  rating: number;
  reviews: number;
  publishedAt: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  image: string;
  author: Instructor;
  readMinutes: number;
  publishedAt: string;
};

/** A post with its Markdown body, for the article page. */
export type PostDetail = Post & { body: string; keywords: string[] };

export type TeamMember = { slug: string; name: string; role: string; image: string };

/* People on the About page who aren't instructors (instructors come from the database). */
export const founder: TeamMember = { slug: "andre-wallace", name: "Andre Wallace", role: "Founder & Lead Instructor", image: "/images/instructors/andre-wallace.jpg" };
export const supportLead: TeamMember = { slug: "chloe-bennett", name: "Chloe Bennett", role: "Student Success Lead", image: "/images/instructors/chloe-bennett.jpg" };
