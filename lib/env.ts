import { z } from "zod";

/*
 * Typed, validated environment variables, grouped by service. Each group is
 * checked on first use, not at import, so pages that don't touch the backend
 * keep working before .env.local is filled in, and a missing Paystack key
 * doesn't break Supabase. See .env.example for where each value comes from.
 *
 * Public values must be read as literal `process.env.NEXT_PUBLIC_*` so Next.js
 * can inline them into the browser bundle. Server secrets live in
 * lib/env.server.ts, which can't be imported from client code.
 */

/** Validates once, then returns the cached result. Throws one readable error listing every bad variable. */
export function envGroup<T extends z.ZodType>(schema: T, read: () => Record<string, unknown>): () => z.infer<T> {
  let cached: z.infer<T> | undefined;
  return () => {
    if (cached) return cached;
    const result = schema.safeParse(read());
    if (!result.success) {
      const problems = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
      throw new Error(`Invalid environment variables:\n${problems}\nSet them in .env.local (see .env.example).`);
    }
    cached = result.data;
    return cached;
  };
}

export const supabaseEnv = envGroup(
  z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  }),
  () => ({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }),
);

export const paystackPublicEnv = envGroup(
  z.object({ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_") }),
  () => ({ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY }),
);

/** True once Supabase is configured; lets the proxy skip auth until then. */
export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
