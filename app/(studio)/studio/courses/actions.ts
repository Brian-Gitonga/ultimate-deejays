"use server";

import { youtubeId } from "@/lib/curriculum";

export type VideoInfo =
  | { ok: true; videoId: string; title: string; channel: string; durationSeconds: number | null }
  | { ok: false; error: string };

/*
 * Looks up a YouTube video's title, channel and length so instructors only
 * have to paste a link. oEmbed confirms the video exists and can be embedded;
 * the length is read from the watch page when YouTube provides it.
 */
export async function inspectYouTube(link: string): Promise<VideoInfo> {
  const videoId = youtubeId(link.trim());
  if (!videoId) return { ok: false, error: "That isn't a YouTube link. Copy it from the video's Share button." };

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (oembed.status === 401 || oembed.status === 403) {
      return { ok: false, error: "This video doesn't allow embedding. Turn on embedding in YouTube Studio, or use another video." };
    }
    if (!oembed.ok) return { ok: false, error: "We couldn't find that video. It may be private or deleted." };
    const meta = (await oembed.json()) as { title?: string; author_name?: string };

    let durationSeconds: number | null = null;
    try {
      const page = await fetch(watchUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { "Accept-Language": "en", "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      });
      const match = (await page.text()).match(/"lengthSeconds":"(\d+)"/);
      if (match) durationSeconds = Number(match[1]);
    } catch {
      // Length is a nice-to-have; the instructor can type it in.
    }

    return { ok: true, videoId, title: meta.title ?? "", channel: meta.author_name ?? "", durationSeconds };
  } catch {
    return { ok: false, error: "YouTube didn't respond. Check your connection and try again." };
  }
}
