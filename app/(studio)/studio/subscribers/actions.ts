"use server";

import { isUuid, type ActionResult } from "@/lib/action-result";
import { adminAction, must } from "@/lib/studio-action";

export type Subscriber = { id: string; email: string; source: string; member: boolean; subscribedAt: string; unsubscribedAt: string | null };

/** Unsubscribes (keeps the row so they aren't re-added by an import) or re-subscribes. */
export async function saveSubscriber(subscriber: Subscriber): Promise<ActionResult<Subscriber>> {
  return adminAction("update the subscriber", async ({ supabase }) => {
    const unsubscribedAt = subscriber.unsubscribedAt ? new Date().toISOString() : null;
    must(await supabase.from("newsletter_subscribers").update({ unsubscribed_at: unsubscribedAt }).eq("id", subscriber.id));
    return { ...subscriber, unsubscribedAt };
  });
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  return adminAction("delete the subscriber", async ({ supabase }) => {
    if (isUuid(id)) must(await supabase.from("newsletter_subscribers").delete().eq("id", id));
    return null;
  });
}
