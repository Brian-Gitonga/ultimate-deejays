import "server-only";
import { cache } from "react";
import { previewVideoHref, type StorePlan, type StoreResource } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { contentClient, orThrow } from "./content-client";

// The store's tables come with migration 014. Until it's run, /store shows its empty state.
const NOT_SET_UP = new Set(["PGRST205", "42P01"]);

/*
 * Published store resources for the site, read as a visitor (RLS hides
 * drafts) and cached like the rest of the content. Files come with their
 * name, size and type only: where they live is never readable here.
 */

const BASE_COLUMNS =
  "id, slug, title, description, category, thumbnail, preview_url, access_plan, featured, download_count, published_at, created_at, instructor:instructors(name, image), files:store_files(id, name, size_bytes, mime_type, position)";
// Newer columns, newest first: if one is missing (its migration hasn't run) the store loads without it.
const LATER_COLUMNS = [
  { column: "hero_featured", migration: "20261016090000_lower_thirds_hero.sql" },
  { column: "preview_video", migration: "20261015090000_store_preview_video.sql" },
  { column: "lower_third", migration: "20261011090000_lower_thirds.sql" },
];
const NO_SUCH_COLUMN = "42703";

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  preview_url: string;
  access_plan: string;
  featured: boolean;
  download_count: number;
  published_at: string | null;
  created_at: string;
  instructor: { name: string; image: string } | null;
  files: { id: string; name: string; size_bytes: number; mime_type: string; position: number }[];
  lower_third?: boolean;
  preview_video?: string;
  hero_featured?: boolean;
};

async function publishedRows(): Promise<Row[]> {
  const table = () => contentClient("store", "instructors").from("store_resources");
  for (let skip = 0; skip <= LATER_COLUMNS.length; skip++) {
    const extra = LATER_COLUMNS.slice(skip).map((c) => c.column);
    const result = await table()
      .select([BASE_COLUMNS, ...extra].join(", "))
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (result.error && NOT_SET_UP.has(result.error.code ?? "")) {
      console.error("[store] The store tables are missing: run supabase/migrations/20261004090000_store.sql.");
      return [];
    }
    if (result.error?.code === NO_SUCH_COLUMN && skip < LATER_COLUMNS.length) {
      console.error(`[store] store_resources.${LATER_COLUMNS[skip].column} is missing: run supabase/migrations/${LATER_COLUMNS[skip].migration}.`);
      continue;
    }
    return orThrow(result as unknown as { data: Row[] | null; error: { message: string } | null }, "the store");
  }
  return [];
}

/** Where a published resource's preview clip lives, for the playback route. "" when it has none. */
export async function getPreviewVideoPath(slug: string): Promise<string> {
  const { data, error } = await contentClient("store").from("store_resources").select("preview_video").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) return "";
  return (data as { preview_video?: string } | null)?.preview_video ?? "";
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
      previewVideo: previewVideoHref(row.slug, row.preview_video ?? ""),
      heroFeatured: row.hero_featured ?? false,
      access: row.access_plan as StorePlan,
      lowerThird: row.lower_third ?? false,
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
