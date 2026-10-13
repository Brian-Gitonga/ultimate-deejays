"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { youtubeId } from "@/lib/curriculum";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { getStudioStoreResource } from "@/lib/db/studio/store";
import { editFieldTypes, MAX_FIELDS } from "@/lib/edits";
import { isStorePath, pathFor, storageProviders } from "@/lib/storage";
import { availableProviders, removeStored, signedUploadUrl } from "@/lib/storage.server";
import { storagePathFor, storeCategories, type StudioStoreResource } from "@/lib/store";
import { adminAction, must, StudioError } from "@/lib/studio-action";

/*
 * Studio → Store. Files are uploaded straight from the browser to private
 * storage, Cloudflare R2 or Supabase (so big files never pass through this
 * server); saving records the resource and its file list. Files taken out of
 * the list are deleted from their storage when you save.
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
  .refine((f) => (f.kind === "storage" ? isStorePath(f.path) : /^(https?:\/\/|\/(?!\/))/.test(f.url)), "Links must start with https:// (or / for a file on this site).");

const editField = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,40}$/, "Field keys use lowercase letters, numbers and dashes."),
    label: z.string().trim().min(1, "Give every form field a label.").max(80, "Keep field labels to 80 characters."),
    type: z.enum(editFieldTypes.map((t) => t.type) as [string, ...string[]]),
    required: z.boolean(),
    placeholder: z.string().max(120),
    help: z.string().max(200),
    options: z.array(z.string().trim().min(1).max(80)).max(20),
  })
  .refine((f) => f.type !== "select" || f.options.length >= 2, "A choice field needs at least two choices.");

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
  lowerThird: z.boolean(),
  instructorId: z.uuid().nullable(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  files: z.array(fileSchema).max(200, "Up to 200 files per resource."),
  editsEnabled: z.boolean(),
  editTurnaround: z.string().trim().max(80, "Keep the turnaround to 80 characters."),
  editForm: z
    .array(editField)
    .max(MAX_FIELDS, `Up to ${MAX_FIELDS} form fields.`)
    .refine((fields) => new Set(fields.map((f) => f.id)).size === fields.length, "Two form fields have the same key."),
});

export async function saveStoreResource(resource: StudioStoreResource): Promise<ActionResult<StudioStoreResource>> {
  return adminAction(
    "save the resource",
    async ({ supabase }) => {
      // Blank lines in a choice list aren't choices.
      const editForm = (resource.editForm ?? []).map((f) => ({ ...f, label: f.label.trim(), options: f.options.map((o) => o.trim()).filter(Boolean) }));
      const parsed = schema.safeParse({ ...resource, editForm });
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const r = parsed.data;
      if (r.status === "published" && !r.files.length) throw new StudioError("Add at least one file before publishing.");
      if (r.editsEnabled && !r.editForm.length) throw new StudioError("Add at least one field to the edit request form, or switch edits off.");

      const values = {
        slug: r.slug,
        title: r.title,
        description: r.description,
        category: r.category,
        thumbnail: r.thumbnail,
        preview_url: r.previewUrl,
        access_plan: r.access,
        lower_third: r.lowerThird,
        instructor_id: r.instructorId,
        status: r.status,
        featured: r.featured,
      };
      const edits = { edits_enabled: r.editsEnabled, edit_turnaround: r.editTurnaround, edit_form: r.editForm };
      const { data: existing } = await supabase.from("store_resources").select("id").eq("id", r.id).maybeSingle();
      const write = (row: typeof values & Partial<typeof edits>) =>
        existing ? supabase.from("store_resources").update(row).eq("id", r.id) : supabase.from("store_resources").insert({ id: r.id, ...row });
      let { error } = await write({ ...values, ...edits });
      // Before migration 016 the edit columns aren't there: save the rest.
      if (error?.code === "42703" || error?.code === "PGRST204") {
        if (r.editsEnabled) throw new StudioError("Edits need migration 016: run supabase/migrations/20261012090000_edits_allowances.sql, then save again.");
        ({ error } = await write(values));
      }
      if (error?.code === "23505") throw new StudioError("Another resource already uses that URL. Change it and save again.");
      if (error) throw error;

      // The file list: remove what was taken out, update the rest, add the new ones.
      const current = must(await supabase.rpc("studio_store_files", { target: r.id }));
      const kept = new Set(r.files.map((f) => f.id));
      const removed = current.filter((f) => !kept.has(f.id));
      if (removed.length) {
        must(await supabase.from("store_files").delete().in("id", removed.map((f) => f.id)));
        await removeStored(removed.filter((f) => f.kind === "storage" && f.path).map((f) => f.path));
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
      await removeStored(files.filter((f) => f.kind === "storage" && f.path).map((f) => f.path));
      return null;
    },
    { tags: [CONTENT_TAGS.store] },
  );
}

/**
 * Starts uploading a file to Cloudflare R2: where it will live, and a signed
 * link (30 minutes) the browser sends it to directly.
 */
export async function startR2Upload(input: { resourceId: string; name: string; size: number }): Promise<ActionResult<{ path: string; url: string }>> {
  return adminAction("start the upload", async () => {
    if (!availableProviders().includes("r2")) throw new StudioError("Cloudflare R2 isn't set up yet: add the R2_ keys to .env and restart the site.");
    if (!z.uuid().safeParse(input.resourceId).success) throw new StudioError("Save the resource and try again.");
    const name = String(input.name ?? "").trim() || "file";
    if (!(input.size >= 0) || input.size > storageProviders.r2.maxBytes) throw new StudioError(`“${name}” is bigger than 5 GB, the most R2 takes in one upload. Add it as a link instead.`);
    const path = pathFor("r2", storagePathFor(input.resourceId, name));
    return { path, url: await signedUploadUrl(path) };
  });
}

/** Deletes uploads made in a drawer that was closed without saving. */
export async function discardStoreUploads(paths: string[]): Promise<ActionResult> {
  return adminAction("remove the uploads", async () => {
    const valid = (Array.isArray(paths) ? paths : []).filter((p) => typeof p === "string" && isStorePath(p)).slice(0, 200);
    await removeStored(valid);
    return null;
  });
}
