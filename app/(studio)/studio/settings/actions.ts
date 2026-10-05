"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { mergeSettings, settingsData, type SiteSettings } from "@/lib/site-settings";
import { adminAction, must, StudioError } from "@/lib/studio-action";
import type { Json } from "@/lib/supabase/database.types";

const email = z.string().trim().email("Enter a valid email address.");

// The rules the database can't check inside the JSON: the same ones the form shows.
const schema = z.object({
  general: z.object({ siteName: z.string().trim().min(1, "Enter the site name.").max(80), supportEmail: email, studentCount: z.number().int("Use a whole number of students.").min(0, "Students can't be negative.").max(10_000_000), currency: z.enum(["USD", "EUR", "GBP", "KES", "NGN", "ZAR"]) }).passthrough(),
  plans: z
    .array(
      z.object({
        slug: z.enum(["warm-up", "resident", "headliner"]),
        name: z.string().trim().min(1, "Give every plan a name.").max(40),
        price: z.number().min(0, "Prices can't be negative.").max(100000),
        cta: z.string().trim().min(1, "Add the button text for every plan.").max(40),
        highlights: z.array(z.string().max(120)).max(20),
      }).passthrough(),
    )
    .length(3),
  pricing: z.object({ heading: z.string().trim().min(1, "Add a pricing headline.").max(120), guaranteeDays: z.number().int().min(0).max(365) }).passthrough(),
  blog: z.object({ postsPerPage: z.number().int().min(3).max(60), homeLatest: z.number().int().min(0).max(12) }).passthrough(),
  payments: z.object({ minimum: z.number().min(0), refundWindow: z.number().int().min(0).max(365) }).passthrough(),
  affiliates: z
    .object({
      defaultCommission: z.number().int().min(1, "Commission must be 1–90%.").max(90, "Commission must be 1–90%."),
      customerDiscount: z.number().int().min(0, "Buyer discount must be 0–90%.").max(90, "Buyer discount must be 0–90%."),
      cookieDays: z.number().int().min(1, "Cookie length must be 1–90 days.").max(90, "Cookie length must be 1–90 days."),
      minPayout: z.number().min(0),
      terms: z.string().max(2000),
    })
    .passthrough(),
  notifications: z.object({ email }).passthrough(),
});

/** Saves Studio → Settings. The pricing page, blog and affiliate program pick it up straight away. */
export async function saveSettings(settings: SiteSettings): Promise<ActionResult<SiteSettings>> {
  return adminAction(
    "save the settings",
    async ({ supabase }) => {
      const parsed = schema.safeParse(settings);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const row = must(
        await supabase
          .from("site_settings")
          .upsert({ id: "site", data: settingsData(settings) as unknown as Json })
          .select("data, updated_at")
          .single(),
      );
      return mergeSettings(row.data, row.updated_at);
    },
    { tags: [CONTENT_TAGS.settings] },
  );
}
