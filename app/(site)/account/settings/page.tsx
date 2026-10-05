import type { Metadata } from "next";
import type { EmailPrefs } from "@/app/(site)/account/actions";
import { AccountSettings } from "@/components/account-settings";
import { requireViewer } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

const defaults: EmailPrefs = { "new-courses": true, challenges: true, feedback: true, newsletter: false };

export default async function SettingsPage() {
  const viewer = await requireViewer("/account/settings");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("email_prefs").eq("id", viewer.id).single();
  const saved = data?.email_prefs && typeof data.email_prefs === "object" && !Array.isArray(data.email_prefs) ? data.email_prefs : {};
  const prefs = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof saved[key] === "boolean" ? saved[key] : value])) as EmailPrefs;
  return <AccountSettings email={viewer.email} prefs={prefs} canDelete={viewer.role !== "admin"} />;
}
