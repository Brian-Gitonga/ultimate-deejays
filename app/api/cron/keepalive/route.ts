import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env";
import { cronEnv } from "@/lib/env.server";
import type { Database } from "@/lib/supabase/database.types";

/*
 * Keeps the Supabase project awake. Free projects are paused after 7 days
 * with too little database activity, so Vercel Cron (vercel.json) calls this
 * once a day and it runs one small real query.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set
 * in the project's environment variables; anything else gets a 401.
 */

export async function GET(request: Request) {
  if (!isCronRequest(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // The publishable key is enough: site settings are public (RLS allows reads).
  const env = supabaseEnv();
  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  const { error } = await supabase.from("site_settings").select("id").limit(1);
  if (error) {
    console.error("[keepalive]", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, at: new Date().toISOString() });
}

function isCronRequest(header: string | null) {
  const expected = Buffer.from(`Bearer ${cronEnv().CRON_SECRET}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
