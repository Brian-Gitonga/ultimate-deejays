import "server-only";
import { parseAnswers, parseFiles, type EditMessage, type EditStatus, type StudioEditRequest } from "@/lib/edits";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/*
 * Studio → Edit requests: every request with its member and the team's
 * private notes, read through studio_edit_requests() (migration 016), plus
 * each request's messages.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Row = Database["public"]["Functions"]["studio_edit_requests"]["Returns"][number];

const NOT_SET_UP = new Set(["PGRST202", "PGRST205", "42P01", "42883"]);

function toStudioRequest(row: Row, messages: EditMessage[]): StudioEditRequest {
  return {
    id: row.id,
    number: row.number,
    resource: { id: row.resource_id, slug: row.resource_slug, title: row.resource_title, thumbnail: row.resource_thumbnail, lowerThird: row.resource_lower_third },
    answers: parseAnswers(row.answers),
    notes: row.notes,
    phone: row.phone,
    textMe: row.text_me,
    status: row.status as EditStatus,
    files: parseFiles(row.files),
    deliveredAt: row.delivered_at,
    seenAt: row.seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
    member: { id: row.user_id, name: row.member_name, email: row.member_email, plan: row.member_plan },
    adminNotes: row.admin_notes,
    isDemo: row.is_demo,
  };
}

async function load(supabase: Supabase, target?: string): Promise<StudioEditRequest[] | null> {
  const { data, error } = await supabase.rpc("studio_edit_requests", target ? { target } : {});
  if (error) {
    if (NOT_SET_UP.has(error.code ?? "")) return null;
    throw new Error(`Couldn't load the edit requests: ${error.message}. Run supabase/diagnostics/00_health_check.sql (migration 016).`);
  }
  const rows = data ?? [];
  const ids = rows.map((r) => r.id);
  const { data: messages } = ids.length
    ? await supabase.from("edit_request_messages").select("id, request_id, author, body, created_at").in("request_id", ids).order("created_at")
    : { data: [] };
  const byRequest = new Map<string, EditMessage[]>();
  for (const m of messages ?? []) {
    const list = byRequest.get(m.request_id) ?? [];
    list.push({ id: m.id, author: m.author as EditMessage["author"], body: m.body, createdAt: m.created_at });
    byRequest.set(m.request_id, list);
  }
  return rows.map((row) => toStudioRequest(row, byRequest.get(row.id) ?? []));
}

/** Every request, newest first. null before migration 016. */
export async function getStudioEditRequests(client?: Supabase) {
  return load(client ?? (await createClient()));
}

export async function getStudioEditRequest(id: string, client: Supabase): Promise<StudioEditRequest | null> {
  return (await load(client, id))?.[0] ?? null;
}

/** New requests waiting for the team (the menu badge and the dashboard). */
export async function countNewEditRequests(client: Supabase): Promise<number> {
  const { count, error } = await client.from("edit_requests").select("id", { count: "exact", head: true }).eq("status", "submitted");
  return error ? 0 : (count ?? 0);
}
