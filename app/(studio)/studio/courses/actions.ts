"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { isUuid } from "@/lib/action-result";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { getViewer } from "@/lib/dal";
import { getStudioCourse, toSavePayload } from "@/lib/db/studio/courses";
import { youtubeId } from "@/lib/curriculum";
import { adminAction, must, StudioError } from "@/lib/studio-action";
import { checklist, type StudioCourse } from "@/lib/studio-courses";

/* ── Save and delete ─────────────────────────────────────────────────────── */

const text = (max: number) => z.string().max(max);
const lessonSchema = z.object({
  id: z.string().min(1).max(120),
  slug: z.string().max(100).optional(),
  title: text(150),
  youtube: text(300),
  durationSeconds: z.number().min(0).max(24 * 3600),
  summary: text(2000),
  preview: z.boolean(),
  resources: z.array(z.object({ id: z.string().max(60), label: text(120), url: text(500) })).max(20),
  source: text(120).optional(),
});

// Lenient enough for half-written drafts (autosave), strict about what the database would reject.
const courseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The course URL can only use lowercase letters, numbers and dashes.").max(80),
  title: text(120),
  subtitle: text(300),
  description: text(20000),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "All Levels"]),
  access: z.enum(["warm-up", "resident", "headliner"]),
  status: z.enum(["draft", "review", "published"]),
  outcomes: z.array(text(300)).max(30),
  requirements: z.array(text(300)).max(30),
  audience: z.array(text(300)).max(30),
  sections: z.array(z.object({ id: z.string().min(1).max(120), title: text(120), lessons: z.array(lessonSchema).max(200) })).max(100),
  instructorId: z.string().uuid().nullable(),
});

/** Creates or updates a course with its whole curriculum (one transaction, see save_course in migration 004). */
export async function saveCourse(course: StudioCourse): Promise<ActionResult<StudioCourse>> {
  return adminAction(
    "save the course",
    async ({ supabase }) => {
      const parsed = courseSchema.safeParse(course);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      if (course.status === "published") {
        const missing = checklist(course).filter((item) => !item.done);
        if (missing.length) throw new StudioError(`Finish the checklist before publishing: ${missing.map((m) => m.label.toLowerCase()).join(", ")}.`);
      }

      const existing = isUuid(course.id) ? must(await supabase.from("course_lessons").select("id, slug").eq("course_id", course.id)) : [];
      const id = must(await supabase.rpc("save_course", { payload: toSavePayload(course, new Map(existing.map((l) => [l.id, l.slug]))) }));
      const saved = await getStudioCourse(id, supabase);
      if (!saved) throw new StudioError("The course was saved but couldn't be read back. Refresh the page.");
      return saved;
    },
    { tags: [CONTENT_TAGS.courses] },
  );
}

/** Deletes a course and its curriculum. Courses with students can only be unpublished. */
export async function deleteCourse(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the course",
    async ({ supabase }) => {
      const { count } = await supabase.from("enrollments").select("course_id", { count: "exact", head: true }).eq("course_id", id);
      if (count) throw new StudioError(`${count} ${count === 1 ? "student is" : "students are"} enrolled in this course, so it can't be deleted. Unpublish it instead.`);
      must(await supabase.from("courses").delete().eq("id", id));
      return null;
    },
    { tags: [CONTENT_TAGS.courses] },
  );
}

/* ── YouTube lookup ──────────────────────────────────────────────────────── */

export type VideoInfo =
  | { ok: true; videoId: string; title: string; channel: string; durationSeconds: number | null }
  | { ok: false; error: string };

/*
 * Looks up a YouTube video's title, channel and length so instructors only
 * have to paste a link. oEmbed confirms the video exists and can be embedded;
 * the length is read from the watch page when YouTube provides it.
 */
export async function inspectYouTube(link: string): Promise<VideoInfo> {
  // Server Actions can be called from anywhere; only the studio needs this one.
  if ((await getViewer())?.role !== "admin") return { ok: false, error: "Only admins can look up videos." };
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
