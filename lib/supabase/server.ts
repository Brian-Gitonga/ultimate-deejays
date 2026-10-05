import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/*
 * Supabase in Server Components, Server Actions and Route Handlers, acting as
 * the signed-in user from the request's cookies. Create one per request.
 * To check who's signed in, use `supabase.auth.getClaims()` (verified), not getSession().
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = supabaseEnv();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies. Safe to ignore: proxy.ts refreshes the session.
        }
      },
    },
  });
}
