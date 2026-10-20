"use server";

import { z } from "zod";
import { isUuid, type ActionResult } from "@/lib/action-result";
import { getStudioEditRequest } from "@/lib/db/studio/edits";
import type { EditStatus, StudioEditRequest } from "@/lib/edits";
import { adminAction, must, StudioError } from "@/lib/studio-action";

/*
 * Studio → Edit requests. One action for every step: start working, ask
 * the member a question, deliver the files, decline, reopen, or just save a
 * note. Nothing is texted automatically: the team messages the member
 * themselves (WhatsApp or SMS buttons in the request drawer).
 */

const fileSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1, "Every file needs a name.").max(200),
    kind: z.enum(["storage", "link"]),
    path: z.string().max(500),
    url: z.string().trim().max(1000),
    size: z.number().int().min(0).max(1e12),
    mime: z.string().max(120),
  })
  .refine((f) => (f.kind === "storage" ? f.path.startsWith("delivered/") : /^https?:\/\//.test(f.url)), "Links must start with https://.");

const schema = z.object({
  status: z.enum(["submitted", "in_progress", "needs_info", "delivered", "declined", "cancelled"]).optional(),
  message: z.string().trim().max(2000, "Keep the message under 2,000 characters.").optional(),
  files: z.array(fileSchema).max(50, "Up to 50 files per delivery.").optional(),
  adminNotes: z.string().max(2000, "Keep the notes under 2,000 characters.").optional(),
});

export type EditUpdate = z.input<typeof schema>;

export async function updateEditRequest(id: string, update: EditUpdate): Promise<ActionResult<StudioEditRequest>> {
  return adminAction("update the request", async ({ supabase }) => {
    if (!isUuid(id)) throw new StudioError("That request doesn't exist.");
    const parsed = schema.safeParse(update);
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    const { status, message, files, adminNotes } = parsed.data;

    const before = await getStudioEditRequest(id, supabase);
    if (!before) throw new StudioError("That request doesn't exist any more. Refresh the page.");
    if (status === "needs_info" && !message) throw new StudioError("Write your question for the member.");
    if (status === "declined" && !message) throw new StudioError("Tell the member why you're declining it.");
    if (status === "delivered" && !(files ?? before.files).length) throw new StudioError("Add the edited files before you deliver.");

    if (message) must(await supabase.from("edit_request_messages").insert({ request_id: id, author: "team", body: message }).select("id"));

    const patch: { status?: EditStatus; files?: typeof files; admin_notes?: string; delivered_at?: string } = {};
    if (status && status !== before.status) patch.status = status;
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (files) patch.files = files;
    if (adminNotes !== undefined && adminNotes !== before.adminNotes) patch.admin_notes = adminNotes;
    if (Object.keys(patch).length) must(await supabase.from("edit_requests").update(patch).eq("id", id).select("id"));

    // Files taken out of the delivery are deleted from the bucket.
    if (files) {
      const kept = new Set(files.map((f) => f.path));
      const removed = before.files.filter((f) => f.kind === "storage" && f.path && !kept.has(f.path)).map((f) => f.path);
      if (removed.length) {
        const { error } = await supabase.storage.from("edits").remove(removed);
        if (error) console.error("[updateEditRequest] removing files", error.message);
      }
    }

    const after = await getStudioEditRequest(id, supabase);
    if (!after) throw new StudioError("The request disappeared while saving. Refresh the page.");
    return after;
  });
}
