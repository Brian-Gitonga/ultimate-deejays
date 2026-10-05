/*
 * Phone numbers typed the Kenyan way ("0114 669 532", "+254 114 669 532")
 * become dialling and WhatsApp links. The number in Studio → Settings →
 * Contact is also the WhatsApp number.
 */

/** "0114 669 532" → "254114669532". Other countries need the full international number. */
export function phoneDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

export const telHref = (phone: string) => (phoneDigits(phone) ? `tel:+${phoneDigits(phone)}` : "");

export const whatsappHref = (phone: string, message = "Hi Ultimate Deejays, I have a question.") =>
  phoneDigits(phone) ? `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(message)}` : "";
