import "server-only";
import { createClient } from "@/lib/supabase/server";

/* Studio search: one box that finds courses, posts, challenges, students, instructors, payments and affiliates. */

export type SearchHit = { id: string; title: string; detail: string; href: string };
export type SearchGroup = { key: string; label: string; hits: SearchHit[] };

// PostgREST's or() filter uses commas, parentheses and quotes as syntax, so they're stripped from the query.
const clean = (q: string) => q.replace(/[,()%*"\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export async function searchStudio(query: string): Promise<SearchGroup[]> {
  const q = clean(query);
  if (q.length < 2) return [];
  const like = `%${q}%`;
  const any = (...columns: string[]) => columns.map((c) => `${c}.ilike."${like}"`).join(",");
  const supabase = await createClient();
  const LIMIT = 8;

  const [courses, posts, challenges, students, instructors, payments, affiliates] = await Promise.all([
    supabase.from("courses").select("id, title, slug, status").or(any("title", "slug", "subtitle")).limit(LIMIT),
    supabase.from("blog_posts").select("id, title, slug, status").or(any("title", "slug", "excerpt")).limit(LIMIT),
    supabase.from("challenges").select("id, title, slug, published").or(any("title", "slug", "tagline")).limit(LIMIT),
    supabase.from("profiles").select("id, full_name, dj_name, email, plan").eq("role", "user").or(any("full_name", "dj_name", "email")).limit(LIMIT),
    supabase.from("instructors").select("id, name, specialty").or(any("name", "specialty")).limit(LIMIT),
    supabase.from("payments").select("id, reference, customer_name, customer_email, amount, currency, status").or(any("reference", "customer_name", "customer_email")).limit(LIMIT),
    supabase.from("affiliate_overview").select("id, name, email, code, status").or(any("name", "email", "code")).limit(LIMIT),
  ]);

  const groups: SearchGroup[] = [
    {
      key: "courses",
      label: "Courses",
      hits: (courses.data ?? []).map((c) => ({ id: c.id, title: c.title || "Untitled course", detail: `${c.status} · /courses/${c.slug}`, href: `/studio/courses/${c.id}/edit` })),
    },
    {
      key: "posts",
      label: "Blog posts",
      hits: (posts.data ?? []).map((p) => ({ id: p.id, title: p.title || "Untitled post", detail: `${p.status} · /blog/${p.slug}`, href: `/studio/blog/${p.id}/edit` })),
    },
    {
      key: "challenges",
      label: "Challenges",
      hits: (challenges.data ?? []).map((c) => ({ id: c.id, title: c.title, detail: c.published ? "Published" : "Draft", href: `/studio/challenges/${c.id}/edit` })),
    },
    {
      key: "students",
      label: "Students",
      hits: (students.data ?? []).map((s) => ({
        id: s.id,
        title: s.dj_name || s.full_name || s.email,
        detail: `${s.email} · ${s.plan}`,
        href: `/studio/students?q=${encodeURIComponent(s.email)}`,
      })),
    },
    {
      key: "instructors",
      label: "Instructors",
      hits: (instructors.data ?? []).map((i) => ({ id: i.id, title: i.name, detail: i.specialty, href: "/studio/instructors" })),
    },
    {
      key: "payments",
      label: "Payments",
      hits: (payments.data ?? []).map((p) => ({
        id: p.id,
        title: `${p.customer_name || p.customer_email} · ${p.currency} ${Number(p.amount).toFixed(2)}`,
        detail: `${p.reference} · ${p.status}`,
        href: "/studio/earnings",
      })),
    },
    {
      key: "affiliates",
      label: "Affiliates",
      hits: (affiliates.data ?? []).map((a) => ({ id: a.id ?? "", title: a.name ?? "", detail: `${a.code ?? "No code yet"} · ${a.status}`, href: "/studio/affiliates" })),
    },
  ];
  return groups.filter((g) => g.hits.length);
}
