"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { CONTENT_TAGS } from "@/lib/db/content-client";
import { REVIEW_COLUMNS, toStudioReview } from "@/lib/db/studio/reviews";
import type { StudioReview } from "@/lib/reviews";
import { adminAction, must, StudioError } from "@/lib/studio-action";

const schema = z.object({
  status: z.enum(["published", "hidden"]),
  reply: z.string().trim().max(2000, "Keep replies to 2,000 characters."),
});

/** Hides or shows a review on the course page, and saves the public reply. */
export async function saveReview(review: StudioReview): Promise<ActionResult<StudioReview>> {
  return adminAction(
    "save the review",
    async ({ supabase }) => {
      const parsed = schema.safeParse(review);
      if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
      const row = must(await supabase.from("course_reviews").update(parsed.data).eq("id", review.id).select(REVIEW_COLUMNS).single());
      return toStudioReview(row as Parameters<typeof toStudioReview>[0]);
    },
    // Ratings and review counts on course pages.
    { tags: [CONTENT_TAGS.reviews, CONTENT_TAGS.courses] },
  );
}

export async function deleteReview(id: string): Promise<ActionResult> {
  return adminAction(
    "delete the review",
    async ({ supabase }) => {
      must(await supabase.from("course_reviews").delete().eq("id", id));
      return null;
    },
    { tags: [CONTENT_TAGS.reviews, CONTENT_TAGS.courses] },
  );
}
