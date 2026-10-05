import type { Plan } from "./plans";

/*
 * Students as Studio → Students shows them: every account with role "user",
 * with their enrollments and totals (lib/db/studio/students.ts).
 */

export type StudentStatus = "active" | "suspended";

export type Enrollment = { course: string; title: string; progress: number; enrolledAt: string };

export type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  city: string;
  country: string;
  plan: Plan["slug"];
  status: StudentStatus;
  joinedAt: string;
  lastActiveAt: string;
  enrollments: Enrollment[];
  challengeEntries: number;
  mixesSubmitted: number;
  /** Total paid, USD */
  paid: number;
  updatedAt: string;
};

export const averageProgress = (s: Pick<Student, "enrollments">) =>
  s.enrollments.length ? Math.round(s.enrollments.reduce((sum, e) => sum + e.progress, 0) / s.enrollments.length) : 0;
