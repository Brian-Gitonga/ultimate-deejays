import "server-only";
import { cache } from "react";
import type { StorePlan, StoreResource } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { contentClient, orThrow } from "./content-client";

// The store's tables come with migration 014. Until it's run, /store shows its empty state.
const NOT_SET_UP = new Set(["PGRST205", "42P01"]);

/*
 * Published store resources for the site, read as a visitor (RLS hides
 * drafts) and cached like the rest of the content. Files come with their
 * name, size and type only: where they live is never readable here.
 */

const COLUMNS =
  "id, slug, title, description, category, thumbnail, preview_url, access_plan, lower_third, featured, download_count, published_at, created_at, instructor:instructors(name, image), files:store_files(id, name, size_bytes, mime_type, position)";
// The same without lower_third, which comes with migration 015. Until it's run, the store works and /lower-thirds is empty.
const COLUMNS_BEFORE_015 =
  "id, slug, title, description, category, thumbnail, preview_url, access_plan, featured, download_count, published_at, created_at, instructor:instructors(name, image), files:store_files(id, name, size_bytes, mime_type, position)";
const NO_SUCH_COLUMN = "42703";

async function publishedRows() {
  const table = () => contentClient("store", "instructors").from("store_resources");
  const result = await table().select(COLUMNS).eq("status", "published").order("published_at", { ascending: false });
  if (result.error && NOT_SET_UP.has(result.error.code ?? "")) {
    console.error("[store] The store tables are missing: run supabase/migrations/20261004090000_store.sql.");
    return [];
  }
  if (result.error?.code !== NO_SUCH_COLUMN) return orThrow(result, "the store");
  console.error("[store] store_resources.lower_third is missing: run supabase/migrations/20261011090000_lower_thirds.sql.");
  const older = await table().select(COLUMNS_BEFORE_015).eq("status", "published").order("published_at", { ascending: false });
  return orThrow(older, "the store").map((row) => ({ ...row, lower_third: false }));
}

export const getStoreResources = cache(async (): Promise<StoreResource[]> => {
  const rows = await publishedRows();
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
      lowerThird: row.lower_third,
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

/** The published lower thirds: store resources with the lower-third switch on. */
export async function getLowerThirds() {
  return (await getStoreResources()).filter((r) => r.lowerThird);
}

/** The signed-in member's latest downloads, newest first (Account → Overview). null before migration 017. */
export async function getMyDownloads(limit = 5): Promise<{ resource: StoreResource; lastAt: string }[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_downloads", { max_rows: 12 });
  if (error) {
    // "Could not find the function" = migration 017 hasn't been run.
    if (!["PGRST202", "42883"].includes(error.code ?? "")) console.error("[my_downloads]", error.message);
    return null;
  }
  const byId = new Map((await getStoreResources()).map((r) => [r.id, r]));
  return (data ?? [])
    .flatMap((row) => {
      const resource = byId.get(row.resource_id);
      return resource ? [{ resource, lastAt: row.last_at }] : [];
    })
    .slice(0, limit);
}
