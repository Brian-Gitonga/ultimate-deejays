import "server-only";
import type { StudioInstructor } from "@/lib/instructors";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/* Studio → Instructors. */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const toStudioInstructor = (row: Tables<"instructors">, courses: number, posts: number): StudioInstructor => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  specialty: row.specialty,
  bio: row.bio,
  image: row.image,
  email: row.email,
  position: row.position,
  showOnAbout: row.show_on_about,
  courses,
  posts,
  updatedAt: row.updated_at,
});

/** Every instructor with how many courses and posts list them. */
export async function getStudioInstructors(client?: Supabase): Promise<StudioInstructor[]> {
  const supabase = client ?? (await createClient());
  const [instructors, courses, posts] = await Promise.all([
    supabase.from("instructors").select("*").order("position").order("name"),
    supabase.from("courses").select("instructor_id"),
    supabase.from("blog_posts").select("author_id"),
  ]);
  if (instructors.error) throw new Error(`Couldn't load instructors: ${instructors.error.message}.`);
  const count = (rows: { id: string | null }[] | null, id: string) => (rows ?? []).filter((r) => r.id === id).length;
  const courseRefs = (courses.data ?? []).map((c) => ({ id: c.instructor_id }));
  const postRefs = (posts.data ?? []).map((p) => ({ id: p.author_id }));
  return instructors.data.map((row) => toStudioInstructor(row, count(courseRefs, row.id), count(postRefs, row.id)));
}

