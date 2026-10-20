import "server-only";
import { objectKey, providerOf } from "@/lib/storage";
import { getR2Usage, r2DashboardUrl } from "@/lib/storage.server";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Free allowances, for the bars. R2: 10 GB a month. Supabase: 1 GB of file storage on the free plan. */
export const FREE_BYTES = { r2: 10 * 1024 ** 3, supabase: 1024 ** 3 };
/** R2 storage beyond the free 10 GB, per GB a month (Standard storage). */
export const R2_PRICE_PER_GB = 0.015;

export type StorageOverview = {
  r2:
    | { configured: false }
    | {
        configured: true;
        bytes: number;
        files: number;
        /** Store uploads no resource uses any more (e.g. a drawer closed mid-upload) */
        unattached: { files: number; bytes: number };
        /** Files put in the bucket outside the site */
        other: { files: number; bytes: number };
        checkedAt: string;
        error?: string;
        dashboardUrl: string | null;
      };
  supabase: { bytes: number; files: number; dashboardUrl: string | null };
};

const sum = (list: { size: number }[]) => list.reduce((total, o) => total + o.size, 0);

/**
 * Studio dashboard → Storage: how much each storage holds. R2 is read from
 * the bucket itself; Supabase from the store's file list (its store bucket
 * holds only those).
 */
export async function getStorageOverview(supabase: Supabase): Promise<StorageOverview> {
  const [usage, files, resources] = await Promise.all([getR2Usage(), supabase.rpc("studio_store_files", {}), supabase.from("store_resources").select("*")]);
  // Preview clips (migration 018) live in storage too.
  const previews = (resources.data ?? []).flatMap((r) => (r.preview_video ? [{ path: r.preview_video }] : []));
  if (files.error) console.error("[storage] reading the store file list", files.error.message);
  const stored = (files.data ?? []).filter((f) => f.kind === "storage" && f.path);
  const inSupabase = stored.filter((f) => providerOf(f.path) === "supabase");
  const supabaseRef = /^https:\/\/([^.]+)\.supabase\.co/.exec(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")?.[1];

  const overview: StorageOverview = {
    r2: { configured: false },
    supabase: {
      bytes: inSupabase.reduce((total, f) => total + Number(f.size_bytes), 0),
      files: inSupabase.length,
      dashboardUrl: supabaseRef ? `https://supabase.com/dashboard/project/${supabaseRef}/storage/buckets/store` : null,
    },
  };
  if (!usage.configured) return overview;

  // Folder markers (keys ending in "/") aren't files.
  const objects = usage.objects.filter((o) => !o.key.endsWith("/"));
  const linked = new Set([...stored, ...previews].filter((f) => providerOf(f.path) === "r2").map((f) => objectKey(f.path)));
  // Only when the file list was read: otherwise every upload would look unattached.
  const unattached = files.error || resources.error ? [] : objects.filter((o) => o.key.startsWith("resources/") && !linked.has(o.key));
  const other = objects.filter((o) => !o.key.startsWith("resources/"));
  overview.r2 = {
    configured: true,
    bytes: usage.bytes,
    files: objects.length,
    unattached: { files: unattached.length, bytes: sum(unattached) },
    other: { files: other.length, bytes: sum(other) },
    checkedAt: usage.checkedAt,
    error: usage.error,
    dashboardUrl: r2DashboardUrl(),
  };
  return overview;
}
