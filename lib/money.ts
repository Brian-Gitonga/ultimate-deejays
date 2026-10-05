/*
 * Money everywhere on the site is in one currency: Studio → Settings →
 * General → Currency (the one your Paystack account charges in). Kenyan
 * shillings are written the Kenyan way, "KSh 10,000"; other currencies use
 * their usual symbol ("$79", "€79").
 */

export const CURRENCIES = [
  { code: "KES", name: "Kenyan shilling", plural: "Kenyan shillings", symbol: "KSh" },
  { code: "USD", name: "US dollar", plural: "US dollars", symbol: "$" },
  { code: "NGN", name: "Nigerian naira", plural: "Nigerian naira", symbol: "₦" },
  { code: "ZAR", name: "South African rand", plural: "South African rand", symbol: "R" },
  { code: "EUR", name: "Euro", plural: "euros", symbol: "€" },
  { code: "GBP", name: "British pound", plural: "British pounds", symbol: "£" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["code"];

/** "Kenyan shillings (KSh)", for sentences like "Prices in …". */
export function currencyName(currency: string) {
  const c = CURRENCIES.find((x) => x.code === currency);
  return c ? `${c.plural} (${c.symbol})` : currency;
}

/** "KSh", "$", "€" (for input prefixes and short labels). */
export const currencySymbol = (currency: string) => CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;

/**
 * 10000 → "KSh 10,000", 79.5 → "$79.50". `decimals`: "auto" shows cents only
 * when there are some; 0 or 2 forces it.
 */
export function formatMoney(amount: number, currency: string, decimals: "auto" | 0 | 2 = "auto") {
  const digits = decimals === "auto" ? (Math.round(amount * 100) % 100 ? 2 : 0) : decimals;
  const number = Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sign = amount < 0 ? "-" : "";
  if (currency === "KES") return `${sign}KSh ${number}`;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    return `${sign}${currency} ${number}`;
  }
}

/** One currency's formatter, for tables and charts: money(10000) → "KSh 10,000". */
export const moneyFormatter = (currency: string, decimals: "auto" | 0 | 2 = "auto") => (amount: number) => formatMoney(amount, currency, decimals);

/** Chart axis labels: 12500 → "KSh 12.5k". */
export function compactMoney(amount: number, currency: string) {
  if (Math.abs(amount) < 1000) return formatMoney(amount, currency, 0);
  const symbol = currencySymbol(currency);
  const value = amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(amount % 1_000_000 ? 1 : 0)}M` : `${(amount / 1000).toFixed(amount % 1000 ? 1 : 0)}k`;
  return currency === "KES" ? `${symbol} ${value}` : `${symbol}${value}`;
}
