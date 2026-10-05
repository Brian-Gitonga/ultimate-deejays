import "server-only";
import { netOf, type Payout } from "@/lib/earnings";
import type { Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { courseFigures } from "../mappers";
import { toPayout } from "./payments";

/* Studio → Dashboard: this year's revenue, this month vs last, the course line-up and what needs attention. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;

/** % change from `before` to `now`, or null when there's nothing to compare with. */
const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : null);
const round = (n: number) => Math.round(n * 100) / 100;

export type DashboardCourse = { id: string; slug: string; title: string; image: string; status: "draft" | "review" | "published"; students: number; rating: number; reviews: number; updatedAt: string };
export type DashboardEnrollment = { id: string; student: string; avatar: string | null; course: string; plan: Plan["slug"]; source: string; date: string };
export type DashboardReview = { id: string; student: string; avatar: string | null; course: string; rating: number; text: string; date: string };

export type Dashboard = {
  year: number;
  revenue: { month: string; value: number | null }[];
  stats: {
    revenueThisMonth: number;
    revenueChange: number | null;
    students: number;
    newStudents30d: number;
    studentsChange: number | null;
    enrollments30d: number;
    enrollmentsChange: number | null;
    rating: number;
    reviews: number;
    availableBalance: number;
    inTransit: number;
  };
  courses: DashboardCourse[];
  enrollments: DashboardEnrollment[];
  payouts: Payout[];
  reviews: DashboardReview[];
  todos: { key: "mixes" | "entries" | "affiliates" | "reviews"; label: string; count: number; href: string }[];
};

export async function getDashboard(): Promise<Dashboard> {
  const supabase = await createClient();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const iso = (ms: number) => new Date(ms).toISOString();
  const d30 = iso(now.getTime() - 30 * DAY);
  const d60 = iso(now.getTime() - 60 * DAY);
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  const [payments, payouts, courses, enrollments, reviews, students, students30, studentsPrev, enroll30, enrollPrev, mixes, entries, affiliates, unanswered] =
    await Promise.all([
      supabase.from("payments").select("amount, fee, commission, status, paid_at"),
      supabase.from("payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, slug, title, thumbnail, status, updated_at, sample_students, enrolled_count, sample_rating, sample_reviews, review_count, rating_total"),
      supabase
        .from("enrollments")
        .select("user_id, course_id, enrolled_at, source, student:profiles(full_name, dj_name, email, avatar_url, plan), course:courses(title)")
        .order("enrolled_at", { ascending: false })
        .limit(6),
      supabase
        .from("course_reviews")
        .select("id, reviewer_name, reviewer_avatar, rating, body, created_at, course:courses(title)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3),
      count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user")),
      count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", d30)),
      count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", d60).lt("created_at", d30)),
      count(supabase.from("enrollments").select("user_id", { count: "exact", head: true }).gte("enrolled_at", d30)),
      count(supabase.from("enrollments").select("user_id", { count: "exact", head: true }).gte("enrolled_at", d60).lt("enrolled_at", d30)),
      count(supabase.from("mix_submissions").select("id", { count: "exact", head: true }).eq("status", "pending")),
      count(supabase.from("challenge_entries").select("id", { count: "exact", head: true }).eq("status", "submitted")),
      count(supabase.from("affiliate_applications").select("user_id", { count: "exact", head: true }).eq("status", "pending")),
      count(supabase.from("course_reviews").select("id", { count: "exact", head: true }).eq("status", "published").eq("reply", "")),
    ]);

  const error = payments.error ?? payouts.error ?? courses.error ?? enrollments.error ?? reviews.error;
  if (error) throw new Error(`Couldn't load the dashboard: ${error.message}. Run supabase/diagnostics/00_health_check.sql.`);

  // Revenue: gross of paid purchases, by month of this year.
  const rows = (payments.data ?? []).map((p) => ({ ...p, amount: Number(p.amount), fee: Number(p.fee), commission: Number(p.commission) }));
  const grossIn = (y: number, m: number) =>
    rows.filter((p) => p.status === "paid" && new Date(p.paid_at).getUTCFullYear() === y && new Date(p.paid_at).getUTCMonth() === m).reduce((s, p) => s + p.amount, 0);
  const revenue = MONTHS.map((label, m) => ({ month: label, value: m > month ? null : Math.round(grossIn(year, m)) }));
  const thisMonth = grossIn(year, month);
  const lastMonth = month === 0 ? grossIn(year - 1, 11) : grossIn(year, month - 1);

  const payoutList = (payouts.data ?? []).map(toPayout);
  const lifetimeNet = rows.reduce((s, p) => s + netOf(p), 0);
  const paidOut = payoutList.reduce((s, p) => s + p.amount, 0);

  // Ratings across published courses, sample figures included (as the site shows them).
  const courseList: DashboardCourse[] = (courses.data ?? []).map((c) => {
    const f = courseFigures(c);
    return { id: c.id, slug: c.slug, title: c.title || "Untitled course", image: c.thumbnail || "/images/hero-dj.webp", status: c.status, students: f.students, rating: f.rating, reviews: f.reviews, updatedAt: c.updated_at };
  });
  const published = courseList.filter((c) => c.status === "published");
  const reviewTotal = published.reduce((s, c) => s + c.reviews, 0);
  const rating = reviewTotal ? published.reduce((s, c) => s + c.rating * c.reviews, 0) / reviewTotal : 0;

  return {
    year,
    revenue,
    stats: {
      revenueThisMonth: round(thisMonth),
      revenueChange: change(thisMonth, lastMonth),
      students,
      newStudents30d: students30,
      studentsChange: change(students30, studentsPrev),
      enrollments30d: enroll30,
      enrollmentsChange: change(enroll30, enrollPrev),
      rating: Math.round(rating * 10) / 10,
      reviews: reviewTotal,
      availableBalance: Math.max(0, round(lifetimeNet - paidOut)),
      inTransit: round(payoutList.filter((p) => p.status === "in-transit").reduce((s, p) => s + p.amount, 0)),
    },
    courses: courseList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    enrollments: (enrollments.data ?? []).map((e) => ({
      id: `${e.user_id}:${e.course_id}`,
      student: e.student?.dj_name || e.student?.full_name || e.student?.email || "Student",
      avatar: e.student?.avatar_url ?? null,
      course: e.course?.title ?? "",
      plan: e.student?.plan ?? "warm-up",
      source: e.source,
      date: e.enrolled_at,
    })),
    payouts: payoutList.slice(0, 4),
    reviews: (reviews.data ?? []).map((r) => ({
      id: r.id,
      student: r.reviewer_name || "Student",
      avatar: r.reviewer_avatar,
      course: r.course?.title ?? "",
      rating: r.rating,
      text: r.body,
      date: r.created_at,
    })),
    todos: [
      { key: "mixes", label: "Mixes awaiting your feedback", count: mixes, href: "/studio/feedback" },
      { key: "entries", label: "Challenge entries to judge", count: entries, href: "/studio/challenges" },
      { key: "affiliates", label: "Affiliate applications to review", count: affiliates, href: "/studio/affiliates" },
      { key: "reviews", label: "Reviews without a reply", count: unanswered, href: "/studio/reviews" },
    ],
  };
}
