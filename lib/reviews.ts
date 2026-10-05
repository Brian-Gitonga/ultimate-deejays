/* Course reviews as Studio → Reviews manages them. Stored in course_reviews. */

export type StudioReview = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  name: string;
  avatar: string | null;
  rating: number;
  body: string;
  status: "published" | "hidden";
  reply: string;
  repliedAt: string | null;
  /** From scripts/demo-data.sql */
  isDemo: boolean;
  createdAt: string;
};
