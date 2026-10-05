import type { Metadata } from "next";
import { SubscriberManager } from "@/components/studio/subscriber-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { createClient } from "@/lib/supabase/server";
import type { Subscriber } from "./actions";

export const metadata: Metadata = { title: "Subscribers" };

export default async function StudioSubscribersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load subscribers: ${error.message}. Run migration 012 (supabase/diagnostics/00_health_check.sql).`);
  const subscribers: Subscriber[] = (data ?? []).map((s) => ({
    id: s.id,
    email: s.email,
    source: s.source,
    member: !!s.user_id,
    subscribedAt: s.created_at,
    unsubscribedAt: s.unsubscribed_at,
  }));
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Subscribers" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Subscribers" }]} />
        <SubscriberManager seed={subscribers} today={new Date().toISOString()} />
      </div>
    </main>
  );
}
