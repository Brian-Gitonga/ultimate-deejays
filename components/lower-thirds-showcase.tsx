"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { planLabel, resourcePath, type StoreResource } from "@/lib/store";
import { ArrowRightIcon, PauseIcon, PlayIcon } from "./icons";
import { canAutoplayVideo, VideoLine } from "./store/hover-preview";
import { StoreCover } from "./store/store-cover";

/** A slide without a video (or when videos are off) stays this long. */
const STILL_MS = 6000;
/** A video that hasn't started by then is skipped (its thumbnail showed meanwhile). */
const GIVE_UP_MS = 9000;
/** Loading shows only after this, so a video that starts at once never flashes a loader. */
const LOADER_AFTER_MS = 250;

const noSubscribe = () => () => {};
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
 * The /lower-thirds hero: the lower thirds picked in Studio → Store, one at a
 * time in a 16:9 frame. Each one's preview video plays on its own (muted,
 * once), then the next comes in; its thumbnail shows until the video has
 * actually loaded, with the same loading line as the store's hover previews.
 * Without a video, or for people on data saver, 2G or reduced motion, the
 * thumbnails show instead. It pauses while the pointer is on it, while it's
 * off screen or the tab is hidden, and with the pause button.
 */
export function LowerThirdsShowcase({ items }: { items: StoreResource[] }) {
  const autoplay = useSyncExternalStore(noSubscribe, canAutoplayVideo, () => false);
  const stillMotion = useSyncExternalStore(noSubscribe, reducedMotion, () => false);
  const [index, setIndex] = useState(0);
  // Pause button; people who asked for less motion start paused.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? stillMotion;
  const [hovered, setHovered] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const halted = paused || hovered || !onScreen || !tabVisible;

  const [playing, setPlaying] = useState(false);
  // The current video has shown frames (a stall then keeps its last frame).
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [slow, setSlow] = useState(false);

  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const elapsed = useRef(0);
  // The slide showing, updated at once on a change (state catches up a frame later).
  const current = useRef(0);

  const item = items[index];
  const hasVideo = !!item?.previewVideo && autoplay && !failed.has(item.id);
  const single = items.length < 2;

  const go = (next: number) => {
    current.current = (next + items.length) % items.length;
    elapsed.current = 0;
    bars.current.forEach((bar, i) => bar && (bar.style.transform = `scaleX(${i < next ? 1 : 0})`));
    setPlaying(false);
    setShown(false);
    setIndex((next + items.length) % items.length);
  };
  const advance = () => go(index + 1);

  // Pause when scrolled out of view or the tab is hidden: no video playing for nobody.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Play or pause the current video with the carousel.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (halted) v.pause();
    else v.play().catch(() => {});
  }, [halted, index, hasVideo]);

  // The loader, only once loading has taken a moment.
  useEffect(() => {
    if (!hasVideo || playing) return;
    const timer = window.setTimeout(() => setSlow(true), LOADER_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [hasVideo, playing, index]);

  // The clock: fills the current progress segment and moves on.
  useEffect(() => {
    if (halted || single) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      // A frame left over from the slide before: ignore it.
      if (current.current !== index) return;
      elapsed.current += now - last;
      last = now;
      const v = video.current;
      let share: number;
      if (hasVideo && shown && v && v.duration && Number.isFinite(v.duration)) share = v.currentTime / v.duration;
      else if (hasVideo && !shown) share = 0;
      else share = elapsed.current / STILL_MS;
      const bar = bars.current[index];
      if (bar) bar.style.transform = `scaleX(${Math.min(1, share)})`;
      // A still is done after STILL_MS; a video that never started, after GIVE_UP_MS.
      if ((!hasVideo && elapsed.current >= STILL_MS) || (hasVideo && !shown && elapsed.current >= GIVE_UP_MS)) return advance();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [halted, single, index, hasVideo, shown]);

  if (!item) return null;
  const next = items[(index + 1) % items.length];
  const href = resourcePath(item.slug, item.lowerThird);
  const free = item.access === "warm-up";
  // Paused on purpose (button, pointer, off screen) isn't loading.
  const loading = hasVideo && slow && !playing && !halted;

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Featured lower thirds" className="w-full">
      <div
        ref={frame}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)] ring-1 ring-black/[0.06] dark:ring-white/10"
      >
        {/* The thumbnail: shown at once (it's the page's main image), and while the video loads. */}
        <div key={`cover-${item.id}`} className="absolute inset-0 motion-safe:animate-fade-in">
          <StoreCover resource={item} priority={index === 0} sizes="(min-width: 1024px) 58vw, 100vw" titled={false} />
        </div>

        {hasVideo && (
          <video
            key={item.id}
            ref={video}
            src={item.previewVideo}
            muted
            playsInline
            autoPlay={!halted}
            // A single item loops; otherwise the next one comes in when it ends.
            loop={single}
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => {
              setPlaying(true);
              setShown(true);
            }}
            onWaiting={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onEnded={() => !single && advance()}
            onError={() => setFailed((f) => new Set(f).add(item.id))}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {/* The next clip's first bytes (its index and opening frames), so it starts straight away. */}
        {!single && autoplay && next.previewVideo && next.id !== item.id && !failed.has(next.id) && (
          <video key={`next-${next.id}`} src={next.previewVideo} muted preload="metadata" aria-hidden="true" tabIndex={-1} className="hidden" />
        )}

        {/* Loading: the line along the bottom, and a small label. */}
        <VideoLine loading={loading} playing={false} />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-3 right-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-xs font-medium text-white backdrop-blur-sm transition-opacity duration-200 ${loading ? "opacity-100" : "opacity-0"}`}
        >
          <span className="size-3 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white motion-reduce:animate-none" />
          Loading preview
        </span>

        {/* What's on screen, and the way to it. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/30 to-transparent px-4 pt-16 pb-4 sm:px-5 sm:pb-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <span className={`inline-block rounded px-1.5 py-0.5 text-[0.6875rem] leading-4 font-semibold ${free ? "bg-brand text-white" : "bg-white/20 text-white backdrop-blur-sm"}`}>
                {free ? "Free" : planLabel(item.access)}
              </span>
              <p aria-live={halted ? "polite" : "off"} className="mt-1.5 truncate text-base font-semibold text-white sm:text-lg">
                {item.title}
              </p>
            </div>
            <Link
              href={href}
              className="pointer-events-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
            >
              View <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {!single && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setUserPaused(!paused)}
            aria-label={paused ? "Play the carousel" : "Pause the carousel"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-foreground/5"
          >
            {paused ? <PlayIcon className="size-3.5" /> : <PauseIcon className="size-3.5" />}
          </button>
          <ol className="flex min-w-0 flex-1 gap-1.5">
            {items.map((it, i) => (
              <li key={it.id} className="min-w-0 flex-1">
                <button type="button" onClick={() => go(i)} aria-label={`Show ${it.title}`} aria-current={i === index ? "true" : undefined} className="group/seg block w-full py-2">
                  <span className="block h-1 overflow-hidden rounded-full bg-foreground/15 transition group-hover/seg:bg-foreground/25">
                    <span
                      ref={(el) => {
                        bars.current[i] = el;
                      }}
                      className="block h-full origin-left rounded-full bg-brand"
                      style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
                    />
                  </span>
                  <span className={`mt-1.5 hidden truncate text-left text-xs sm:block ${i === index ? "font-medium text-foreground" : "text-muted-foreground"}`}>{it.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
