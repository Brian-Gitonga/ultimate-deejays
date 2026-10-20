import type { Announcement } from "./site-settings";

/*
 * The announcement bar above the menu (Studio → Settings → Announcement bar).
 * Shared by the bar, its preview in the studio and the server.
 */

/** Where people go after closing it is remembered: per announcement, in this browser. */
export const ANNOUNCE_STORAGE = "ud-announce";

/**
 * A short id for what the bar says. Closing hides that announcement only: a
 * new message, button or end date shows again, even to people who closed
 * the last one.
 */
export function announcementKey(a: Announcement) {
  const text = [a.message, a.highlight, a.ctaLabel, a.ctaKind, a.ctaLink, a.whatsappText, a.endsAt].join("|");
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/** Switched on, with something to say, and not past its end. */
export const announcementLive = (a: Announcement, now: number) => a.enabled && !!a.message.trim() && !(a.endsAt && Date.parse(a.endsAt) <= now);

/** The button's target: a WhatsApp chat with the site's number, or the link. null = no button. */
export function announcementHref(a: Announcement, phone: string): { href: string; external: boolean; whatsapp: boolean } | null {
  if (!a.ctaLabel.trim()) return null;
  if (a.ctaKind === "whatsapp") {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    return {
      href: `https://wa.me/${digits}${a.whatsappText.trim() ? `?text=${encodeURIComponent(a.whatsappText.trim())}` : ""}`,
      external: true,
      whatsapp: true,
    };
  }
  if (!a.ctaLink.trim()) return null;
  return {
    href: a.ctaLink.trim(),
    external: /^https?:\/\//.test(a.ctaLink.trim()),
    whatsapp: false,
  };
}

/**
 * Runs before the bar is drawn (inline, right above it), so a returning
 * visitor never sees it jump: hidden if they closed this announcement or it
 * has ended, already open if they've seen it, and for a first visit left
 * closed for the bar to slide down once the page has loaded.
 */
export const announceBootScript = (key: string, endsAt: string) =>
  `(function(){try{var d=document.documentElement,s=JSON.parse(localStorage.getItem(${JSON.stringify(ANNOUNCE_STORAGE)})||"{}");` +
  `if(s.closed===${JSON.stringify(key)}||(${JSON.stringify(endsAt)}&&Date.parse(${JSON.stringify(endsAt)})<=Date.now())||matchMedia("print").matches){d.setAttribute("data-announce","hidden")}` +
  `else if(s.seen===${JSON.stringify(key)}){d.setAttribute("data-announce","open")}}catch(e){document.documentElement.setAttribute("data-announce","open")}})()`;
