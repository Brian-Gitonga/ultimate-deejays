import type { Plan } from "./plans";

/*
 * Platform earnings: plan purchases (the payments table, written by the
 * Paystack webhook) and payouts to the business. Read for the studio by
 * lib/db/studio/payments.ts.
 */

/** free = a 100%-off coupon paid for the whole order */
export type PaymentMethod = "card" | "paypal" | "mobile_money" | "bank_transfer" | "free";

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  card: "Card",
  paypal: "PayPal",
  mobile_money: "Mobile money",
  bank_transfer: "Bank transfer",
  free: "Free (coupon)",
};
export type TransactionStatus = "paid" | "refunded";

export type Transaction = {
  id: string;
  customer: string;
  email: string;
  avatar: string | null;
  country: string;
  plan: Plan["slug"];
  /** "upgrade" = paid the difference to move up a plan */
  kind: "purchase" | "upgrade";
  amount: number;
  fee: number;
  method: PaymentMethod;
  /** Card brand + last digits, or the PayPal account */
  source: string;
  status: TransactionStatus;
  date: string;
  refundedAt: string | null;
  /** Referral code of the affiliate who referred the sale, if any */
  affiliate: string | null;
  /** Taken off the plan price at checkout, and the code that did it ("" = none) */
  discount: number;
  couponCode: string;
  currency: string;
  /** Sample row from scripts/demo-data.sql */
  isDemo: boolean;
  /** Paid through checkout with Paystack, so a refund goes back the same way */
  viaPaystack: boolean;
  commission: number;
  updatedAt: string;
};

export type Payout = { id: string; reference: string; amount: number; destination: string; status: "paid" | "in-transit"; date: string; period: string; isDemo: boolean };

// Card: 2.9% + $0.30; PayPal: 3.49% + $0.49; mobile money and bank: 1.5%.
export const processingFee = (amount: number, method: PaymentMethod) =>
  method === "free" ? 0 : Math.round((method === "card" ? amount * 0.029 + 0.3 : method === "paypal" ? amount * 0.0349 + 0.49 : amount * 0.015) * 100) / 100;

const round = (n: number) => Math.round(n * 100) / 100;

/** What we keep from a payment after fees, affiliate commission and refunds. */
export const netOf = (t: Pick<Transaction, "amount" | "fee" | "commission" | "status">) =>
  t.status === "refunded" ? -t.fee : round(t.amount - t.fee - t.commission);
