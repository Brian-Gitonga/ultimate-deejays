import "server-only";
import { cache } from "react";
import type { StorePlan, StoreResource } from "@/lib/store";
import { contentClient, orThrow } from "./content-client";

// The store's tables come with migration 014. Until it's run, /store shows its empty state.
const NOT_SET_UP = new Set(["PGRST205", "42P01"]);

/*
 * Published store resources for the site, read as a visitor (RLS hides
 * drafts) and cached like the rest of the content. Files come with their
 * name, size and type only: where they live is never readable here.
 */

const COLUMNS =
  "id, slug, title, description, category, thumbnail, preview_url, access_plan, featured, download_count, published_at, created_at, instructor:instructors(name, image), files:store_files(id, name, size_bytes, mime_type, position)";

export const getStoreResources = cache(async (): Promise<StoreResource[]> => {
  const result = await contentClient("store", "instructors").from("store_resources").select(COLUMNS).eq("status", "published").order("published_at", { ascending: false });
  if (result.error && NOT_SET_UP.has(result.error.code ?? "")) {
    console.error("[store] The store tables are missing: run supabase/migrations/20261004090000_store.sql.");
    return [];
  }
  const rows = orThrow(result, "the store");
  return rows.map((row) => {
    const files = [...row.files]
      .sort((a, b) => a.position - b.position)
      .map((f) => ({ id: f.id, name: f.name, size: Number(f.size_bytes), mime: f.mime_type }));
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      thumbnail: row.thumbnail,
      previewUrl: row.preview_url,
      access: row.access_plan as StorePlan,
      creator: row.instructor ? { name: row.instructor.name, image: row.instructor.image || null } : { name: "Ultimate Deejays", image: null },
      featured: row.featured,
      downloads: row.download_count,
      publishedAt: row.published_at ?? row.created_at,
      files,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    };
  });
});

export async function getStoreResource(slug: string) {
  return (await getStoreResources()).find((r) => r.slug === slug) ?? null;
}
