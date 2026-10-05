/*
 * Course curricula: the lesson shape the player renders, plus YouTube helpers.
 * Lessons live in the database (course_sections, course_lessons) and are
 * edited in Studio → Courses. Paste any form of YouTube URL (watch?v=,
 * youtu.be/, /embed/, /shorts/) or a bare video ID.
 *
 * The public curriculum has no video links: the player asks the server for
 * each lesson's video (openLesson), which checks the student's plan.
 */

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  durationSeconds: number;
  /** Watchable by any signed-in student, whatever their plan (free preview) */
  preview?: boolean;
  /** Channel credit for videos you didn't make; leave empty for your own */
  source?: string;
};

export type CurriculumSection = { title: string; lessons: Lesson[] };

export type LessonResource = { id: string; label: string; url: string };

/** The video ID from any YouTube link (or a bare 11-character ID). */
export function youtubeId(link: string): string | null {
  const bare = /^[\w-]{11}$/;
  if (bare.test(link)) return link;
  try {
    const url = new URL(link);
    if (url.hostname === "youtu.be") return url.pathname.slice(1, 12) || null;
    const v = url.searchParams.get("v");
    if (v && bare.test(v)) return v;
    const match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** 1126 -> "18:46", 2485 -> "41:25", 4000 -> "1:06:40" */
export function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
