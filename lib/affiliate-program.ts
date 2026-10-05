import type { SiteSettings } from "./site-settings";

/* The affiliate program as members see it on /account/affiliate. Terms come from Studio → Settings → Affiliates. */

export const affiliateChannels = ["YouTube", "TikTok", "Instagram", "Podcast", "Blog or website", "Other"];

export const programTerms = (settings: SiteSettings) => ({
  open: settings.affiliates.enabled,
  commission: settings.affiliates.defaultCommission,
  cookieDays: settings.affiliates.cookieDays,
  minPayout: settings.affiliates.minPayout,
  rules: settings.affiliates.terms,
});
