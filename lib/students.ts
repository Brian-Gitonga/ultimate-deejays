import { courses } from "./content";
import { plans, type Plan } from "./plans";

/*
 * Students (platform users). PLACEHOLDER: generated sample data, deterministic
 * so it's identical on every load. Replace getStudents() with a database query.
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

const people: [string, string, string][] = [
  ["Amani Otieno", "Nairobi", "Kenya"],
  ["Lena Müller", "Berlin", "Germany"],
  ["Kofi Asante", "Accra", "Ghana"],
  ["Ravi Patel", "Toronto", "Canada"],
  ["Sam Okafor", "London", "United Kingdom"],
  ["Jordan Blake", "Los Angeles", "United States"],
  ["Sofía Ramírez", "Mexico City", "Mexico"],
  ["Yuki Sato", "Osaka", "Japan"],
  ["Thandiwe Nkosi", "Johannesburg", "South Africa"],
  ["Lucas Oliveira", "São Paulo", "Brazil"],
  ["Chloé Martin", "Paris", "France"],
  ["Ethan Brooks", "Chicago", "United States"],
  ["Aisha Bello", "Lagos", "Nigeria"],
  ["Mateo Rossi", "Milan", "Italy"],
  ["Hana Kim", "Seoul", "South Korea"],
  ["Noah Williams", "Atlanta", "United States"],
  ["Zara Ahmed", "Dubai", "United Arab Emirates"],
  ["Diego Fernández", "Madrid", "Spain"],
  ["Grace Wanjiru", "Mombasa", "Kenya"],
  ["Oliver Jensen", "Copenhagen", "Denmark"],
  ["Priya Sharma", "Mumbai", "India"],
  ["Marcus Johnson", "New York", "United States"],
  ["Nia Kamau", "Kampala", "Uganda"],
  ["Tomás Silva", "Lisbon", "Portugal"],
  ["Emma Novak", "Prague", "Czechia"],
  ["Kwame Mensah", "Kumasi", "Ghana"],
  ["Isabella Costa", "Rio de Janeiro", "Brazil"],
  ["Liam O'Connor", "Dublin", "Ireland"],
];

// Small deterministic generator so the sample data never changes between renders.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const iso = (base: string, daysBack: number) => new Date(Date.parse(base) - daysBack * 86_400_000).toISOString().slice(0, 10);

export function getStudents(): Student[] {
  const rand = rng(42);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const beginnerFriendly = courses.filter((c) => c.level !== "Advanced");

  return people.map(([name, city, country], i) => {
    const r = rand();
    const plan: Plan["slug"] = r < 0.35 ? "warm-up" : r < 0.78 ? "resident" : "headliner";
    const pool = plan === "warm-up" ? courses.filter((c) => c.slug === "dj-fundamentals") : plan === "resident" ? beginnerFriendly : courses;
    const count = plan === "warm-up" ? 1 : plan === "resident" ? 2 + Math.floor(rand() * 3) : 3 + Math.floor(rand() * 4);
    const chosen = new Set<string>();
    while (chosen.size < Math.min(count, pool.length)) chosen.add(pick(pool).slug);

    const joinedBack = 20 + Math.floor(rand() * 340);
    const joinedAt = iso("2026-09-30", joinedBack);
    const enrollments = [...chosen].map((slug) => {
      const course = courses.find((c) => c.slug === slug)!;
      return {
        course: slug,
        title: course.title,
        progress: Math.min(100, Math.round(rand() * 105)),
        enrolledAt: iso(joinedAt, -Math.floor(rand() * 20)),
      };
    });

    return {
      id: `stu-${1000 + i}`,
      name,
      email: `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, ".").replace(/\.$/, "")}@example.com`,
      avatar: i < 5 ? `/images/students/student-${i + 1}.jpg` : null,
      city,
      country,
      plan,
      status: i === 17 ? "suspended" : "active",
      joinedAt,
      lastActiveAt: iso("2026-09-30", Math.floor(rand() * rand() * 45)),
      enrollments,
      challengeEntries: Math.floor(rand() * (plan === "warm-up" ? 2 : 5)),
      mixesSubmitted: plan === "warm-up" ? 0 : Math.floor(rand() * (plan === "resident" ? 3 : 9)),
      paid: plans.find((p) => p.slug === plan)!.price,
      updatedAt: `${joinedAt}T10:00:00.000Z`,
    };
  });
}

export const averageProgress = (s: Pick<Student, "enrollments">) =>
  s.enrollments.length ? Math.round(s.enrollments.reduce((sum, e) => sum + e.progress, 0) / s.enrollments.length) : 0;
