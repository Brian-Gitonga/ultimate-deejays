"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isUuid, type ActionResult } from "@/lib/action-result";
import { toSub, type AffiliateAccount } from "@/lib/affiliate-links";
import type { TrackedLink } from "@/lib/affiliate-portal";
import { toAccount } from "@/lib/db/affiliate-portal";
import { requireAffiliate } from "@/lib/dal";
import type { Json } from "@/lib/supabase/database.types";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/*
 * What an approved affiliate can change: their tracking links and their
 * account (payout method, tax details, notifications, code requests). Runs
 * with their session, so RLS keeps every row their own.
 */

const linkSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, "Name the link.").max(40, "Keep the name to 40 characters."),
  path: z
    .string()
    .trim()
    .max(200)
    .regex(/^\/[A-Za-z0-9/_-]*$/, "Pick a page on the site."),
});

export async function saveAffiliateLink(link: TrackedLink): Promise<ActionResult<TrackedLink>> {
  const viewer = await requireAffiliate();
  const parsed = linkSchema.safeParse(link);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { label, path } = parsed.data;
  const sub = toSub(label);
  if (!sub) return { ok: false, error: "Use some letters or numbers in the link name." };

  const supabase = await createClient();
  const { data, error } = isUuid(link.id)
    ? await supabase.from("affiliate_links").update({ label, path }).eq("id", link.id).eq("affiliate_id", viewer.id).select().single()
    : await supabase.from("affiliate_links").insert({ label, path, sub }).select().single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You already have a link with this name." };
    return { ok: false, error: withDetail("We couldn't save the link. Please try again.", error) };
  }
  revalidatePath("/affiliate", "layout");
  return {
    ok: true,
    record: { ...link, id: data.id, label: data.label, path: data.path, sub: data.sub, createdAt: data.created_at.slice(0, 10), updatedAt: data.created_at },
  };
}

export async function deleteAffiliateLink(id: string): Promise<ActionResult> {
  const viewer = await requireAffiliate();
  if (!isUuid(id)) return { ok: true, record: null };
  const supabase = await createClient();
  const { error } = await supabase.from("affiliate_links").delete().eq("id", id).eq("affiliate_id", viewer.id);
  if (error) return { ok: false, error: withDetail("We couldn't delete the link.", error) };
  revalidatePath("/affiliate", "layout");
  return { ok: true, record: null };
}

const email = z.string().trim().max(254);
const accountSchema = z.object({
  website: z.string().trim().max(300).refine((v) => !v || /^https?:\/\//.test(v), "Start the website with https://"),
  channels: z.string().trim().max(1000),
  payoutMethod: z.enum(["paypal", "mpesa", "bank"]),
  paypalEmail: email.refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter the email of your PayPal account."),
  mpesaPhone: z.string().trim().max(30),
  bank: z.object({ holder: z.string().trim().max(120), bankName: z.string().trim().max(120), account: z.string().trim().max(60), swift: z.string().trim().max(20) }),
  tax: z.object({ legalName: z.string().trim().max(120), country: z.string().trim().max(80), taxId: z.string().trim().max(40) }),
  notifications: z.object({ sale: z.boolean(), cleared: z.boolean(), payout: z.boolean(), newAssets: z.boolean(), monthly: z.boolean() }),
  codeRequest: z
    .string()
    .regex(/^[A-Z0-9]{4,14}$/, "Use 4 to 14 letters or numbers.")
    .nullable(),
  leaveRequestedAt: z.string().nullable(),
});

export async function saveAffiliateAccount(account: AffiliateAccount): Promise<ActionResult<AffiliateAccount>> {
  const viewer = await requireAffiliate();
  const parsed = accountSchema.safeParse(account);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const a = parsed.data;
  if (a.payoutMethod === "paypal" && !a.paypalEmail) return { ok: false, error: "Enter the email of your PayPal account." };
  if (a.codeRequest && a.codeRequest === viewer.affiliate.code) return { ok: false, error: "That's already your code." };

  const row = {
    website: a.website,
    channels: a.channels,
    payout_method: a.payoutMethod,
    paypal_email: a.paypalEmail,
    mpesa_phone: a.mpesaPhone,
    bank: a.bank as Json,
    tax: a.tax as Json,
    notifications: a.notifications as Json,
    code_request: a.codeRequest,
    leave_requested_at: a.leaveRequestedAt ? (Number.isNaN(Date.parse(a.leaveRequestedAt)) ? new Date().toISOString() : a.leaveRequestedAt) : null,
  };

  const supabase = await createClient();
  const updated = await supabase.from("affiliate_accounts").update(row).eq("affiliate_id", viewer.id).select();
  let saved = updated.data?.[0] ?? null;
  let error = updated.error;
  if (!error && !saved) {
    const inserted = await supabase.from("affiliate_accounts").insert(row).select().single();
    saved = inserted.data;
    error = inserted.error;
  }
  if (error || !saved) return { ok: false, error: withDetail("We couldn't save your settings. Please try again.", error) };

  const { data: application } = await supabase.from("affiliate_applications").select("channel, channel_url").eq("user_id", viewer.id).single();
  revalidatePath("/affiliate", "layout");
  return { ok: true, record: toAccount(saved, viewer, application ?? { channel: "", channel_url: "" }) };
}
