"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/action-result";
import { getViewer } from "@/lib/dal";
import { getEditSetup } from "@/lib/db/edits";
import { checkAnswers } from "@/lib/edits";
import { normalizePhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

/*
 * A member's edit requests. The answers are checked here against the
 * template's form; request_edit() (migration 016) then checks the plan and
 * the allowance and saves the request.
 */

export type EditInput = {
  slug: string;
  values: Record<string, { value: string; name?: string }>;
  notes: string;
  phone: string;
};

export type RequestEditResult = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Outcome = { status: string; id?: string; limit?: number; openLimit?: number; period?: string };

const ended = "Your session has ended. Log in again and send your request.";

export async function requestEdit(input: EditInput): Promise<RequestEditResult> {
  const viewer = await getViewer();
  if (!viewer || viewer.status === "suspended") return { ok: false, error: ended };

  const setup = await getEditSetup(String(input.slug ?? ""));
  if (!setup) return { ok: false, error: "This template doesn't take edit requests any more." };

  const fieldErrors: Record<string, string> = {};
  const checked = checkAnswers(setup.form, input.values ?? {}, viewer.id);
  if (!checked.ok) Object.assign(fieldErrors, checked.errors);
  const phone = normalizePhone(String(input.phone ?? ""));
  if (phone === null) fieldErrors.phone = "Enter your number like 0712 345 678, or with its country code (+44…).";
  else if (!phone) fieldErrors.phone = "Add your number so we can let you know when it's ready.";
  const notes = String(input.notes ?? "").trim();
  if (notes.length > 2000) fieldErrors.notes = "Keep your notes under 2,000 characters.";
  if (Object.keys(fieldErrors).length || !checked.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_edit", {
    resource_slug: input.slug,
    answers: checked.answers,
    notes,
    phone: phone ?? "",
    // The team messages them on this number (WhatsApp or SMS) when it's ready.
    text_me: !!phone,
  });
  if (error) {
    console.error("[requestEdit]", error.message);
    return { ok: false, error: "We couldn't send your request. Please try again." };
  }

  const outcome = data as Outcome;
  const when = outcome.period === "month" ? " this month" : "";
  switch (outcome.status) {
    case "ok":
      revalidatePath("/account/edits");
      return { ok: true, id: outcome.id! };
    case "signin":
      return { ok: false, error: ended };
    case "not_found":
      return { ok: false, error: "This template doesn't take edit requests any more." };
    case "upgrade":
      return { ok: false, error: "This template is part of a higher plan. Upgrade to ask for edits to it." };
    case "limit":
      return { ok: false, error: outcome.limit ? `You've used your ${outcome.limit} edit ${outcome.limit === 1 ? "request" : "requests"}${when}.` : "Your plan doesn't include edits." };
    case "busy":
      return { ok: false, error: `You have ${outcome.openLimit} ${outcome.openLimit === 1 ? "request" : "requests"} waiting. You can ask for another once one is done.` };
    default:
      return { ok: false, error: "Something in the form didn't look right. Check it and send it again." };
  }
}

export async function cancelEditRequest(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(id)) return { ok: false, error: "That request doesn't exist." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_edit_request", { request: id });
  if (error || !data) return { ok: false, error: "This request can't be cancelled any more: the team has started on it." };
  revalidatePath("/account/edits");
  revalidatePath(`/account/edits/${id}`);
  return { ok: true };
}

export async function replyToEditRequest(id: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const text = String(body ?? "").trim();
  if (!isUuid(id)) return { ok: false, error: "That request doesn't exist." };
  if (!text) return { ok: false, error: "Write your answer first." };
  if (text.length > 2000) return { ok: false, error: "Keep it under 2,000 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reply_edit_request", { request: id, body: text });
  if (error || !data) return { ok: false, error: "We couldn't send that. This request may be closed." };
  revalidatePath(`/account/edits/${id}`);
  return { ok: true };
}

/** Opening a delivered edit clears its "ready" badge. */
export async function markEditSeen(id: string) {
  if (!isUuid(id)) return;
  const supabase = await createClient();
  await supabase.rpc("mark_edit_seen", { request: id });
  revalidatePath("/account", "layout");
}
