import "server-only";
import { cache } from "react";
import { getViewer } from "@/lib/dal";
import { parseAnswers, parseEditForm, parseFiles, type EditField, type EditMessage, type EditRequest, type EditStatus } from "@/lib/edits";
import { createClient } from "@/lib/supabase/server";
import { contentClient } from "./content-client";

// Edits come with migration 016. Until it's run, templates offer no edits and the account has none.
const NOT_SET_UP = new Set(["PGRST205", "PGRST204", "42P01", "42703"]);
const notSetUp = (error: { code?: string; message: string }, where: string) => {
  if (NOT_SET_UP.has(error.code ?? "")) return true;
  console.error(`[edits] ${where}:`, error.message);
  return false;
};

export type EditSetup = { enabled: boolean; turnaround: string; form: EditField[] };

/** A published template's edit offer (its form), cached with the store. null = no edits. */
export const getEditSetup = cache(async (slug: string): Promise<EditSetup | null> => {
  const { data, error } = await contentClient("store")
    .from("store_resources")
    .select("edits_enabled, edit_form, edit_turnaround")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    notSetUp(error, "edit setup");
    return null;
  }
  if (!data?.edits_enabled) return null;
  const form = parseEditForm(data.edit_form);
  return { enabled: true, turnaround: data.edit_turnaround, form };
});

// Members can't read the team's private notes, so the columns are listed.
const COLUMNS =
  "id, number, resource_id, resource_slug, resource_title, answers, notes, phone, text_me, status, files, delivered_at, seen_at, created_at, updated_at, resource:store_resources(thumbnail, lower_third)";

type Row = {
  id: string;
  number: number;
  resource_id: string | null;
  resource_slug: string;
  resource_title: string;
  answers: unknown;
  notes: string;
  phone: string;
  text_me: boolean;
  status: string;
  files: unknown;
  delivered_at: string | null;
  seen_at: string | null;
  created_at: string;
  updated_at: string;
  resource: { thumbnail: string; lower_third: boolean } | null;
};

export function toEditRequest(row: Row, messages: EditMessage[] = []): EditRequest {
  return {
    id: row.id,
    number: row.number,
    resource: {
      id: row.resource_id,
      slug: row.resource_slug,
      title: row.resource_title,
      thumbnail: row.resource?.thumbnail ?? "",
      lowerThird: row.resource?.lower_third ?? false,
    },
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
  };
}

/** The signed-in member's requests, newest first. null before migration 016. */
export async function getMyEditRequests(): Promise<EditRequest[] | null> {
  const viewer = await getViewer();
  if (!viewer) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("edit_requests").select(COLUMNS).eq("user_id", viewer.id).order("created_at", { ascending: false });
  if (error) return notSetUp(error, "my requests") ? null : [];
  return (data as unknown as Row[]).map((row) => toEditRequest(row));
}

/** One of the member's requests with its messages; null if it isn't theirs (or doesn't exist). */
export async function getMyEditRequest(id: string): Promise<EditRequest | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const [request, messages] = await Promise.all([
    supabase.from("edit_requests").select(COLUMNS).eq("id", id).eq("user_id", viewer.id).maybeSingle(),
    supabase.from("edit_request_messages").select("id, author, body, created_at").eq("request_id", id).order("created_at"),
  ]);
  if (request.error) {
    notSetUp(request.error, "request");
    return null;
  }
  if (!request.data) return null;
  const thread = (messages.data ?? []).map((m) => ({ id: m.id, author: m.author as EditMessage["author"], body: m.body, createdAt: m.created_at }));
  return toEditRequest(request.data as unknown as Row, thread);
}

/** Delivered edits the member hasn't opened yet (the "My edits" badge). */
export const countReadyEdits = cache(async (userId: string): Promise<number> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("edit_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "delivered")
    .is("seen_at", null);
  if (error) return 0;
  return count ?? 0;
});
