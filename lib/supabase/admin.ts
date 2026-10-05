import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env";
import { supabaseAdminEnv } from "@/lib/env.server";
import type { Database } from "./database.types";

/*
 * Supabase with the secret key: bypasses Row Level Security. Only for trusted
 * server work with no signed-in user, like payment webhooks and admin jobs.
 * Never use it to serve a user's request. Use lib/supabase/server.ts for that.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseEnv().NEXT_PUBLIC_SUPABASE_URL, supabaseAdminEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
