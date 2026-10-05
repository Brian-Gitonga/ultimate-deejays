import "server-only";
import { z } from "zod";
import { envGroup } from "./env";

/* Server-only secrets. Importing this from a client component fails the build. */

export const supabaseAdminEnv = envGroup(z.object({ SUPABASE_SECRET_KEY: z.string().min(1) }), () => ({
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
}));

export const paystackEnv = envGroup(z.object({ PAYSTACK_SECRET_KEY: z.string().startsWith("sk_") }), () => ({
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
}));
