import "server-only";
import { cache } from "react";
import { defaultSettings, mergeSettings, type SiteSettings } from "@/lib/site-settings";
import { contentClient } from "./content-client";

/*
 * Studio → Settings, for the site (pricing page, blog, affiliate program).
 * Falls back to the defaults if the row is missing or a section is incomplete,
 * so a half-saved setting can never break a page.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const { data, error } = await contentClient("settings").from("site_settings").select("data, updated_at").eq("id", "site").maybeSingle();
  if (error) console.error("[getSiteSettings]", error.message);
  if (!data) return defaultSettings;
  return mergeSettings(data.data, data.updated_at);
});
