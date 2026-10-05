import "server-only";
import type { Payout, Transaction } from "@/lib/earnings";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/* Studio → Earnings: plan payments and payouts to the business (admins only, via RLS). */

type Supabase = Awaited<ReturnType<typeof createClient>>;

type PaymentRow = Tables<"payments"> & {
  affiliate: Pick<Tables<"affiliate_applications">, "code"> | null;
  buyer: Pick<Tables<"profiles">, "avatar_url"> | null;
};

export const PAYMENT_COLUMNS = "*, affiliate:affiliate_applications(code), buyer:profiles!payments_user_id_fkey(avatar_url)";

export function toTransaction(row: PaymentRow): Transaction {
  return {
    id: row.reference,
    customer: row.customer_name || row.customer_email,
    email: row.customer_email,
    avatar: row.buyer?.avatar_url ?? null,
    country: row.country,
    plan: row.plan,
    kind: row.kind as Transaction["kind"],
    amount: Number(row.amount),
    fee: Number(row.fee),
    method: row.method,
    source: row.source,
    status: row.status,
    date: row.paid_at.slice(0, 10),
    refundedAt: row.refunded_at?.slice(0, 10) ?? null,
    affiliate: row.affiliate?.code ?? null,
    discount: Number(row.discount),
    couponCode: row.coupon_code,
    commission: Number(row.commission),
    currency: row.currency,
    isDemo: row.is_demo,
    viaPaystack: !!row.checkout_id && row.method !== "free" && !row.is_demo,
    updatedAt: row.updated_at,
  };
}

export function toPayout(row: Tables<"payouts">): Payout {
  return {
    id: row.id,
    reference: row.reference,
    amount: Number(row.amount),
    destination: row.destination,
    status: row.status as Payout["status"],
    date: (row.paid_at ?? row.created_at).slice(0, 10),
    period: row.period,
    isDemo: row.is_demo,
  };
}

export async function getTransactions(client?: Supabase): Promise<Transaction[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("payments").select(PAYMENT_COLUMNS).order("paid_at", { ascending: false }).limit(5000);
  if (error) throw new Error(`Couldn't load payments: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (data as unknown as PaymentRow[]).map(toTransaction);
}

export async function getPayouts(client?: Supabase): Promise<Payout[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.from("payouts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load payouts: ${error.message}.`);
  return data.map(toPayout);
}
