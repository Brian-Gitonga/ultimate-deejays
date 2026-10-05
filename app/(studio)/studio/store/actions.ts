"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { youtubeId } from "@/lib/curriculum";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { getStudioStoreResource } from "@/lib/db/studio/store";
import { storeCategories, type StudioStoreResource } from "@/lib/store";
import { adminAction, must, StudioError } from "@/lib/studio-action";

/*
 * Studio → Store. Files are uploaded straight from the browser to the private
 * store bucket (so big files never pass through this server); saving records
 * the resource and its file list. Files taken out of the list are deleted
 * from the bucket when you save.
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
  .refine((f) => (f.kind === "storage" ? f.path.startsWith("resources/") : /^(https?:\/\/|\/(?!\/))/.test(f.url)), "Links must start with https:// (or / for a file on this site).");

const schema = z.object({
  id: z.uuid(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The URL can only use lowercase letters, numbers and dashes.")
    .max(100),
  title: z.string().trim().min(1, "Give it a title.").max(120, "Keep the title to 120 characters."),
  description: z.string().trim().max(5000, "Keep the description to 5,000 characters."),
  category: z.enum(storeCategories.map((c) => c.slug) as [string, ...string[]]),
  thumbnail: z.string().max(500),
  previewUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || youtubeId(v), "The preview must be a YouTube link."),
  access: z.enum(["warm-up", "resident", "headliner"]),
  instructorId: z.uuid().nullable(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  files: z.array(fileSchema).max(200, "Up to 200 files per resource."),
});

export async function saveStoreResource(resource: StudioStoreResource): Promise<ActionResult<StudioStoreResource>> {
  return adminAction(
    "save the resource",
    async ({ supabase }) => {
      const parsed = schema.safeParse(resource);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const r = parsed.data;
      if (r.status === "published" && !r.files.length) throw new StudioError("Add at least one file before publishing.");

      const values = {
        slug: r.slug,
        title: r.title,
        description: r.description,
        category: r.category,
        thumbnail: r.thumbnail,
        preview_url: r.previewUrl,
        access_plan: r.access,
        instructor_id: r.instructorId,
        status: r.status,
        featured: r.featured,
      };
      const { data: existing } = await supabase.from("store_resources").select("id").eq("id", r.id).maybeSingle();
      const { error } = existing
        ? await supabase.from("store_resources").update(values).eq("id", r.id)
        : await supabase.from("store_resources").insert({ id: r.id, ...values });
      if (error?.code === "23505") throw new StudioError("Another resource already uses that URL. Change it and save again.");
      if (error) throw error;

      // The file list: remove what was taken out, update the rest, add the new ones.
      const current = must(await supabase.rpc("studio_store_files", { target: r.id }));
      const kept = new Set(r.files.map((f) => f.id));
      const removed = current.filter((f) => !kept.has(f.id));
      if (removed.length) {
        must(await supabase.from("store_files").delete().in("id", removed.map((f) => f.id)));
        const paths = removed.filter((f) => f.kind === "storage" && f.path).map((f) => f.path);
        if (paths.length) {
          const { error: storageError } = await supabase.storage.from("store").remove(paths);
          if (storageError) console.error("[saveStoreResource] removing files", storageError.message);
        }
      }

      const known = new Set(current.map((f) => f.id));
      const row = (f: (typeof r.files)[number], position: number) => ({
        name: f.name,
        kind: f.kind,
        path: f.kind === "storage" ? f.path : "",
        url: f.kind === "link" ? f.url : "",
        size_bytes: f.size,
        mime_type: f.mime,
        position,
      });
      const added = r.files.map((f, i) => ({ f, i })).filter(({ f }) => !known.has(f.id));
      if (added.length) must(await supabase.from("store_files").insert(added.map(({ f, i }) => ({ id: f.id, resource_id: r.id, ...row(f, i) }))));
      for (const [i, f] of r.files.entries()) {
        if (known.has(f.id)) must(await supabase.from("store_files").update(row(f, i)).eq("id", f.id));
      }

      const saved = await getStudioStoreResource(r.id, supabase);
      if (!saved) throw new StudioError("The resource disappeared while saving. Refresh and try again.");
      return saved;
    },
    { tags: [CONTENT_TAGS.store] },
  );
}

/** Deletes the resource, its files and their uploads. Download history goes with it. */
export async function deleteStoreResource(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the resource",
    async ({ supabase }) => {
      if (!z.uuid().safeParse(id).success) return null;
      const files = must(await supabase.rpc("studio_store_files", { target: id }));
      must(await supabase.from("store_resources").delete().eq("id", id));
      const paths = files.filter((f) => f.kind === "storage" && f.path).map((f) => f.path);
      if (paths.length) {
        const { error } = await supabase.storage.from("store").remove(paths);
        if (error) console.error("[deleteStoreResource] removing files", error.message);
      }
      return null;
    },
    { tags: [CONTENT_TAGS.store] },
  );
}
