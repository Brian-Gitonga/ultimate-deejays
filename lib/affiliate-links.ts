import { siteUrl } from "./site";

/* Client-safe helpers for the affiliate portal: referral URLs and the affiliate's own account settings. */

export function referralUrl(code: string, path = "/", sub?: string) {
  const url = new URL(path, siteUrl);
  url.searchParams.set("ref", code);
  if (sub) url.searchParams.set("sub", sub);
  return url.toString();
}

/** "https://site.com/?ref=X" -> "site.com/?ref=X" for display. */
export const prettyUrl = (url: string) => url.replace(/^https?:\/\//, "");

export const toSub = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

export type PayoutMethod = "paypal" | "mpesa" | "bank";

export type AffiliateAccount = {
  id: "me";
  /** From their account profile, for display (edited in Account → Profile / Settings) */
  name: string;
  email: string;
  website: string;
  channels: string;
  payoutMethod: PayoutMethod;
  paypalEmail: string;
  mpesaPhone: string;
  bank: { holder: string; bankName: string; account: string; swift: string };
  tax: { legalName: string; country: string; taxId: string };
  notifications: { sale: boolean; cleared: boolean; payout: boolean; newAssets: boolean; monthly: boolean };
  codeRequest: string | null;
  /** Asked to leave the program (the studio sees it) */
  leaveRequestedAt: string | null;
  updatedAt: string;
};

/** Last day of the month `today` falls in, when cleared commission is paid. */
export function nextPayoutDate(today: string) {
  const [y, m] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
