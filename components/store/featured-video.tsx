"use client";

import { useEffect, useRef, useState } from "react";
import { canPreviewVideo, VideoLine } from "./hover-preview";

/** Loading shows only after this, so a clip that starts at once never flashes a loader. */
const LOADER_AFTER_MS = 250;

/*
 * A resource's preview clip at the top of its page, over the thumbnail. With
 * a mouse on a decent connection it plays straight away (muted, looping); on
 * phones, slow connections, data saver or reduced motion it waits for a tap,
 * downloading nothing but its first frames until then. Controls let anyone
 * pause or go full screen. While it's waiting for video, a line sweeps along
 * the top edge (the controls have the bottom).
 */
export function FeaturedVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Asked to play (autoplay or a tap) but no video to show yet.
  const [waiting, setWaiting] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (canPreviewVideo()) ref.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setSlow(true), LOADER_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [waiting]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster || undefined}
        muted
        loop
        playsInline
        controls
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noremoteplayback"
        preload="metadata"
        aria-label={`Preview of ${title}`}
        onPlay={() => setWaiting(true)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onPause={() => setWaiting(false)}
        onError={() => setWaiting(false)}
        className="absolute inset-0 size-full bg-black object-contain"
      />
      <VideoLine loading={waiting && slow} playing={false} edge="top" />
      <span role="status" className="sr-only">
        {waiting && slow ? "Loading the preview" : ""}
      </span>
    </>
  );
}
