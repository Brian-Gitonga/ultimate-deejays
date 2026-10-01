import { balanceOf, type Affiliate } from "./affiliates";
import { getAffiliateAccounts, getTransactions } from "./earnings";
import type { Plan } from "./plans";
import { defaultSettings } from "./site-settings";

/*
 * The affiliate's own view of the program. PLACEHOLDER: the signed-in
 * affiliate is fixed to Kaya Mensah; with auth, look the affiliate up from the
 * session. Sales come from the same sample payments the studio sees, so both
 * dashboards always agree.
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
  linkId: string;
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;
const round = (n: number) => Math.round(n * 100) / 100;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const SIGNED_IN_AFFILIATE = "DJKAYA";

const linkSeed: Omit<TrackedLink, "clicks" | "sales" | "earned">[] = [
  { id: "lnk-yt", label: "YouTube video descriptions", path: "/", sub: "youtube", createdAt: "2026-03-05" },
  { id: "lnk-bio", label: "Instagram bio", path: "/pricing", sub: "instagram-bio", createdAt: "2026-03-05" },
  { id: "lnk-beatmatch", label: "Beatmatching tutorial", path: "/courses/dj-fundamentals", sub: "beatmatch-video", createdAt: "2026-05-18" },
  { id: "lnk-news", label: "Monthly newsletter", path: "/", sub: "newsletter", createdAt: "2026-07-01" },
];
// Share of clicks each link brings in (adds up to 1).
const linkShare = [0.46, 0.27, 0.19, 0.08];

export function getAffiliatePortal(today: string) {
  const affiliate: Affiliate = getAffiliateAccounts().find((a) => a.code === SIGNED_IN_AFFILIATE)!;
  const window = defaultSettings.payments.refundWindow;
  const sales = getTransactions()
    .filter((t) => t.affiliate === affiliate.code)
    .sort((a, b) => b.date.localeCompare(a.date));

  const referrals: Referral[] = sales.map((t, i) => {
    const clearsOn = iso(Date.parse(t.date) + window * DAY);
    const [first, last = ""] = t.customer.split(" ");
    const status: ReferralStatus = t.status === "refunded" ? "refunded" : t.date < "2026-09-01" ? "paid" : clearsOn <= today ? "approved" : "pending";
    return {
      id: `ref_${t.id.slice(4).toLowerCase()}`,
      date: t.date,
      customer: `${first} ${last.charAt(0)}.`,
      country: t.country,
      plan: t.plan,
      kind: t.kind,
      sale: t.amount,
      commission: t.status === "refunded" ? 0 : t.commission,
      status,
      clearsOn,
      // Spread sales across links roughly in line with their clicks.
      linkId: linkSeed[[0, 1, 0, 2, 1, 0, 3, 2, 0, 1][i % 10]].id,
    };
  });

  // Clicks and sign-ups grow month by month after approval; totals match the studio's numbers.
  const startMonth = Number(affiliate.approvedAt!.slice(5, 7)) - 1;
  const lastMonth = 8; // September: the latest month with data
  const weights = MONTHS.map((_, m) => (m < startMonth || m > lastMonth ? 0 : 1 + (m - startMonth) * 0.35));
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const share = (total: number, m: number) => Math.round((total * weights[m]) / weightSum);

  const monthly: MonthStat[] = MONTHS.map((month, m) => {
    if (m < startMonth || m > lastMonth) return { month, clicks: null, signups: null, sales: null, earnings: null };
    const rows = referrals.filter((r) => Number(r.date.slice(5, 7)) === m + 1 && r.status !== "refunded");
    return {
      month,
      clicks: share(affiliate.clicks, m),
      signups: share(affiliate.signups, m),
      sales: rows.length,
      earnings: round(rows.reduce((s, r) => s + r.commission, 0)),
    };
  });

  const links: TrackedLink[] = linkSeed.map((l, i) => {
    const rows = referrals.filter((r) => r.linkId === l.id && r.status !== "refunded");
    return { ...l, clicks: Math.round(affiliate.clicks * linkShare[i]), sales: rows.length, earned: round(rows.reduce((s, r) => s + r.commission, 0)), updatedAt: `${l.createdAt}T00:00:00.000Z` };
  });

  // Each month's cleared commission is paid on the last day of the following month.
  const payouts: AffiliatePayout[] = MONTHS.slice(startMonth, lastMonth)
    .map((label, k) => {
      const m = startMonth + k;
      const rows = referrals.filter((r) => r.status === "paid" && Number(r.date.slice(5, 7)) === m + 1);
      return {
        id: `AP-${2041 + m}`,
        period: `${label} 2026`,
        date: iso(Date.UTC(2026, m + 2, 0)),
        amount: round(rows.reduce((s, r) => s + r.commission, 0)),
        referrals: rows.length,
        method: "PayPal · kaya@djkaya.com",
        status: "paid" as const,
      };
    })
    .filter((p) => p.amount > 0)
    .reverse();

  const pending = round(referrals.filter((r) => r.status === "pending").reduce((s, r) => s + r.commission, 0));
  const approved = round(referrals.filter((r) => r.status === "approved").reduce((s, r) => s + r.commission, 0));

  return {
    affiliate,
    referrals,
    monthly,
    links,
    payouts,
    balance: { pending, approved, owed: balanceOf(affiliate), lifetime: affiliate.earned, paidOut: affiliate.paidOut },
    program: {
      cookieDays: defaultSettings.affiliates.cookieDays,
      minPayout: defaultSettings.affiliates.minPayout,
      refundWindow: window,
      terms: defaultSettings.affiliates.terms,
    },
  };
}

export type AffiliatePortal = ReturnType<typeof getAffiliatePortal>;

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

export const linkDestinations = [
  { path: "/", label: "Home page" },
  { path: "/pricing", label: "Pricing" },
  { path: "/courses", label: "All courses" },
  { path: "/courses/dj-fundamentals", label: "Course: DJ Fundamentals (free)" },
  { path: "/courses/scratch-school", label: "Course: Scratch School" },
  { path: "/courses/afrobeats-amapiano-mixing", label: "Course: Afrobeats & Amapiano Mixing" },
  { path: "/challenges", label: "Challenges" },
  { path: "/blog", label: "Blog" },
];
