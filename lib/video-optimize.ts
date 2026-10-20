/*
 * Preview clips are re-encoded in the admin's browser before they upload, so
 * every visitor gets a small, quick-starting file whatever was exported:
 *
 * - at most 960×540 and 30 frames a second (cards are never bigger than that)
 * - about 1 Mbps H.264 MP4: ~1.25 MB per 10 seconds, plays on a 3G connection
 * - the file's index ("moov") at the front (fast start), so playback begins
 *   after the first chunk instead of after the whole download
 * - no audio (previews play muted), and at most 20 seconds
 *
 * Uses WebCodecs through Mediabunny, loaded only when a clip is picked.
 */

export const PREVIEW_ENCODING = { maxWidth: 960, maxHeight: 540, maxFrameRate: 30, bitrate: 1_000_000, maxSeconds: 20 };

export type OptimizedVideo = {
  file: File;
  /** false: this browser can't re-encode video, so the original is used */
  optimized: boolean;
  /** Cut to the first PREVIEW_ENCODING.maxSeconds */
  trimmed: boolean;
  before: number;
  after: number;
};

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Re-encodes a clip for fast previews. `onProgress` gets 0–1. Never throws for an unsupported browser: it returns the original. */
export async function optimizePreviewVideo(file: File, onProgress: (share: number) => void): Promise<OptimizedVideo> {
  const unchanged: OptimizedVideo = { file, optimized: false, trimmed: false, before: file.size, after: file.size };
  if (typeof window === "undefined" || typeof VideoEncoder === "undefined") return unchanged;

  const mb = await import("mediabunny");
  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error("That file has no video in it.");
    const duration = await input.computeDuration();

    // Fit inside 960×540 without ever making it bigger.
    const scale = Math.min(1, PREVIEW_ENCODING.maxWidth / track.displayWidth, PREVIEW_ENCODING.maxHeight / track.displayHeight);
    const width = even(track.displayWidth * scale);
    const height = even(track.displayHeight * scale);
    const { bitrate, maxFrameRate, maxSeconds } = PREVIEW_ENCODING;
    if (!(await mb.canEncodeVideo("avc", { width, height, bitrate }))) return unchanged;

    const stats = await track.computePacketStats(120).catch(() => null);
    const fast = (stats?.averagePacketRate ?? 0) > maxFrameRate + 1;
    const trimmed = duration > maxSeconds + 0.5;

    const target = new mb.BufferTarget();
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }), target });
    const conversion = await mb.Conversion.init({
      input,
      output,
      video: { width, height, fit: "contain", codec: "avc", bitrate, keyFrameInterval: 2, forceTranscode: true, ...(fast ? { frameRate: maxFrameRate } : {}) },
      audio: { discard: true },
      ...(trimmed ? { trim: { start: 0, end: maxSeconds } } : {}),
    });
    if (!conversion.isValid) return unchanged;
    conversion.onProgress = (share) => onProgress(Math.min(1, Math.max(0, share)));
    await conversion.execute();
    if (!target.buffer) return unchanged;

    const name = file.name.replace(/\.[a-z0-9]+$/i, "") + ".mp4";
    const result = new File([target.buffer], name, { type: "video/mp4" });
    return { file: result, optimized: true, trimmed, before: file.size, after: result.size };
  } finally {
    input.dispose();
  }
}
