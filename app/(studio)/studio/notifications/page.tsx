import type { Metadata } from "next";
import { NotificationFeed } from "@/components/studio/notification-feed";
import { StudioPageHeader } from "@/components/studio/ui";
import { requireAdmin } from "@/lib/dal";
import { getActivity, getLastReadAt, getUnreadCount } from "@/lib/db/studio/activity";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Notifications" };

export default async function StudioNotificationsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [items, lastReadAt, unread] = await Promise.all([getActivity(150, supabase), getLastReadAt(admin.id, supabase), getUnreadCount(admin.id, supabase)]);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <StudioPageHeader title="Notifications" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Notifications" }]} />
        <NotificationFeed items={items} lastReadAt={lastReadAt} unread={unread} />
      </div>
    </main>
  );
}
