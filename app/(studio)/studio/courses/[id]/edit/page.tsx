import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CourseEditor } from "@/components/studio/course-editor";
import { Panel, primaryButton } from "@/components/studio/ui";
import { getInstructorOptions, getStudioCourse } from "@/lib/db/studio/courses";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: PageProps<"/studio/courses/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();
  const [course, instructors, slugs] = await Promise.all([
    getStudioCourse(id, supabase),
    getInstructorOptions(supabase),
    supabase.from("courses").select("slug").neq("id", id),
  ]);

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem]">
        {course ? (
          // The editor reads ?step= on the client
          <Suspense>
            <CourseEditor key={course.id} course={course} instructors={instructors} takenSlugs={(slugs.data ?? []).map((c) => c.slug)} />
          </Suspense>
        ) : (
          <Panel>
            <div className="py-10 text-center">
              <p className="text-lg font-semibold text-foreground">Course not found</p>
              <p className="mt-1 text-sm text-muted-foreground">It may have been deleted. Check Studio → Courses.</p>
              <Link href="/studio/courses" className={`${primaryButton} mt-5`}>
                Back to courses
              </Link>
            </div>
          </Panel>
        )}
      </div>
    </main>
  );
}
