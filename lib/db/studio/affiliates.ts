import "server-only";
import type { Affiliate, AffiliateStatus } from "@/lib/affiliates";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/*
 * Studio → Affiliates: applications with clicks, sign-ups, sales and payouts
 * rolled up (affiliate_overview), plus each affiliate's buyer discount and
 * their payout account and requests (affiliate_accounts, migration 013).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Extras = { customer_discount: number | null; account: Tables<"affiliate_accounts"> | null };

/** "PayPal · kaya@x.com", "M-Pesa · +254…", "Equity Bank •••• 1234" */
export function describePayoutAccount(account: Tables<"affiliate_accounts"> | null) {
  if (!account) return "";
  const bank = (account.bank && typeof account.bank === "object" && !Array.isArray(account.bank) ? account.bank : {}) as Record<string, Json>;
  if (account.payout_method === "paypal") return account.paypal_email ? `PayPal · ${account.paypal_email}` : "";
  if (account.payout_method === "mpesa") return account.mpesa_phone ? `M-Pesa · ${account.mpesa_phone}` : "";
  const number = typeof bank.account === "string" ? bank.account : "";
  return number ? `${typeof bank.bankName === "string" && bank.bankName ? bank.bankName : "Bank"} •••• ${number.slice(-4)}` : "";
}

export function toAffiliate(row: Tables<"affiliate_overview">, extras?: Extras): Affiliate {
  return {
    id: row.id!,
    name: row.name ?? "",
    email: row.email ?? "",
    avatar: row.avatar_url,
    channel: row.channel ?? "",
    channelUrl: row.channel_url ?? "",
    audience: row.audience ?? 0,
    pitch: row.pitch ?? "",
    status: (row.status ?? "pending") as AffiliateStatus,
    appliedAt: (row.applied_at ?? "").slice(0, 10),
    approvedAt: row.approved_at?.slice(0, 10) ?? null,
    commission: row.commission ?? 20,
    code: row.code ?? "",
    clicks: row.clicks ?? 0,
    signups: row.signups ?? 0,
    sales: row.sales ?? 0,
    revenue: Number(row.revenue ?? 0),
    earned: Number(row.earned ?? 0),
    paidOut: Number(row.paid_out ?? 0),
    note: row.note ?? "",
    customerDiscount: extras?.customer_discount ?? null,
    payoutTo: describePayoutAccount(extras?.account ?? null),
    codeRequest: extras?.account?.code_request ?? null,
    leaveRequestedAt: extras?.account?.leave_requested_at ?? null,
    updatedAt: row.updated_at ?? "",
  };
}

async function extrasFor(supabase: Supabase, ids?: string[]) {
  const applications = supabase.from("affiliate_applications").select("user_id, customer_discount");
  const accounts = supabase.from("affiliate_accounts").select("*");
  const [a, b] = await Promise.all([ids ? applications.in("user_id", ids) : applications, ids ? accounts.in("affiliate_id", ids) : accounts]);
  if (a.error ?? b.error) throw new Error(`Couldn't load affiliate details: ${(a.error ?? b.error)!.message}. Run migration 013 (supabase/diagnostics/00_health_check.sql).`);
  const discount = new Map((a.data ?? []).map((r) => [r.user_id, r.customer_discount]));
  const account = new Map((b.data ?? []).map((r) => [r.affiliate_id, r]));
  return (id: string): Extras => ({ customer_discount: discount.get(id) ?? null, account: account.get(id) ?? null });
}

export async function getAffiliates(client?: Supabase): Promise<Affiliate[]> {
  const supabase = client ?? (await createClient());
  const [{ data, error }, extras] = await Promise.all([
    supabase.from("affiliate_overview").select("*").order("applied_at", { ascending: false }),
    extrasFor(supabase),
  ]);
  if (error) throw new Error(`Couldn't load affiliates: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (data ?? []).map((row) => toAffiliate(row, extras(row.id!)));
}

export async function getAffiliate(id: string, client: Supabase): Promise<Affiliate | null> {
  const [{ data, error }, extras] = await Promise.all([client.from("affiliate_overview").select("*").eq("id", id).maybeSingle(), extrasFor(client, [id])]);
  if (error) throw error;
  return data ? toAffiliate(data, extras(id)) : null;
}
