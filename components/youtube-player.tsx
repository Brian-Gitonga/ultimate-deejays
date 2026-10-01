"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/*
 * A lightweight YouTube embed: shows the video's thumbnail with a play button
 * and only loads YouTube's player when asked, which keeps the page fast and
 * avoids YouTube cookies until then (youtube-nocookie.com). It listens to the
 * player's postMessage events to know when a video ends.
 */
export function YouTubePlayer({
  videoId,
  title,
  autoplay,
  onEnded,
  onPlay,
  label = "Watch lesson",
}: {
  videoId: string;
  title: string;
  /** Start playing immediately (after the viewer has already pressed play once) */
  autoplay?: boolean;
  onEnded?: () => void;
  /** The viewer pressed play, so later lessons can start automatically */
  onPlay?: () => void;
  /** Small caption above the title on the cover */
  label?: string;
}) {
  const [active, setActive] = useState(autoplay ?? false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    if (!active) return;
    function onMessage(event: MessageEvent) {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(event.origin)) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        const state = data?.event === "onStateChange" ? data.info : data?.info?.playerState;
        if (state === 0) onEndedRef.current?.(); // 0 = ended
      } catch {
        // Not a player message.
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active]);

  // Ask the player to start sending state events.
  function subscribeToPlayer() {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: videoId, channel: "widget" }), "*");
  }

  if (active) {
    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      enablejsapi: "1",
      origin: window.location.origin,
    });
    return (
      <iframe
        ref={frameRef}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
        title={title}
        onLoad={subscribeToPlayer}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setActive(true);
        onPlay?.();
      }}
      aria-label={`${label}: ${title}`}
      className="group absolute inset-0 size-full cursor-pointer overflow-hidden text-left"
    >
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="object-cover opacity-60 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-70"
        loading="eager"
        fetchPriority="high"
      />
      <span className="absolute inset-0 bg-linear-to-t from-neutral-950/90 via-neutral-950/30 to-neutral-950/50" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand text-white shadow-[0_0_0_0.75rem_rgb(0_167_111/0.25)] transition group-hover:scale-110 sm:size-20">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 size-7 sm:size-8" fill="currentColor">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.94-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
          </svg>
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <span className="block text-sm text-white/70">{label}</span>
        <span className="mt-1 line-clamp-2 block text-lg font-semibold text-white sm:text-2xl">{title}</span>
      </span>
    </button>
  );
}
