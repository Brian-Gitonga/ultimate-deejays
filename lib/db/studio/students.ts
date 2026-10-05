import "server-only";
import type { Student, StudentStatus } from "@/lib/students";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { splitLocation } from "../mappers";

/* Studio → Students: every account with role "user", with enrollments, progress and totals. */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export function toStudent(row: Tables<"student_overview">, enrollments: Tables<"enrollment_progress">[]): Student {
  const { city, country } = splitLocation(row.location ?? "");
  return {
    id: row.id!,
    name: (row.dj_name || row.full_name || row.email) ?? "Student",
    email: row.email ?? "",
    avatar: row.avatar_url,
    city,
    country,
    plan: row.plan ?? "warm-up",
    status: (row.status ?? "active") as StudentStatus,
    joinedAt: (row.created_at ?? "").slice(0, 10),
    lastActiveAt: (row.last_seen_at ?? row.created_at ?? "").slice(0, 10),
    enrollments: enrollments
      .filter((e) => e.user_id === row.id)
      .map((e) => ({
        course: e.course_slug ?? "",
        title: e.course_title ?? "",
        progress: e.lessons_total ? Math.min(100, Math.round(((e.lessons_done ?? 0) / e.lessons_total) * 100)) : 0,
        enrolledAt: (e.enrolled_at ?? "").slice(0, 10),
      })),
    challengeEntries: row.challenge_entries ?? 0,
    mixesSubmitted: row.mixes_submitted ?? 0,
    paid: Number(row.paid ?? 0),
    updatedAt: row.updated_at ?? "",
  };
}

export async function getStudents(client?: Supabase): Promise<Student[]> {
  const supabase = client ?? (await createClient());
  const [students, enrollments] = await Promise.all([
    supabase.from("student_overview").select("*").order("created_at", { ascending: false }),
    supabase.from("enrollment_progress").select("*"),
  ]);
  const error = students.error ?? enrollments.error;
  if (error) throw new Error(`Couldn't load students: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);
  return (students.data ?? []).map((row) => toStudent(row, enrollments.data ?? []));
}

export async function getStudent(id: string, client?: Supabase): Promise<Student | null> {
  const supabase = client ?? (await createClient());
  const [student, enrollments] = await Promise.all([
    supabase.from("student_overview").select("*").eq("id", id).maybeSingle(),
    supabase.from("enrollment_progress").select("*").eq("user_id", id),
  ]);
  if (student.error) throw student.error;
  return student.data ? toStudent(student.data, enrollments.data ?? []) : null;
}
