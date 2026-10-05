"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { MEDIA_MAX_BYTES, MEDIA_TYPES, mediaFolders, type MediaAsset, type MediaFolder } from "@/lib/media";
import { adminAction, must, StudioError } from "@/lib/studio-action";
import type { Tables } from "@/lib/supabase/database.types";

/*
 * Media library: files in the public "media" storage bucket, each with a row
 * in media_assets (name, alt text, folder, size). Used by Studio → Media
 * library and by every image picker in the studio.
 */

const BUCKET = "media";
const folderSlugs = mediaFolders.map((f) => f.slug) as [MediaFolder, ...MediaFolder[]];

const toAsset = (row: Tables<"media_assets">): MediaAsset => ({
  id: row.id,
  url: row.url,
  path: row.path,
  name: row.name,
  alt: row.alt,
  folder: row.folder as MediaFolder,
  mimeType: row.mime_type,
  sizeBytes: row.size_bytes,
  width: row.width,
  height: row.height,
  createdAt: row.created_at,
});

const safeName = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60) || "file";

/**
 * Uploads one file. FormData: file, folder, and optionally alt, width, height
 * (the browser knows an image's size after resizing it).
 */
export async function uploadMedia(formData: FormData): Promise<ActionResult<MediaAsset>> {
  return adminAction("upload the file", async ({ supabase }) => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new StudioError("Choose a file to upload.");
    if (!MEDIA_TYPES.includes(file.type)) throw new StudioError("Upload a JPG, PNG, WebP, GIF or PDF.");
    if (file.size > MEDIA_MAX_BYTES) throw new StudioError("That file is over 10 MB.");

    const folder = z.enum(folderSlugs).catch("general").parse(formData.get("folder"));
    const dimension = (key: string) => {
      const n = Number(formData.get(key));
      return Number.isInteger(n) && n > 0 && n < 20000 ? n : null;
    };
    const now = new Date();
    const path = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID().slice(0, 8)}-${safeName(file.name)}`;

    const storage = supabase.storage.from(BUCKET);
    const upload = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (upload.error) throw new StudioError(`The upload failed: ${upload.error.message}. Check that migration 008 (media bucket) has been run.`);

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        path,
        url: storage.getPublicUrl(path).data.publicUrl,
        name: file.name.slice(0, 200),
        alt: String(formData.get("alt") ?? "").slice(0, 300),
        folder,
        mime_type: file.type,
        size_bytes: file.size,
        width: dimension("width"),
        height: dimension("height"),
      })
      .select("*")
      .single();
    if (error) {
      await storage.remove([path]);
      throw error;
    }
    return toAsset(data);
  });
}

/** Every file, newest first (images only when imagesOnly is set, for the image pickers). */
export async function listMedia(imagesOnly = false): Promise<ActionResult<MediaAsset[]>> {
  return adminAction("load the media library", async ({ supabase }) => {
    let query = supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(500);
    if (imagesOnly) query = query.like("mime_type", "image/%");
    return must(await query).map(toAsset);
  });
}

const updateSchema = z.object({
  name: z.string().trim().min(1, "Give the file a name.").max(200),
  alt: z.string().trim().max(300),
  folder: z.enum(folderSlugs),
});

export async function updateMedia(asset: MediaAsset): Promise<ActionResult<MediaAsset>> {
  return adminAction("save the file details", async ({ supabase }) => {
    const parsed = updateSchema.safeParse(asset);
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    return toAsset(must(await supabase.from("media_assets").update(parsed.data).eq("id", asset.id).select("*").single()));
  });
}

/** Deletes the file from storage and the library. Pages still using its URL will show a broken image. */
export async function deleteMedia(id: string): Promise<ActionResult> {
  return adminAction("delete the file", async ({ supabase }) => {
    const row = must(await supabase.from("media_assets").select("path").eq("id", id).single());
    const removed = await supabase.storage.from(BUCKET).remove([row.path]);
    if (removed.error) throw new StudioError(`Couldn't delete the file from storage: ${removed.error.message}`);
    must(await supabase.from("media_assets").delete().eq("id", id));
    return null;
  });
}
