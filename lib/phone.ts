/*
 * Phone numbers members give for their edits, kept in international format
 * (+254712345678). Kenyan numbers can be typed the local way.
 */

const KENYA = "254";

/**
 * "0712 345 678", "712345678", "254712345678" or "+254 712 345 678" →
 * "+254712345678". Other countries need their + code. null = not a number.
 */
export function normalizePhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return "";
  let digits = raw.replace(/[\s().-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("+")) {
    const rest = digits.slice(1);
    return /^[1-9]\d{6,14}$/.test(rest) ? `+${rest}` : null;
  }
  if (!/^\d+$/.test(digits)) return null;
  // Kenya: 07xx / 01xx (10 digits), 7xx / 1xx (9 digits), 254… (12 digits).
  if (/^0[17]\d{8}$/.test(digits)) return `+${KENYA}${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `+${KENYA}${digits}`;
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

/** "+254712345678" → "+254 712 345 678" (other countries are left as they are). */
export function formatPhone(phone: string) {
  const kenyan = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return kenyan ? `+254 ${kenyan[1]} ${kenyan[2]} ${kenyan[3]}` : phone;
}
