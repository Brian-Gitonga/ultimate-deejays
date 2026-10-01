import { courses, instructors, posts } from "./content";
import { challenges } from "./challenges";
import { toStudioPost, type StudioPost } from "./studio-blog";
import { toStudioChallenge, type StudioChallenge } from "./studio-challenges";
import { getCurriculum } from "./curriculum";
import { newCourse, toStudioCourse, type StudioCourse as StudioCourseRecord } from "./studio-courses";

/*
 * Instructor studio data. PLACEHOLDER: figures are sample data for the
 * signed-in instructor. With a backend, replace getStudioDashboard() with a
 * query for the logged-in instructor and keep the returned shape.
 */

export type CourseStatus = "published" | "review" | "draft";

export type StudioCourse = {
  slug: string;
  title: string;
  image: string;
  status: CourseStatus;
  students: number;
  rating: number;
  revenue: number;
  updatedAt: string;
};

export type Enrollment = { student: string; avatar: string; course: string; plan: string; amount: number; date: string };
export type Payout = { id: string; amount: number; method: string; status: "paid" | "processing"; date: string };
export type Review = { student: string; avatar: string; course: string; rating: number; text: string; date: string };

const avatar = (n: number) => `/images/students/student-${n}.jpg`;

export function getStudioDashboard() {
  const instructor = instructors.find((i) => i.slug === "marcus-reid")!;
  const own = courses.filter((c) => c.instructor.slug === instructor.slug);

  const myCourses: StudioCourse[] = [
    ...own.map((c, i) => ({
      slug: c.slug,
      title: c.title,
      image: c.image,
      status: "published" as const,
      students: c.students,
      rating: c.rating,
      revenue: [21840, 9610, 3270][i] ?? 2400,
      updatedAt: ["2026-09-21", "2026-09-02", "2026-08-18"][i] ?? "2026-08-01",
    })),
    {
      slug: "advanced-scratch-combos",
      title: "Advanced Scratch Combos: Transforms, Flares & Crabs",
      image: "/images/courses/scratch-school.jpg",
      status: "review",
      students: 0,
      rating: 0,
      revenue: 0,
      updatedAt: "2026-09-27",
    },
    {
      slug: "beat-juggling-101",
      title: "Beat Juggling 101",
      image: "/images/courses/vinyl-djing-essentials.jpg",
      status: "draft",
      students: 0,
      rating: 0,
      revenue: 0,
      updatedAt: "2026-09-29",
    },
  ];

  // Monthly revenue (USD) for the current year; null = month not reached yet.
  const revenue: { month: string; value: number | null }[] = [
    { month: "Jan", value: 2140 },
    { month: "Feb", value: 2380 },
    { month: "Mar", value: 2910 },
    { month: "Apr", value: 2650 },
    { month: "May", value: 3420 },
    { month: "Jun", value: 3180 },
    { month: "Jul", value: 3960 },
    { month: "Aug", value: 4510 },
    { month: "Sep", value: 4870 },
    { month: "Oct", value: null },
    { month: "Nov", value: null },
    { month: "Dec", value: null },
  ];

  const enrollments: Enrollment[] = [
    { student: "Amani Otieno", avatar: avatar(3), course: "DJ Fundamentals", plan: "Resident", amount: 79, date: "2026-09-30" },
    { student: "Lena Müller", avatar: avatar(2), course: "Scratch School", plan: "Headliner", amount: 149, date: "2026-09-29" },
    { student: "Kofi Asante", avatar: avatar(4), course: "Vinyl DJing", plan: "Resident", amount: 79, date: "2026-09-29" },
    { student: "Ravi Patel", avatar: avatar(1), course: "DJ Fundamentals", plan: "Warm-Up", amount: 0, date: "2026-09-28" },
    { student: "Sam Okafor", avatar: avatar(5), course: "Scratch School", plan: "Resident", amount: 79, date: "2026-09-27" },
  ];

  const payouts: Payout[] = [
    { id: "PO-1042", amount: 4510, method: "Bank transfer", status: "processing", date: "2026-09-28" },
    { id: "PO-1031", amount: 3960, method: "PayPal", status: "paid", date: "2026-08-30" },
    { id: "PO-1019", amount: 3180, method: "Bank transfer", status: "paid", date: "2026-07-30" },
  ];

  const reviews: Review[] = [
    {
      student: "Lena Müller",
      avatar: avatar(2),
      course: "Scratch School",
      rating: 5,
      text: "The drills finally made flares click for me. Marcus explains the timing better than anyone.",
      date: "2026-09-26",
    },
    {
      student: "Ravi Patel",
      avatar: avatar(1),
      course: "DJ Fundamentals",
      rating: 5,
      text: "Recorded my first clean mix after week two. The phrasing lesson was the missing piece.",
      date: "2026-09-22",
    },
    {
      student: "Kofi Asante",
      avatar: avatar(4),
      course: "Vinyl DJing",
      rating: 4,
      text: "Great intro to needle drops. Would love a longer section on stylus care.",
      date: "2026-09-19",
    },
  ];

  const todos = [
    { label: "Mixes awaiting your feedback", count: 7, href: "/studio/feedback" },
    { label: "Challenge entries to judge", count: 12, href: "/studio/challenges" },
    { label: "Unanswered student questions", count: 3, href: "/studio/questions" },
  ];

  return {
    instructor,
    myCourses,
    revenue,
    enrollments,
    payouts,
    reviews,
    todos,
    stats: {
      revenueThisMonth: 4870,
      revenueChange: 8, // % vs last month
      students: myCourses.reduce((s, c) => s + c.students, 0),
      studentsChange: 12,
      enrollments30d: 186,
      enrollmentsChange: 5,
      rating: 4.8,
      reviews: 626,
      availableBalance: 4870,
    },
  };
}

export type StudioDashboard = ReturnType<typeof getStudioDashboard>;

export const getStudioChallengeSeed = (): StudioChallenge[] => challenges.map(toStudioChallenge);

/** Blog posts for the studio: every published article (plus a draft). */
export function getStudioPostSeed(): StudioPost[] {
  const published = posts.map(toStudioPost);
  const leo = published.find((p) => p.author.name === "Leo Moreno")!.author;
  return [
    {
      id: "gain-staging-for-djs",
      slug: "gain-staging-for-djs",
      title: "Gain Staging for DJs: Stop Hitting the Red",
      excerpt: "Why your mixes distort in the club even when the meters look fine, and a simple routine to set gain the same way every time.",
      body: "## Why gain matters\n\nMost DJs set their channel levels by ear, then wonder why the club system sounds harsh.",
      category: "mixing-techniques",
      keywords: ["gain staging", "dj levels", "mixer"],
      cover: "/images/blog/eq-mixing-101.jpg",
      status: "draft",
      publishAt: "2026-10-06",
      author: leo,
      updatedAt: "2026-09-29T12:00:00.000Z",
    },
    ...published,
  ];
}

/**
 * Every course the studio manages: the published catalogue plus unpublished
 * drafts. With a backend, this becomes a database query.
 */
export function getStudioSeed(): StudioCourseRecord[] {
  const emailFor = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@ultimatedeejays.com`;
  const published = courses.map((course) => toStudioCourse(course, getCurriculum(course), emailFor(course.instructor.name)));
  const marcus = instructors.find((i) => i.slug === "marcus-reid")!;
  const author = { name: marcus.name, email: emailFor(marcus.name), image: marcus.image };
  const scratch = published.find((c) => c.slug === "scratch-school")!;

  return [
    ...published,
    newCourse(
      {
        id: "advanced-scratch-combos",
        slug: "advanced-scratch-combos",
        title: "Advanced Scratch Combos: Transforms, Flares & Crabs",
        subtitle: "Chain advanced crossfader techniques into combos that sound musical, clean and battle-ready.",
        category: "scratch",
        level: "Advanced",
        access: "headliner",
        thumbnail: "/images/courses/scratch-school.jpg",
        outcomes: scratch.outcomes,
        requirements: ["Comfortable with the baby scratch and basic cuts", "A turntable or controller with a responsive crossfader"],
        audience: ["Scratch DJs ready to build full routines"],
        sections: scratch.sections.map((s) => ({ ...s, id: `adv-${s.id}` })),
        status: "review",
        updatedAt: "2026-09-27T10:00:00.000Z",
      },
      author,
    ),
    newCourse(
      {
        id: "beat-juggling-101",
        slug: "beat-juggling-101",
        title: "Beat Juggling 101",
        category: "scratch",
        level: "Intermediate",
        updatedAt: "2026-09-29T16:00:00.000Z",
      },
      author,
    ),
  ];
}
