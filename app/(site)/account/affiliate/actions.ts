"use server";

import { revalidatePath } from "next/cache";
import { affiliateChannels } from "@/lib/affiliate-program";
import type { AuthField, AuthFormState } from "@/lib/auth";
import { getViewer } from "@/lib/dal";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/* Sends the signed-in user's affiliate application. An admin approves it (see supabase/scripts/set-affiliate-status.sql). */
export async function applyForAffiliate(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const channel = field(formData, "channel");
  const channelUrl = field(formData, "channelUrl");
  const audienceRaw = field(formData, "audience").replace(/[,\s]/g, "");
  const pitch = field(formData, "pitch").replace(/\s+\n/g, "\n");
  const values = { channel, channelUrl, audience: audienceRaw, pitch };

  const viewer = await getViewer();
  if (!viewer) return { status: "error", message: "Your session has ended. Log in again to apply.", values };
  if (viewer.role === "admin") return { status: "error", message: "Admins can't join the affiliate program.", values };
  if (viewer.affiliate) return { status: "notice", message: "You've already applied. Your status is shown above.", values };

  const fieldErrors: Partial<Record<AuthField, string>> = {};
  if (!affiliateChannels.includes(channel)) fieldErrors.channel = "Choose where you'll promote us.";
  if (!channelUrl) fieldErrors.channelUrl = "Paste a link to your channel, profile or site.";
  else if (!/^https?:\/\/\S+\.\S+$/.test(channelUrl) || channelUrl.length > 300) fieldErrors.channelUrl = "Enter a full link, starting with https://.";
  const audience = audienceRaw ? Number(audienceRaw) : 0;
  if (!Number.isInteger(audience) || audience < 0 || audience > 1_000_000_000) fieldErrors.audience = "Enter a whole number, like 12000.";
  if (pitch.length < 20) fieldErrors.pitch = "Tell us a little more: at least 20 characters.";
  else if (pitch.length > 600) fieldErrors.pitch = "Keep it to 600 characters.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("affiliate_applications")
    .insert({ user_id: viewer.id, channel, channel_url: channelUrl, audience, pitch });

  if (error) {
    console.error("[applyForAffiliate] insert failed:", error);
    if (error.code === "23505") return { status: "notice", message: "You've already applied. Your status is shown above.", values };
    // Raised by the database when Studio → Settings → Affiliates has the program switched off.
    if (error.code === "P0001") return { status: "error", message: error.message, values };
    return { status: "error", message: withDetail("We couldn't send your application. Please try again.", error), values };
  }

  revalidatePath("/account", "layout");
  return { status: "notice", message: "Application sent! We'll review it within 2 business days." };
}
