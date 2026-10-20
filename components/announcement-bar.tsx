"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ANNOUNCE_STORAGE, announcementHref } from "@/lib/announcement";
import type { Announcement } from "@/lib/site-settings";
import { ArrowRightIcon, CloseIcon, WhatsappIcon } from "./icons";

/** A first-time visitor sees the page settle first, then the bar slides down. */
const ENTER_AFTER_MS = 700;
const SLIDE_MS = 550;

type State = "pending" | "open" | "closing" | "hidden";

const subscribeAttr = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-announce"],
  });
  return () => observer.disconnect();
};
/** Open, closed or waiting: kept on <html> (set before the bar is drawn, see announceBootScript). */
const useBarState = () =>
  useSyncExternalStore(
    subscribeAttr,
    () => (document.documentElement.getAttribute("data-announce") as State | null) ?? "pending",
    () => "pending" as State,
  );

function remember(patch: { seen?: string; closed?: string }) {
  try {
    const saved = JSON.parse(localStorage.getItem(ANNOUNCE_STORAGE) || "{}");
    localStorage.setItem(ANNOUNCE_STORAGE, JSON.stringify({ ...saved, ...patch }));
  } catch {}
}

/*
 * The bar above the menu: an offer or a message, one button, and a close.
 * Returning visitors see it in place from the first frame (nothing jumps);
 * a first visit gets it sliding down once the page has loaded. Closing
 * slides it away and keeps this announcement closed in this browser; a new
 * one shows again.
 */
export function AnnouncementBar({ announcement, phone, id }: { announcement: Announcement; phone: string; id: string }) {
  const state = useBarState();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    const now = root.getAttribute("data-announce");
    if (now === "hidden") return;
    if (now === "open") {
      remember({ seen: id });
      return;
    }
    // First visit: once the page has loaded and settled, slide down.
    const enter = () => {
      timer.current = window.setTimeout(() => {
        root.setAttribute("data-announce", "open");
        remember({ seen: id });
      }, ENTER_AFTER_MS);
    };
    if (document.readyState === "complete") enter();
    else window.addEventListener("load", enter, { once: true });
    return () => {
      window.removeEventListener("load", enter);
      window.clearTimeout(timer.current);
    };
  }, [id]);

  const hide = (save: boolean) => {
    const root = document.documentElement;
    root.setAttribute("data-announce", "closing");
    if (save) remember({ closed: id });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => root.setAttribute("data-announce", "hidden"), SLIDE_MS);
  };

  return (
    <div className="announce" data-style={announcement.style}>
      {/* inert while closed, so it's skipped by the keyboard and screen readers until it shows */}
      <div inert={state !== "open"}>
        <AnnouncementContent
          announcement={announcement}
          phone={phone}
          onClose={() => {
            hide(true);
            // Back to the top of the page for keyboard users.
            document.querySelector<HTMLElement>("header a")?.focus();
          }}
          onEnded={() => hide(false)}
        />
      </div>
    </div>
  );
}

const styles = {
  brand: {
    bar: "bg-[linear-gradient(90deg,#004d43_0%,#00845b_50%,#004d43_100%)] text-white",
    glow: "bg-[radial-gradient(60%_140%_at_50%_0%,rgb(255_255_255/0.16),transparent_70%)]",
    highlight: "text-accent-yellow",
    cta: "bg-white text-neutral-900 hover:bg-white/90 shadow-[0_4px_14px_-4px_rgb(0_0_0/0.4)]",
    chip: "bg-white/12 ring-1 ring-white/20 text-white",
    close: "text-white/75 hover:bg-white/15 hover:text-white",
    sheen: "via-white/25",
  },
  night: {
    bar: "bg-[#0b0d0c] text-white",
    glow: "bg-[radial-gradient(45%_160%_at_50%_0%,rgb(0_167_111/0.35),transparent_70%)]",
    highlight: "text-[#3ddc97]",
    cta: "bg-brand text-white hover:brightness-110 shadow-[0_4px_14px_-4px_rgb(0_167_111/0.6)]",
    chip: "bg-white/8 ring-1 ring-white/15 text-white",
    close: "text-white/70 hover:bg-white/10 hover:text-white",
    sheen: "via-white/15",
  },
  gold: {
    bar: "bg-[linear-gradient(90deg,#f5c400_0%,#ffd84d_50%,#f5c400_100%)] text-neutral-900",
    glow: "bg-[radial-gradient(60%_140%_at_50%_0%,rgb(255_255_255/0.45),transparent_70%)]",
    highlight: "font-extrabold underline decoration-2 underline-offset-4",
    cta: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-[0_4px_14px_-4px_rgb(0_0_0/0.45)]",
    chip: "bg-black/8 ring-1 ring-black/15 text-neutral-900",
    close: "text-neutral-900/70 hover:bg-black/10 hover:text-neutral-900",
    sheen: "via-white/50",
  },
} as const;

/*
 * What the bar shows, without the opening and closing: also the live preview
 * in Studio → Settings. Countdown (when it has an end date) · the message ·
 * the button · close.
 */
export function AnnouncementContent({ announcement: a, phone, onClose, onEnded }: { announcement: Announcement; phone: string; onClose?: () => void; onEnded?: () => void }) {
  const s = styles[a.style] ?? styles.brand;
  const cta = announcementHref(a, phone);

  return (
    <div role="region" aria-label="Announcement" className={`relative isolate overflow-hidden ${s.bar}`}>
      <div aria-hidden="true" className={`absolute inset-0 -z-10 ${s.glow}`} />
      {/* One soft sweep of light as it appears; never repeats. */}
      <div
        aria-hidden="true"
        className={`announce-sheen pointer-events-none absolute inset-y-0 -left-1/3 -z-10 w-1/3 -skew-x-12 bg-linear-to-r from-transparent ${s.sheen} to-transparent`}
      />

      <div className="site-container flex min-h-11 items-center justify-center gap-x-3 gap-y-1 py-1.5 pr-10 sm:min-h-12 sm:gap-x-4 sm:py-2 sm:pr-12">
        {a.endsAt && <Countdown endsAt={a.endsAt} chip={s.chip} onEnded={onEnded} />}

        <p className="min-w-0 text-xs leading-snug font-medium text-pretty sm:text-sm">
          {a.message}
          {a.highlight && (
            <>
              {" "}
              <span className={`font-bold whitespace-nowrap ${s.highlight}`}>{a.highlight}</span>
            </>
          )}
          {a.endsAt && <CountdownText endsAt={a.endsAt} />}
        </p>

        {cta && (
          <a
            href={cta.href}
            {...(cta.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className={`group inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold sm:h-8 sm:px-3.5 sm:text-[0.8125rem] whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none ${s.cta}`}
          >
            {cta.whatsapp && <WhatsappIcon className="size-3.5 sm:size-4" />}
            {a.ctaLabel}
            {!cta.whatsapp && <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />}
          </a>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close announcement"
          className={`absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition sm:right-3 ${s.close}`}
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

/* Ticks once a second in the browser; nothing on the server (no mismatch). */
function useNow(active: boolean) {
  return useSyncExternalStore(
    (onTick) => {
      if (!active) return () => {};
      const id = window.setInterval(onTick, 1000);
      return () => window.clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000) * 1000,
    () => null,
  );
}

function parts(endsAt: string, now: number) {
  const left = Math.max(0, Date.parse(endsAt) - now);
  return {
    left,
    days: Math.floor(left / 86_400_000),
    hours: Math.floor(left / 3_600_000) % 24,
    mins: Math.floor(left / 60_000) % 60,
    secs: Math.floor(left / 1000) % 60,
  };
}
const pad = (n: number) => String(n).padStart(2, "0");

/* Days, hours, minutes, seconds in boxes (from sm up), like the offer bars on big shops. */
function Countdown({ endsAt, chip, onEnded }: { endsAt: string; chip: string; onEnded?: () => void }) {
  const now = useNow(true);
  const p = now === null ? null : parts(endsAt, now);
  const ended = p?.left === 0;
  const done = useRef(false);

  // The offer is over: the bar goes (once).
  useEffect(() => {
    if (!ended || done.current) return;
    done.current = true;
    onEnded?.();
  }, [ended, onEnded]);

  const boxes: [string, number | null][] = [
    ["Days", p?.days ?? null],
    ["Hours", p?.hours ?? null],
    ["Mins", p?.mins ?? null],
    ["Secs", p?.secs ?? null],
  ];
  return (
    <div aria-hidden="true" className="hidden shrink-0 items-center gap-1 sm:flex">
      {boxes.map(([label, value]) => (
        <span key={label} className={`flex w-9 flex-col items-center rounded-md py-0.5 leading-none ${chip}`}>
          <span className="text-[0.8125rem] font-bold tabular-nums">{value === null ? "--" : pad(value)}</span>
          <span className="mt-0.5 text-[0.5625rem] font-medium tracking-wide opacity-75">{label}</span>
        </span>
      ))}
    </div>
  );
}

/* On phones (no boxes): "· ends in 2d 04:13:22". For screen readers everywhere: when it ends. */
function CountdownText({ endsAt }: { endsAt: string }) {
  const now = useNow(true);
  if (now === null) return null;
  const p = parts(endsAt, now);
  const clock = `${p.days ? `${p.days}d ` : ""}${pad(p.hours)}:${pad(p.mins)}:${pad(p.secs)}`;
  const when = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(Date.parse(endsAt));
  return (
    <>
      <span aria-hidden="true" className="font-semibold tabular-nums whitespace-nowrap opacity-90 sm:hidden">
        {" "}
        · ends in {clock}
      </span>
      <span className="sr-only"> Ends {when}.</span>
    </>
  );
}
