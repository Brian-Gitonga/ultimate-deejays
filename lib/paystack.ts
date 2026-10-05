import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { paystackEnv } from "@/lib/env.server";

/*
 * Server-side Paystack API access. Amounts are always in the currency's
 * subunit (kobo, cents), so use toSubunit() when sending prices.
 * API reference: https://paystack.com/docs/api/
 */

const API = "https://api.paystack.co";

type PaystackEnvelope<T> = { status: boolean; message: string; data: T };

/** Calls the Paystack API and returns `data`, or throws with Paystack's message. */
export async function paystack<T>(path: string, init: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: {
      Authorization: `Bearer ${paystackEnv().PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const json = (await response.json().catch(() => null)) as PaystackEnvelope<T> | null;
  if (!response.ok || !json?.status) {
    throw new Error(`Paystack ${path} failed (${response.status}): ${json?.message ?? "no response body"}`);
  }
  return json.data;
}

/** Checks the x-paystack-signature header: an HMAC-SHA512 of the raw body, keyed with the secret key. */
export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha512", paystackEnv().PAYSTACK_SECRET_KEY).update(rawBody).digest("hex"));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** 49.99 → 4999. Paystack rejects fractional amounts. */
export const toSubunit = (amount: number) => Math.round(amount * 100);

/** True when a real-looking secret key is set (checkout can take payments). */
export const isPaystackConfigured = () => /^sk_(test|live)_\w{10,}/.test(process.env.PAYSTACK_SECRET_KEY ?? "");

export type PaystackTransaction = {
  id: number;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "queued" | "reversed";
  reference: string;
  /** In the currency's subunit. Includes Paystack's fee when it's passed on to the customer… */
  amount: number;
  /** …so this is what the order asked for. */
  requested_amount?: number | null;
  fees: number | null;
  currency: string;
  channel: string;
  paid_at: string | null;
  gateway_response: string;
  customer: { email: string };
  authorization: {
    card_type?: string | null;
    brand?: string | null;
    last4?: string | null;
    bank?: string | null;
    country_code?: string | null;
    mobile_money_number?: string | null;
  } | null;
};

/** Starts a payment and returns the page to send the buyer to. */
export function initializeTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return paystack<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    body: {
      email: input.email,
      amount: toSubunit(input.amount),
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    },
  });
}

export const verifyTransaction = (reference: string) => paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** How the payment shows in Studio → Earnings: method, "Visa •••• 4242", country. */
export function describePayment(tx: PaystackTransaction) {
  const auth = tx.authorization ?? {};
  const method =
    tx.channel === "mobile_money"
      ? ("mobile_money" as const)
      : ["bank", "bank_transfer", "ussd", "eft", "dedicated_nuban"].includes(tx.channel)
        ? ("bank_transfer" as const)
        : ("card" as const);
  const brand = (auth.brand || auth.card_type || "Card").trim();
  const source =
    method === "card"
      ? `${brand.charAt(0).toUpperCase()}${brand.slice(1)}${auth.last4 ? ` •••• ${auth.last4}` : ""}`
      : method === "mobile_money"
        ? `${auth.bank || "Mobile money"}${auth.mobile_money_number ? ` ${auth.mobile_money_number.slice(0, 4)}…` : auth.last4 ? ` •••• ${auth.last4}` : ""}`
        : auth.bank || "Bank transfer";
  let country = "";
  try {
    country = auth.country_code ? (regionNames.of(auth.country_code.toUpperCase()) ?? "") : "";
  } catch {
    country = "";
  }
  // The order total, even when the customer also paid Paystack's fee on top.
  const amount = (tx.requested_amount ?? tx.amount) / 100;
  return { method, source, country, fee: (tx.fees ?? 0) / 100, amount, paidAt: tx.paid_at };
}
