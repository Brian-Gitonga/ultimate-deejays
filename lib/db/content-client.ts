import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/*
 * Reads public content (courses, blog, challenges, instructors, settings,
 * reviews, the store) for the site as an anonymous visitor, so only published rows come
 * back. Responses are cached by Next.js and tagged; the studio's Server
 * Actions expire a tag the moment you save (updateTag), and everything
 * refreshes on its own every 5 minutes, which is what makes scheduled posts
 * and challenge dates go live without a deploy.
 */

export const CONTENT_TAGS = {
  courses: "courses",
  posts: "posts",
  challenges: "challenges",
  instructors: "instructors",
  settings: "settings",
  reviews: "reviews",
  store: "store",
} as const;

export type ContentTag = (typeof CONTENT_TAGS)[keyof typeof CONTENT_TAGS];

const REVALIDATE_SECONDS = 300;

export function contentClient(...tags: ContentTag[]) {
  const env = supabaseEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "force-cache", next: { tags, revalidate: REVALIDATE_SECONDS } }),
    },
  });
}

type QueryResult<D> = { data: D; error: { message: string; code?: string } | null };

const failed = (what: string, error: { message: string }) =>
  new Error(`Couldn't load ${what}: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);

/** The rows of a query, or a readable error (shown by the nearest error page). */
export function orThrow<D>(result: QueryResult<D>, what: string): NonNullable<D> {
  if (result.error) throw failed(what, result.error);
  return result.data as NonNullable<D>;
}

/** The row of a .maybeSingle() query (null if there's none), or a readable error. */
export function maybeOrThrow<D>(result: QueryResult<D>, what: string): D | null {
  if (result.error) throw failed(what, result.error);
  return result.data ?? null;
}
