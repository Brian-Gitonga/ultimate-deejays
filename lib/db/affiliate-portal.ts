import "server-only";
import { cache } from "react";
import type { AffiliateAccount, PayoutMethod } from "@/lib/affiliate-links";
import type { AffiliatePayout, MonthStat, PortalAffiliate, PortalBalance, ProgramTerms, Referral, ReferralStatus, TrackedLink } from "@/lib/affiliate-portal";
import { displayName, type Viewer } from "@/lib/dal";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "./settings";

/*
 * The signed-in affiliate's dashboard, read with their own session: their
 * application, links, payout account and payouts through RLS, and their
 * referred sales, sign-ups and clicks through the my_affiliate_*() functions
 * (first name + initial only, never emails or payment details).
 *
 * Commission status, worked out here:
 *   refunded  the sale was refunded (commission cancelled)
 *   pending   still inside the refund window (Settings → Payments)
 *   paid      covered by an affiliate payout (oldest sales are paid first)
 *   approved  cleared and waiting for the next payout
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;
const round = (n: number) => Math.round(n * 100) / 100;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type AffiliateViewer = Viewer & { affiliate: NonNullable<Viewer["affiliate"]> };

function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`Couldn't load ${what}: ${error.message}. Run supabase/diagnostics/00_health_check.sql (migration 013).`);
}

const asObject = (value: Json | undefined): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

export function toAccount(row: Tables<"affiliate_accounts"> | null, viewer: AffiliateViewer, application: { channel: string; channel_url: string }): AffiliateAccount {
  const name = displayName(viewer);
  const bank = asObject(row?.bank);
  const tax = asObject(row?.tax);
  const notifications = asObject(row?.notifications);
  const on = (key: string, fallback: boolean) => (typeof notifications[key] === "boolean" ? (notifications[key] as boolean) : fallback);
  return {
    id: "me",
    name: viewer.profile.fullName || name,
    email: viewer.email,
    website: row?.website ?? application.channel_url,
    channels: row?.channels ?? `${application.channel}: ${application.channel_url}`,
    payoutMethod: (row?.payout_method as PayoutMethod | undefined) ?? "paypal",
    paypalEmail: row?.paypal_email ?? viewer.email,
    mpesaPhone: row?.mpesa_phone ?? "",
    bank: { holder: str(bank.holder, viewer.profile.fullName), bankName: str(bank.bankName), account: str(bank.account), swift: str(bank.swift) },
    tax: { legalName: str(tax.legalName, viewer.profile.fullName), country: str(tax.country), taxId: str(tax.taxId) },
    notifications: { sale: on("sale", true), cleared: on("cleared", false), payout: on("payout", true), newAssets: on("newAssets", true), monthly: on("monthly", true) },
    codeRequest: row?.code_request ?? null,
    leaveRequestedAt: row?.leave_requested_at ?? null,
    updatedAt: row?.updated_at ?? new Date(0).toISOString(),
  };
}

export const getAffiliatePortal = cache(async (viewer: AffiliateViewer) => {
  const supabase = await createClient();
  const [settings, application, sales, signups, clicks, links, payouts, account] = await Promise.all([
    getSiteSettings(),
    supabase.from("affiliate_applications").select("code, commission, customer_discount, approved_at, channel, channel_url").eq("user_id", viewer.id).single(),
    supabase.rpc("my_affiliate_referrals"),
    supabase.rpc("my_affiliate_signups"),
    supabase.rpc("my_affiliate_clicks"),
    supabase.from("affiliate_links").select("*").eq("affiliate_id", viewer.id).order("created_at", { ascending: false }),
    supabase.from("affiliate_payouts").select("id, amount, method, period, created_at").eq("affiliate_id", viewer.id).order("created_at", { ascending: true }),
    supabase.from("affiliate_accounts").select("*").eq("affiliate_id", viewer.id).maybeSingle(),
  ]);
  fail("your affiliate details", application.error ?? sales.error ?? signups.error ?? clicks.error ?? links.error ?? payouts.error ?? account.error);
  const app = application.data!;

  const now = Date.now();
  const today = isoDay(now);
  const refundWindow = settings.payments.refundWindow;
  const linkBySub = new Map((links.data ?? []).map((l) => [l.sub, l.id]));

  // Sales, oldest first, with their commission status.
  const rows = [...(sales.data ?? [])].sort((a, b) => a.paid_at.localeCompare(b.paid_at));
  const referrals: Referral[] = rows.map((r) => {
    const clearsOn = isoDay(Date.parse(r.paid_at) + refundWindow * DAY);
    const status: ReferralStatus = r.status === "refunded" ? "refunded" : clearsOn > today ? "pending" : "approved";
    return {
      id: r.id,
      date: r.paid_at.slice(0, 10),
      customer: r.customer,
      country: r.country,
      plan: r.plan,
      kind: r.kind as Referral["kind"],
      sale: Number(r.amount),
      commission: r.status === "refunded" ? 0 : Number(r.commission),
      status,
      clearsOn,
      linkId: linkBySub.get(r.ref_sub) ?? "",
      usedCode: r.used_code,
    };
  });

  // Payouts cover cleared commission, oldest sales first.
  const payoutRows = payouts.data ?? [];
  const paidOut = round(payoutRows.reduce((s, p) => s + Number(p.amount), 0));
  const coveredBy = new Map<string, number>();
  let payoutIndex = 0;
  let left = payoutRows.length ? Number(payoutRows[0].amount) : 0;
  for (const r of referrals) {
    if (r.status !== "approved" || r.commission <= 0) continue;
    while (payoutIndex < payoutRows.length && left < r.commission - 0.005) {
      payoutIndex++;
      left += payoutIndex < payoutRows.length ? Number(payoutRows[payoutIndex].amount) : 0;
    }
    if (payoutIndex >= payoutRows.length) break;
    left = round(left - r.commission);
    r.status = "paid";
    coveredBy.set(r.id, payoutIndex);
  }

  const sum = (status: ReferralStatus) => round(referrals.filter((r) => r.status === status).reduce((s, r) => s + r.commission, 0));
  const lifetime = round(referrals.reduce((s, r) => s + r.commission, 0));
  const balance: PortalBalance = { pending: sum("pending"), approved: sum("approved"), owed: round(lifetime - paidOut), lifetime, paidOut };

  // This year, month by month, from the month they were approved.
  const year = new Date(now).getUTCFullYear();
  const thisMonth = new Date(now).getUTCMonth();
  const approvedAt = app.approved_at ? new Date(app.approved_at) : new Date(now);
  const firstMonth = approvedAt.getUTCFullYear() < year ? 0 : Math.min(approvedAt.getUTCMonth(), thisMonth);
  const inMonth = (iso: string, m: number) => iso.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`);
  const clickRows = clicks.data ?? [];
  const signupRows = signups.data ?? [];
  const monthly: MonthStat[] = MONTHS.map((month, m) => {
    if (m < firstMonth || m > thisMonth) return { month, clicks: null, signups: null, sales: null, earnings: null };
    const sold = referrals.filter((r) => inMonth(r.date, m) && r.status !== "refunded");
    return {
      month,
      clicks: clickRows.filter((c) => inMonth(c.day, m)).reduce((s, c) => s + c.clicks, 0),
      signups: signupRows.filter((s) => inMonth(s.created_at, m)).length,
      sales: sold.length,
      earnings: round(sold.reduce((s, r) => s + r.commission, 0)),
    };
  });

  const trackedLinks: TrackedLink[] = (links.data ?? []).map((l) => {
    const sold = referrals.filter((r) => r.linkId === l.id && r.status !== "refunded");
    return {
      id: l.id,
      label: l.label,
      path: l.path,
      sub: l.sub,
      createdAt: l.created_at.slice(0, 10),
      clicks: clickRows.filter((c) => c.sub === l.sub).reduce((s, c) => s + c.clicks, 0),
      sales: sold.length,
      earned: round(sold.reduce((s, r) => s + r.commission, 0)),
      updatedAt: l.created_at,
    };
  });

  const payoutList: AffiliatePayout[] = payoutRows
    .map((p, i) => ({
      id: `AP-${p.id.slice(0, 6).toUpperCase()}`,
      period: p.period || new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      date: p.created_at.slice(0, 10),
      amount: Number(p.amount),
      referrals: [...coveredBy.values()].filter((index) => index === i).length,
      method: p.method || "—",
      status: "paid" as const,
    }))
    .reverse();

  const affiliate: PortalAffiliate = {
    name: displayName(viewer),
    avatar: viewer.profile.avatarUrl,
    code: app.code ?? "",
    commission: app.commission,
    customerDiscount: app.customer_discount ?? settings.affiliates.customerDiscount,
    approvedAt: app.approved_at,
    clicks: clickRows.reduce((s, c) => s + c.clicks, 0),
    signups: signupRows.length,
    sales: referrals.filter((r) => r.status !== "refunded").length,
  };

  const program: ProgramTerms = {
    cookieDays: settings.affiliates.cookieDays,
    minPayout: settings.affiliates.minPayout,
    refundWindow,
    terms: settings.affiliates.terms,
    currency: settings.general.currency,
  };

  return {
    affiliate,
    referrals: referrals.reverse(),
    monthly,
    year,
    links: trackedLinks,
    payouts: payoutList,
    balance,
    program,
    account: toAccount(account.data, viewer, app),
  };
});

export type AffiliatePortal = Awaited<ReturnType<typeof getAffiliatePortal>>;
