/*
 * Plan allowances (migration 016): how many store downloads and edit
 * requests each plan gets, every month or in total, set in Studio → Settings
 * → Pricing page. null = unlimited. The database enforces them
 * (store_download(), request_edit()); this file is for showing them.
 */

export type PlanSlug = "warm-up" | "resident" | "headliner";
export type AllowancePeriod = "month" | "total";

export type PlanAllowance = {
  plan: PlanSlug;
  /** Different templates per period; null = unlimited */
  downloads: number | null;
  /** Edit requests per period; null = unlimited */
  edits: number | null;
  /** Requests that can wait at the same time; null = no limit */
  openEdits: number | null;
  period: AllowancePeriod;
};

/** What the signed-in member has used, from my_allowance(). */
export type MyAllowance = {
  plan: PlanSlug;
  admin: boolean;
  period: AllowancePeriod;
  /** When the month's allowance starts again; null for "in total" */
  resetsAt: string | null;
  downloads: { limit: number | null; used: number };
  edits: { limit: number | null; used: number; open: number; openLimit: number | null };
};

export const isUnlimited = (m: { limit: number | null }) => m.limit === null;

/** How many are left; Infinity when unlimited. */
export const left = (m: { limit: number | null; used: number }) => (m.limit === null ? Infinity : Math.max(0, m.limit - m.used));

const per = (period: AllowancePeriod) => (period === "month" ? "a month" : "in total");

/** For the pricing table and the studio: "30 a month", "5 in total", "Unlimited", "None". */
export function allowanceLabel(value: number | null, period: AllowancePeriod) {
  if (value === null) return "Unlimited";
  if (value === 0) return "None";
  return `${value.toLocaleString("en-US")} ${per(period)}`;
}

/**
 * Lines for a plan's "What's included": "30 store downloads a month", "8 template edits
 * by our team in total", "Unlimited store downloads and template edits". Nothing for
 * what the plan doesn't include, so changing an allowance changes every plan card.
 */
export function allowanceHighlights(a: PlanAllowance | undefined | null): string[] {
  if (!a) return [];
  if (a.downloads === null && a.edits === null) return ["Unlimited store downloads and template edits"];
  const lines: string[] = [];
  if (a.downloads === null) lines.push("Unlimited store downloads");
  else if (a.downloads > 0) lines.push(`${a.downloads.toLocaleString("en-US")} store ${a.downloads === 1 ? "download" : "downloads"} ${per(a.period)}`);
  if (a.edits === null) lines.push("Unlimited template edits by our team");
  else if (a.edits > 0) lines.push(`${a.edits.toLocaleString("en-US")} template ${a.edits === 1 ? "edit" : "edits"} by our team ${per(a.period)}`);
  return lines;
}

/** One line for an upgrade option: "30 downloads · 8 edits, in total" or "Unlimited downloads and edits". */
export function allowanceSummary(a: PlanAllowance | undefined | null) {
  if (!a) return "";
  if (a.downloads === null && a.edits === null) return "Unlimited downloads and edits";
  const part = (n: number | null, one: string, many: string) => (n === null ? `unlimited ${many}` : n === 0 ? `no ${many}` : `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`);
  const text = `${part(a.downloads, "download", "downloads")} · ${part(a.edits, "edit", "edits")}, ${per(a.period)}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const day = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2 of 3 edit requests left this month · resets 1 Nov", or "Unlimited downloads". */
export function meterLabel(m: { limit: number | null; used: number }, allowance: Pick<MyAllowance, "period" | "resetsAt">, noun: { one: string; many: string }) {
  if (m.limit === null) return `Unlimited ${noun.many}`;
  const remaining = left(m);
  const when = allowance.period === "month" ? " this month" : "";
  const resets = allowance.period === "month" && allowance.resetsAt ? ` · resets ${day.format(new Date(allowance.resetsAt))}` : "";
  return `${remaining} of ${m.limit} ${m.limit === 1 ? noun.one : noun.many} left${when}${resets}`;
}
