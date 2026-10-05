import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/*
 * Refreshes the Supabase session on every request so Server Components see a
 * valid user. Called from proxy.ts. Returns the response that carries any
 * refreshed auth cookies, plus the verified claims (null when signed out).
 */
export async function updateSession(request: NextRequest) {
  const env = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // No-cache headers, so a CDN never serves one user's session cookie to another.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Don't run code between createServerClient and getClaims: it can sign users out at random.
  const { data } = await supabase.auth.getClaims();

  return { response, claims: data?.claims ?? null };
}
