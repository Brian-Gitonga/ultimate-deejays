import { plans, type Plan } from "./plans";

/*
 * Site-wide settings edited in Studio → Settings, stored in site_settings (one
 * row). The pricing page, checkout, blog and affiliate program read them.
 * Defaults fill in anything missing.
 */

export type PlanSettings = Pick<Plan, "slug" | "name" | "tagline" | "price" | "cta" | "highlights"> & { featured: boolean };

export type SiteSettings = {
  id: "site";
  general: {
    siteName: string;
    tagline: string;
    supportEmail: string;
    /** Also the WhatsApp number */
    phone: string;
    address: string;
    /** Students shown on the home page, About page and sign-up (a number you keep up to date) */
    studentCount: number;
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
  affiliates: {
    enabled: boolean;
    defaultCommission: number;
    /** % off for buyers who use an affiliate's code or link (each affiliate can have their own) */
    customerDiscount: number;
    /** How long after clicking a link a purchase still earns commission */
    cookieDays: number;
    minPayout: number;
    autoApprove: boolean;
    terms: string;
  };
  notifications: { email: string; newSale: boolean; refund: boolean; newStudent: boolean; affiliateApplication: boolean; payoutSent: boolean; weeklyReport: boolean };
  updatedAt: string;
};

export const defaultSettings: SiteSettings = {
  id: "site",
  general: {
    siteName: "Ultimate Deejays",
    tagline: "Learn to DJ online, from your first mix to your first booking.",
    supportEmail: "hello@ultimatedeejays.com",
    phone: "+254 114 669 532",
    address: "Wangige, Kiambu County",
    studentCount: 90,
    currency: "KES",
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
    postsPerPage: 12,
    defaultCategory: "mixing-techniques",
    featuredPost: "",
    homeLatest: 6,
    showAuthorBox: true,
    showRelated: true,
    showNewsletter: true,
    showReadingProgress: true,
    showShare: true,
  },
  payments: { card: true, paypal: true, schedule: "monthly", minimum: 10000, destination: "Bank •••• 4821", refundWindow: 30 },
  affiliates: {
    enabled: true,
    defaultCommission: 20,
    customerDiscount: 10,
    cookieDays: 30,
    minPayout: 5000,
    autoApprove: false,
    terms: "Promote Ultimate Deejays honestly. No paid ads on our brand name, no coupon sites and no spam. Commission is paid monthly on sales that aren't refunded.",
  },
  notifications: { email: "hello@ultimatedeejays.com", newSale: true, refund: true, newStudent: false, affiliateApplication: true, payoutSent: true, weeklyReport: true },
  updatedAt: "2026-09-01T00:00:00.000Z",
};

type Sections = Omit<SiteSettings, "id" | "updatedAt">;
const sectionKeys = ["general", "plans", "pricing", "blog", "payments", "affiliates", "notifications"] as const satisfies readonly (keyof Sections)[];

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Saved settings (the site_settings.data JSON) laid over the defaults, one
 * section at a time, so a missing key falls back instead of breaking a page.
 */
export function mergeSettings(saved: unknown, updatedAt: string): SiteSettings {
  const data = isObject(saved) ? saved : {};
  const merged = { ...defaultSettings, updatedAt } as SiteSettings;
  for (const key of sectionKeys) {
    const value = data[key];
    if (key === "plans") {
      if (Array.isArray(value) && value.length) {
        merged.plans = defaultSettings.plans.map((plan) => ({ ...plan, ...(value.find((p) => isObject(p) && p.slug === plan.slug) ?? {}) }));
      }
    } else if (isObject(value)) {
      (merged as Record<string, unknown>)[key] = { ...(defaultSettings[key] as object), ...value };
    }
  }
  merged.general.socials = { ...defaultSettings.general.socials, ...(isObject(merged.general.socials) ? merged.general.socials : {}) };
  return merged;
}

/** The JSON stored in site_settings.data: everything except id and updatedAt. */
export function settingsData(settings: SiteSettings): Sections {
  const { id: _id, updatedAt: _updatedAt, ...data } = settings;
  void _id;
  void _updatedAt;
  return data;
}
