import type { Metadata } from "next";
import { CourseCreateForm } from "@/components/studio/course-create-form";
import { StudioPageHeader } from "@/components/studio/ui";
import { getInstructorOptions, getStudioCourses } from "@/lib/db/studio/courses";

export const metadata: Metadata = { title: "Create course" };

export default async function NewCoursePage() {
  const [instructors, courses] = await Promise.all([getInstructorOptions(), getStudioCourses()]);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader
          title="Create course"
          crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Courses", href: "/studio/courses" }, { label: "Create course" }]}
        />
        <CourseCreateForm instructors={instructors} takenSlugs={courses.map((c) => c.slug)} />
      </div>
    </main>
  );
}
