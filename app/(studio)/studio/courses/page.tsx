import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { CourseTable } from "@/components/studio/course-table";
import { StudioPageHeader, primaryButton } from "@/components/studio/ui";
import { getStudioCourses } from "@/lib/db/studio/courses";

export const metadata: Metadata = { title: "Courses" };

export default async function StudioCoursesPage() {
  const courses = await getStudioCourses();
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader
          title="Courses"
          crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Courses" }]}
          actions={
            <Link href="/studio/courses/new" className={primaryButton}>
              <PlusIcon className="size-4" />
              Create course
            </Link>
          }
        />
        <CourseTable seed={courses} />
      </div>
    </main>
  );
}
