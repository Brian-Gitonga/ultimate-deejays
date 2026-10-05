import type { Plan } from "./plans";

/*
 * The affiliate's own view of the program: the shapes the /affiliate pages
 * render, plus the promo files and copy. The numbers are loaded for the
 * signed-in affiliate by lib/db/affiliate-portal.ts.
 */

export type ReferralStatus = "pending" | "approved" | "paid" | "refunded";

export type Referral = {
  id: string;
  date: string;
  /** First name + initial only: affiliates never see full customer details */
  customer: string;
  country: string;
  plan: Plan["slug"];
  kind: "purchase" | "upgrade";
  sale: number;
  commission: number;
  status: ReferralStatus;
  /** Ready to pay out from this date (end of the refund window) */
  clearsOn: string;
  /** The tracking link it came through ("" = main link or code) */
  linkId: string;
  /** They typed your code at checkout (or it was applied from your link) */
  usedCode: boolean;
};

export type TrackedLink = {
  id: string;
  label: string;
  /** Path on the site the link opens */
  path: string;
  sub: string;
  createdAt: string;
  clicks: number;
  sales: number;
  earned: number;
  updatedAt?: string;
};

export type AffiliatePayout = { id: string; period: string; date: string; amount: number; referrals: number; method: string; status: "paid" };

export type MonthStat = { month: string; clicks: number | null; signups: number | null; sales: number | null; earnings: number | null };

/** The signed-in affiliate, with all-time totals. */
export type PortalAffiliate = {
  name: string;
  avatar: string | null;
  code: string;
  commission: number;
  /** % off buyers get with this affiliate's code or link */
  customerDiscount: number;
  approvedAt: string | null;
  clicks: number;
  signups: number;
  sales: number;
};

export type PortalBalance = { pending: number; approved: number; owed: number; lifetime: number; paidOut: number };

export type ProgramTerms = { cookieDays: number; minPayout: number; refundWindow: number; terms: string; currency: string };

export type PromoAsset = {
  id: string;
  kind: "banner" | "social" | "logo" | "photo";
  title: string;
  size: string;
  file: string;
  format: string;
  use: string;
  /** Preview background for transparent logos */
  surface?: "light" | "dark";
};

export type SwipeCopy = { id: string; channel: string; title: string; text: string };

export const promoAssets: PromoAsset[] = [
  { id: "b-leader", kind: "banner", title: "Leaderboard", size: "728 × 90", file: "/affiliate/banners/leaderboard-728x90.svg", format: "SVG", use: "Website header or above a blog post" },
  { id: "b-rect", kind: "banner", title: "Medium rectangle", size: "300 × 250", file: "/affiliate/banners/rectangle-300x250.svg", format: "SVG", use: "Sidebars and in-article spots" },
  { id: "b-sky", kind: "banner", title: "Skyscraper", size: "160 × 600", file: "/affiliate/banners/skyscraper-160x600.svg", format: "SVG", use: "Tall website sidebars" },
  { id: "b-og", kind: "banner", title: "Link preview", size: "1200 × 628", file: "/affiliate/banners/link-preview-1200x628.svg", format: "SVG", use: "Newsletters, Facebook and LinkedIn posts" },
  { id: "s-square", kind: "social", title: "Square post", size: "1080 × 1080", file: "/affiliate/banners/social-square-1080.svg", format: "SVG", use: "Instagram and Facebook feed" },
  { id: "s-story", kind: "social", title: "Story / Reel cover", size: "1080 × 1920", file: "/affiliate/banners/story-1080x1920.svg", format: "SVG", use: "Instagram, TikTok and YouTube Shorts" },
  { id: "l-logo", kind: "logo", title: "Logo", size: "300 × 48", file: "/affiliate/logos/logo.svg", format: "SVG", use: "On light backgrounds", surface: "light" },
  { id: "l-white", kind: "logo", title: "Logo, white", size: "300 × 48", file: "/affiliate/logos/logo-white.svg", format: "SVG", use: "On dark backgrounds and photos", surface: "dark" },
  { id: "l-mark", kind: "logo", title: "Record mark", size: "512 × 512", file: "/affiliate/logos/mark.svg", format: "SVG", use: "Avatars and small spaces", surface: "light" },
  { id: "p-hero", kind: "photo", title: "DJ at the decks", size: "Landscape", file: "/images/hero-dj.webp", format: "WEBP", use: "Hero images and thumbnails" },
  { id: "p-fund", kind: "photo", title: "DJ Fundamentals", size: "Course cover", file: "/images/courses/dj-fundamentals.jpg", format: "JPG", use: "Promote the free starter course" },
  { id: "p-scratch", kind: "photo", title: "Scratch School", size: "Course cover", file: "/images/courses/scratch-school.jpg", format: "JPG", use: "Turntablism audiences" },
  { id: "p-amapiano", kind: "photo", title: "Afrobeats & Amapiano Mixing", size: "Course cover", file: "/images/courses/afrobeats-amapiano-mixing.jpg", format: "JPG", use: "Afro house and amapiano audiences" },
  { id: "p-club", kind: "photo", title: "Your First Club Gig", size: "Course cover", file: "/images/courses/first-club-gig.jpg", format: "JPG", use: "DJs ready to play out" },
];

/** {link} and {code} are replaced with the affiliate's own link and code. */
export const swipeCopy: SwipeCopy[] = [
  {
    id: "c-ig",
    channel: "Instagram / TikTok caption",
    title: "Short and punchy",
    text: "Learned to beatmatch in a week with @ultimatedeejays 🎧 Start free, pay once if you want the full library, no subscription. Link in bio or use code {code}.",
  },
  {
    id: "c-yt",
    channel: "YouTube description",
    title: "Under your tutorial",
    text: "Want the step-by-step version of this? Ultimate Deejays has full courses on mixing, EQ, scratching and playing your first gig, taught by working DJs. Start free here: {link}",
  },
  {
    id: "c-email",
    channel: "Email / newsletter",
    title: "For your mailing list",
    text: "Subject: The course I wish I had when I started DJing\n\nHey,\n\nA lot of you ask me where to learn the basics properly. Ultimate Deejays is what I recommend: short video lessons, practice tracks and real feedback on your mixes. The first course is free, and the paid plans are a one-time payment.\n\nHave a look: {link}\n\nSee you on the dancefloor,",
  },
  {
    id: "c-x",
    channel: "X / Threads",
    title: "One-liner",
    text: "If you've been meaning to learn to DJ, this is the push. Free starter course, no subscription: {link}",
  },
];

export const brandColors = [
  { name: "Brand green", hex: "#00A76F" },
  { name: "Deep green", hex: "#007867" },
  { name: "Night", hex: "#0A0F0D" },
  { name: "Spotlight yellow", hex: "#F8C525" },
  { name: "White", hex: "#FFFFFF" },
];

/** Pages a tracking link can open. The links page adds every published course after these. */
export const linkDestinations = [
  { path: "/", label: "Home page" },
  { path: "/pricing", label: "Pricing" },
  { path: "/courses", label: "All courses" },
  { path: "/challenges", label: "Challenges" },
  { path: "/blog", label: "Blog" },
];
