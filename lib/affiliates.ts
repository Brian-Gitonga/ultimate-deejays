/*
 * Affiliate program: an application (affiliate_applications) plus stats rolled
 * up from referral clicks, sign-ups, payments and payouts (the
 * affiliate_overview view). Studio → Affiliates reads it via lib/db/studio/affiliates.ts.
 */

export type AffiliateStatus = "pending" | "approved" | "paused" | "rejected";

export type Affiliate = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  /** Where they'll promote us */
  channel: string;
  channelUrl: string;
  audience: number;
  pitch: string;
  status: AffiliateStatus;
  appliedAt: string;
  approvedAt: string | null;
  /** Commission on each referred sale, in % */
  commission: number;
  code: string;
  clicks: number;
  signups: number;
  sales: number;
  /** Referred revenue, USD */
  revenue: number;
  /** Lifetime commission, USD */
  earned: number;
  paidOut: number;
  note: string;
  /** % off buyers get with their code or link; null = the default in Studio → Settings */
  customerDiscount: number | null;
  /** Where they want payouts sent, e.g. "M-Pesa · +254 712 345 678" ("" = not set yet) */
  payoutTo: string;
  /** A different referral code they asked for */
  codeRequest: string | null;
  /** When they asked to leave the program */
  leaveRequestedAt: string | null;
  updatedAt: string;
};

export type AffiliateApplication = Omit<Affiliate, "sales" | "revenue" | "earned" | "paidOut" | "updatedAt">;

export const balanceOf = (x: Pick<Affiliate, "earned" | "paidOut">) => Math.round((x.earned - x.paidOut) * 100) / 100;

export const affiliateStatusLabel: Record<AffiliateStatus, string> = {
  pending: "Pending",
  approved: "Active",
  paused: "Paused",
  rejected: "Declined",
};
