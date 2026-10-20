import "server-only";
import { cache } from "react";
import type { MyAllowance, PlanAllowance, PlanSlug } from "@/lib/allowances";
import { createClient } from "@/lib/supabase/server";
import { contentClient } from "./content-client";

// plan_allowances and my_allowance() come with migration 016. Until it's run there are no limits to show.
const NOT_SET_UP = new Set(["PGRST205", "PGRST202", "42P01", "42883"]);

const PLAN_ORDER: PlanSlug[] = ["warm-up", "resident", "headliner", "lifetime"];

type Row = { plan: PlanSlug; downloads: number | null; edits: number | null; open_edits: number | null; period: string };

export const toAllowance = (row: Row): PlanAllowance => ({
  plan: row.plan,
  downloads: row.downloads,
  edits: row.edits,
  openEdits: row.open_edits,
  period: row.period === "total" ? "total" : "month",
});

/** Every plan's allowance, for the pricing page (cached with the settings). [] before migration 016. */
export const getPlanAllowances = cache(async (): Promise<PlanAllowance[]> => {
  const { data, error } = await contentClient("settings").from("plan_allowances").select("plan, downloads, edits, open_edits, period");
  if (error) {
    if (!NOT_SET_UP.has(error.code ?? "")) console.error("[allowances]", error.message);
    return [];
  }
  return (data ?? []).map(toAllowance).sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan));
});

/** What the signed-in member has used and has left; null when signed out or before migration 016. */
export const getMyAllowance = cache(async (): Promise<MyAllowance | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_allowance");
  if (error) {
    if (!NOT_SET_UP.has(error.code ?? "")) console.error("[my_allowance]", error.message);
    return null;
  }
  return (data as MyAllowance | null) ?? null;
});
