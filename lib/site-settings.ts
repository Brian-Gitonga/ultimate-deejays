import { plans, type Plan } from "./plans";

/*
 * Site-wide settings edited in Studio → Settings. Defaults mirror what the
 * public site shows today. PLACEHOLDER: saved in the browser for now; with a
 * backend, store this one record in the database and have the pricing page,
 * blog and checkout read from it.
 */

export type PlanSettings = Pick<Plan, "slug" | "name" | "tagline" | "price" | "cta" | "highlights"> & { featured: boolean };

export type SiteSettings = {
  id: "site";
  general: {
    siteName: string;
    tagline: string;
    supportEmail: string;
    phone: string;
    address: string;
    currency: "USD" | "EUR" | "GBP" | "KES" | "NGN" | "ZAR";
    socials: { instagram: string; tiktok: string; youtube: string; x: string };
  };
  plans: PlanSettings[];
  pricing: { heading: string; intro: string; guaranteeDays: number; showComparison: boolean; upgradeCredit: boolean };
  blog: {
    heading: string;
    postsPerPage: number;
    defaultCategory: string;
    featuredPost: string;
    homeLatest: number;
    showAuthorBox: boolean;
    showRelated: boolean;
    showNewsletter: boolean;
    showReadingProgress: boolean;
    showShare: boolean;
  };
  payments: { card: boolean; paypal: boolean; schedule: "monthly" | "weekly" | "manual"; minimum: number; destination: string; refundWindow: number };
  affiliates: { enabled: boolean; defaultCommission: number; cookieDays: number; minPayout: number; autoApprove: boolean; terms: string };
  notifications: { email: string; newSale: boolean; refund: boolean; newStudent: boolean; affiliateApplication: boolean; payoutSent: boolean; weeklyReport: boolean };
  updatedAt: string;
};

export const defaultSettings: SiteSettings = {
  id: "site",
  general: {
    siteName: "Ultimate Deejays",
    tagline: "Learn to DJ online, from your first mix to your first booking.",
    supportEmail: "hello@ultimatedeejays.com",
    phone: "+1 (310) 555-0142",
    address: "Studio 7, Soundwave House, Los Angeles, CA",
    currency: "USD",
    socials: {
      instagram: "https://www.instagram.com/ultimatedeejays",
      tiktok: "https://www.tiktok.com/@ultimatedeejays",
      youtube: "https://www.youtube.com/@ultimatedeejays",
      x: "https://x.com/ultimatedeejays",
    },
  },
  plans: plans.map(({ slug, name, tagline, price, cta, featured, highlights }) => ({ slug, name, tagline, price, cta, featured: !!featured, highlights })),
  pricing: {
    heading: "Pay once. Keep mixing forever.",
    intro: "No subscriptions and no monthly fees. Start free, then unlock the courses you need when you're ready to level up.",
    guaranteeDays: 30,
    showComparison: true,
    upgradeCredit: true,
  },
  blog: {
    heading: "Latest posts",
    postsPerPage: 9,
    defaultCategory: "mixing-techniques",
    featuredPost: "",
    homeLatest: 3,
    showAuthorBox: true,
    showRelated: true,
    showNewsletter: true,
    showReadingProgress: true,
    showShare: true,
  },
  payments: { card: true, paypal: true, schedule: "monthly", minimum: 100, destination: "Bank •••• 4821", refundWindow: 30 },
  affiliates: {
    enabled: true,
    defaultCommission: 20,
    cookieDays: 30,
    minPayout: 50,
    autoApprove: false,
    terms: "Promote Ultimate Deejays honestly. No paid ads on our brand name, no coupon sites and no spam. Commission is paid monthly on sales that aren't refunded.",
  },
  notifications: { email: "hello@ultimatedeejays.com", newSale: true, refund: true, newStudent: false, affiliateApplication: true, payoutSent: true, weeklyReport: true },
  updatedAt: "2026-09-01T00:00:00.000Z",
};

/** Stable seed for useCollection("settings", …); the store caches by seed identity. */
export const settingsSeed: SiteSettings[] = [defaultSettings];
