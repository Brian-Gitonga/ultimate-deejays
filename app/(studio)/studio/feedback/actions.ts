"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { MIX_COLUMNS, toMix } from "@/lib/db/studio/mixes";
import type { MixSubmission } from "@/lib/mixes";
import { adminAction, must, StudioError } from "@/lib/studio-action";

const schema = z.object({ feedback: z.string().trim().max(5000, "Keep feedback to 5,000 characters.") });

/** Saves feedback on a mix. The database marks it reviewed (or pending again if the feedback is cleared). */
export async function saveFeedback(mix: MixSubmission): Promise<ActionResult<MixSubmission>> {
  return adminAction("save the feedback", async ({ supabase }) => {
    const parsed = schema.safeParse(mix);
    if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
    const row = must(await supabase.from("mix_submissions").update(parsed.data).eq("id", mix.id).select(MIX_COLUMNS).single());
    return toMix(row as unknown as Parameters<typeof toMix>[0]);
  });
}

export async function deleteMix(id: string): Promise<ActionResult> {
  return adminAction("delete the mix", async ({ supabase }) => {
    must(await supabase.from("mix_submissions").delete().eq("id", id));
    return null;
  });
}
