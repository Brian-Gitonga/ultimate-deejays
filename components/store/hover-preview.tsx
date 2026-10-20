"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type Ref } from "react";
import { PlayIcon } from "../icons";

/** Resting this long on a card starts loading its clip (so sweeping across the grid loads nothing)… */
const WARM_MS = 80;
/** …and this long plays it. The gap is a head start for the first bytes. */
const PLAY_MS = 220;
/** A clip not hovered for this long is let go, so a long grid doesn't keep dozens of videos open. Hovering again plays it from the browser's cache. */
const RELEASE_MS = 10_000;
/** Loading shows only after this, so a clip that starts at once (cached) never flashes a loader. */
const LOADER_AFTER_MS = 250;

type Connection = { saveData?: boolean; effectiveType?: string };

/**
 * Hover previews are for a mouse, and not for people who asked for less
 * motion, turned on data saver, or are on a very slow (2G) connection: they
 * keep the thumbnail.
 */
export function canPreviewVideo() {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  const slow = connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !slow;
}

/**
 * Videos that play on their own (the /lower-thirds hero), on any screen: not
 * for people who asked for less motion, turned on data saver, or are on 2G.
 */
export function canAutoplayVideo() {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  const slow = connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !slow;
}

const noSubscribe = () => () => {};
/** Whether this visitor gets hover previews; false on the server and until the page is interactive. */
const usePreviewable = () => useSyncExternalStore(noSubscribe, canPreviewVideo, () => false);

/** true once `active` has stayed true for `ms` (and false again as soon as it isn't). */
function useAfter(active: boolean, ms: number) {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setElapsed(true), ms);
    return () => {
      window.clearTimeout(timer);
      setElapsed(false);
    };
  }, [active, ms]);
  return active && elapsed;
}

/**
 * Where a card's preview is: "idle" (not hovered), "starting" (hovered, the
 * first moment), "loading" (still waiting for video, or stalled while
 * playing), "playing", or "failed" (the clip couldn't load: the thumbnail
 * just stays).
 */
export type PreviewStatus = "idle" | "starting" | "loading" | "playing" | "failed";

/**
 * Hover-to-play for a cover with a preview clip, like Envato's grid: spread
 * `handlers` on the card, render <HoverVideo {...video} /> over the thumbnail
 * and, if you like, <PreviewBadge status={status} />. Nothing loads until
 * someone rests on the card.
 */
export function useHoverPreview(src: string) {
  const [started, setStarted] = useState(false);
  const [wanted, setWanted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  // It has shown video since it was loaded: a stall then keeps the last frame (with the loading line) instead of going back to the thumbnail.
  const [shown, setShown] = useState(false);
  const timers = useRef<number[]>([]);
  const release = useRef<number | undefined>(undefined);
  const slow = useAfter(wanted && !playing && !failed, LOADER_AFTER_MS);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(
    () => () => {
      clear();
      window.clearTimeout(release.current);
    },
    [],
  );

  const handlers = {
    onPointerEnter: (event: PointerEvent) => {
      if (!src || failed || event.pointerType !== "mouse" || !canPreviewVideo()) return;
      clear();
      window.clearTimeout(release.current);
      timers.current = [window.setTimeout(() => setStarted(true), WARM_MS), window.setTimeout(() => setWanted(true), PLAY_MS)];
    },
    onPointerLeave: () => {
      clear();
      setWanted(false);
      window.clearTimeout(release.current);
      release.current = window.setTimeout(() => {
        setStarted(false);
        setPlaying(false);
        setShown(false);
      }, RELEASE_MS);
    },
  };

  const status: PreviewStatus = !src ? "idle" : failed ? "failed" : !wanted ? "idle" : playing ? "playing" : slow ? "loading" : "starting";
  return { handlers, status, video: {
      src,
      wanted,
      started,
      playing,
      shown,
      loading: slow,
      onPlayingChange: (now: boolean) => {
        setPlaying(now);
        if (now) setShown(true);
      },
      onFail: () => setFailed(true),
    },
  };
}

/*
 * A thin line along the cover's edge. Loading: a highlight sweeps along it,
 * and the part already downloaded fills in. Playing: it's the clip's
 * progress, with what's downloaded ahead shown faintly (as on YouTube).
 */
export function VideoLine({
  loading,
  playing,
  playedRef,
  bufferedRef,
  edge = "bottom",
}: {
  loading: boolean;
  playing: boolean;
  playedRef?: Ref<HTMLSpanElement>;
  bufferedRef?: Ref<HTMLSpanElement>;
  edge?: "top" | "bottom";
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-[2] h-[3px] overflow-hidden bg-black/50 transition-opacity duration-200 ${edge === "top" ? "top-0" : "bottom-0"} ${loading || playing ? "opacity-100" : "opacity-0"}`}
    >
      <span ref={bufferedRef} className="absolute inset-0 origin-left scale-x-0 bg-white/45 transition-transform duration-500 ease-out" />
      <span ref={playedRef} className={`absolute inset-0 origin-left scale-x-0 bg-brand transition-[transform,opacity] duration-300 ease-linear ${playing ? "opacity-100" : "opacity-0"}`} />
      {loading && <span className="absolute inset-y-0 left-0 w-1/2 animate-sweep bg-linear-to-r from-transparent via-brand to-transparent motion-reduce:animate-none" />}
    </span>
  );
}

/** How much of the clip, from where it's playing, is downloaded (0–1). */
function bufferedShare(video: HTMLVideoElement) {
  if (!video.duration || !Number.isFinite(video.duration)) return 0;
  let end = 0;
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= video.currentTime + 0.25) end = Math.max(end, video.buffered.end(i));
  }
  return Math.min(1, end / video.duration);
}

/* The clip over the thumbnail: fades in once it's actually playing, with the line along the bottom. */
export function HoverVideo({
  src,
  wanted,
  started,
  playing,
  shown,
  loading,
  onPlayingChange,
  onFail,
}: ReturnType<typeof useHoverPreview>["video"]) {
  const ref = useRef<HTMLVideoElement>(null);
  const played = useRef<HTMLSpanElement>(null);
  const buffered = useRef<HTMLSpanElement>(null);

  // Play while the mouse rests on the card; back to the start when it leaves.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (wanted) {
      video.play().catch(() => {});
    } else {
      video.pause();
      if (video.currentTime) video.currentTime = 0;
    }
  }, [wanted, started]);

  if (!src || !started) return null;

  // Straight to the elements, not through React: these fire many times a second.
  const measure = (video: HTMLVideoElement) => {
    if (!video.duration || !Number.isFinite(video.duration)) return;
    if (played.current) played.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
    if (buffered.current) buffered.current.style.transform = `scaleX(${bufferedShare(video)})`;
  };

  return (
    <>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        // Only the start of the file (its index and first frames) until it's asked to play.
        preload={wanted ? "auto" : "metadata"}
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        // Ran out of downloaded video mid-play: loading again.
        onWaiting={() => onPlayingChange(false)}
        onError={onFail}
        onLoadedMetadata={(e) => measure(e.currentTarget)}
        onProgress={(e) => measure(e.currentTarget)}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          if (!video.paused && !playing && video.readyState >= 3) onPlayingChange(true);
          measure(video);
        }}
        className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300 ${wanted && shown ? "opacity-100" : "opacity-0"}`}
      />
      {wanted && <VideoLine loading={loading} playing={playing} playedRef={played} bufferedRef={buffered} />}
    </>
  );
}

/*
 * Tells people a cover moves: "▶ Preview" at rest, a spinner while the clip
 * loads, gone while it plays. Only for visitors who get hover previews.
 * `compact`: just the icon, for small tiles.
 */
export function PreviewBadge({ status, compact = false, className = "" }: { status: PreviewStatus; compact?: boolean; className?: string }) {
  const previewable = usePreviewable();
  if (!previewable || status === "failed") return null;
  const loading = status === "loading";
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-flex items-center gap-1 rounded-full bg-black/60 text-[0.6875rem] font-medium text-white backdrop-blur-sm transition-opacity duration-200 ${
        compact ? "size-5 justify-center" : "h-6 px-2"
      } ${status === "playing" ? "opacity-0" : "opacity-100"} ${className}`}
    >
      {loading ? (
        <span className="size-2.5 shrink-0 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white motion-reduce:animate-none" />
      ) : (
        <PlayIcon className={compact ? "size-2.5" : "size-3"} />
      )}
      {!compact && (loading ? "Loading" : "Preview")}
    </span>
  );
}
