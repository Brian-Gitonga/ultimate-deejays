import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { getViewer, type Viewer } from "@/lib/dal";
import type { ContentTag } from "@/lib/db/content-client";
import { withDetail } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

/*
 * Every studio Server Action runs through adminAction(): it checks the caller
 * is a signed-in admin, runs the change, refreshes the studio and expires the
 * public site's cached content, and turns failures into a readable message.
 * The database enforces the same admin rule again (RLS), so a bug here can't
 * open anything up.
 */

/** Throw inside an action for a message the admin should see as-is. */
export class StudioError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function adminAction<T>(
  label: string,
  run: (ctx: { supabase: Supabase; admin: Viewer }) => Promise<T>,
  options: { tags?: ContentTag[] } = {},
): Promise<ActionResult<T>> {
  const admin = await getViewer();
  if (!admin) return { ok: false, error: "Your session has ended. Log in again." };
  if (admin.role !== "admin") return { ok: false, error: "Only admins can do that." };

  try {
    const record = await run({ supabase: await createClient(), admin });
    for (const tag of options.tags ?? []) updateTag(tag);
    revalidatePath("/studio", "layout");
    return { ok: true, record };
  } catch (error) {
    if (error instanceof StudioError) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    console.error(`[studio] ${label} failed:`, error);
    const db = error as { code?: string; message?: string };
    if (db.code === "23505") return { ok: false, error: withDetail("That's already taken: the slug or code must be unique.", db) };
    return { ok: false, error: withDetail(`Couldn't ${label}. Please try again.`, db) };
  }
}

/** Unwraps a Supabase result inside adminAction, throwing its error so the wrapper reports it. */
export function must<D>(result: { data: D; error: { message: string; code?: string } | null }): NonNullable<D> {
  if (result.error) throw result.error;
  return result.data as NonNullable<D>;
}
