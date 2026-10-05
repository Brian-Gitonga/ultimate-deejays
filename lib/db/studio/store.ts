import "server-only";
import type { StorePlan, StudioStoreResource } from "@/lib/store";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/*
 * Studio → Store: every resource (drafts too) with its files, read with the
 * admin's session. Where files live (bucket path or link) isn't readable
 * directly, so it comes from studio_store_files() (migration 014).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type FileRow = { id: string; resource_id: string; name: string; kind: string; path: string; url: string; size_bytes: number; mime_type: string; position: number };

function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`Couldn't load ${what}: ${error.message}. Run supabase/diagnostics/00_health_check.sql (migration 014).`);
}

function toStudioResource(row: Tables<"store_resources">, files: FileRow[], stats?: Tables<"store_download_stats">): StudioStoreResource {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    thumbnail: row.thumbnail,
    previewUrl: row.preview_url,
    access: row.access_plan as StorePlan,
    instructorId: row.instructor_id,
    status: row.status as StudioStoreResource["status"],
    featured: row.featured,
    downloads: row.download_count,
    stats: { total: stats?.downloads ?? 0, last30: stats?.last_30_days ?? 0, people: stats?.people ?? 0, lastAt: stats?.last_download_at ?? null },
    isDemo: row.is_demo,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    files: files
      .filter((f) => f.resource_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((f) => ({ id: f.id, name: f.name, kind: f.kind as "storage" | "link", path: f.path, url: f.url, size: Number(f.size_bytes), mime: f.mime_type })),
  };
}

export async function getStudioStore(client?: Supabase): Promise<StudioStoreResource[]> {
  const supabase = client ?? (await createClient());
  const [resources, files, stats] = await Promise.all([
    supabase.from("store_resources").select("*").order("updated_at", { ascending: false }),
    supabase.rpc("studio_store_files", {}),
    supabase.from("store_download_stats").select("*"),
  ]);
  fail("the store", resources.error ?? files.error ?? stats.error);
  const byResource = new Map((stats.data ?? []).map((s) => [s.resource_id, s]));
  return (resources.data ?? []).map((row) => toStudioResource(row, files.data ?? [], byResource.get(row.id)));
}

export async function getStudioStoreResource(id: string, client: Supabase): Promise<StudioStoreResource | null> {
  const [resource, files, stats] = await Promise.all([
    client.from("store_resources").select("*").eq("id", id).maybeSingle(),
    client.rpc("studio_store_files", { target: id }),
    client.from("store_download_stats").select("*").eq("resource_id", id).maybeSingle(),
  ]);
  fail("the resource", resource.error ?? files.error ?? stats.error);
  return resource.data ? toStudioResource(resource.data, files.data ?? [], stats.data ?? undefined) : null;
}
