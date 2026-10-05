import "server-only";
import { cache } from "react";
import { contentClient, orThrow } from "./content-client";

/* Published course reviews for the public course page. Hidden reviews never come back (RLS). */

export type PublicReview = {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  body: string;
  reply: string;
  createdAt: string;
};

export const getCourseReviews = cache(async (courseId: string, limit = 20): Promise<PublicReview[]> => {
  const rows = orThrow(
    await contentClient("reviews")
      .from("course_reviews")
      .select("id, reviewer_name, reviewer_avatar, rating, body, reply, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(limit),
    "reviews",
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.reviewer_name || "Student",
    avatar: r.reviewer_avatar,
    rating: r.rating,
    body: r.body,
    reply: r.reply,
    createdAt: r.created_at,
  }));
});
