"use server";

import { z } from "zod";
import { isUuid, type ActionResult } from "@/lib/action-result";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import type { StudioInstructor } from "@/lib/instructors";
import { adminAction, must, StudioError } from "@/lib/studio-action";
import { toStudioInstructor } from "@/lib/db/studio/instructors";

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "The profile URL can only use lowercase letters, numbers and dashes.").max(80),
  name: z.string().trim().min(2, "Enter their name.").max(80),
  specialty: z.string().trim().max(80),
  bio: z.string().trim().max(1000, "Keep the bio to 1,000 characters."),
  image: z.string().max(500),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address, or leave it empty.")]),
  position: z.number().int().min(0).max(1000),
  showOnAbout: z.boolean(),
});

export async function saveInstructor(instructor: StudioInstructor): Promise<ActionResult<StudioInstructor>> {
  return adminAction(
    "save the instructor",
    async ({ supabase }) => {
      const parsed = schema.safeParse(instructor);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const { showOnAbout, ...rest } = parsed.data;
      const values = { ...rest, show_on_about: showOnAbout };
      const query = isUuid(instructor.id)
        ? supabase.from("instructors").update(values).eq("id", instructor.id)
        : supabase.from("instructors").insert(values);
      const { data, error } = await query.select("*").single();
      if (error?.code === "23505") throw new StudioError("Another instructor already uses that profile URL.");
      if (error) throw error;
      return toStudioInstructor(data, instructor.courses, instructor.posts);
    },
    { tags: [CONTENT_TAGS.instructors] },
  );
}

/** Courses and posts that listed them switch to "The Ultimate Deejays team". */
export async function deleteInstructor(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the instructor",
    async ({ supabase }) => {
      must(await supabase.from("instructors").delete().eq("id", id));
      return null;
    },
    { tags: [CONTENT_TAGS.instructors, CONTENT_TAGS.courses, CONTENT_TAGS.posts] },
  );
}
