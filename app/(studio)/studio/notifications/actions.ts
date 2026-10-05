"use server";

import type { ActionResult } from "@/lib/action-result";
import { adminAction, must } from "@/lib/studio-action";

/** Marks everything up to now as read: clears the bell's count. */
export async function markNotificationsRead(): Promise<ActionResult> {
  return adminAction("mark notifications as read", async ({ supabase, admin }) => {
    must(await supabase.from("admin_notification_state").upsert({ admin_id: admin.id, last_read_at: new Date().toISOString() }));
    return null;
  });
}
