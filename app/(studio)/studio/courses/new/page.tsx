import type { Metadata } from "next";
import { CourseCreateForm } from "@/components/studio/course-create-form";
import { StudioPageHeader } from "@/components/studio/ui";
import { instructors } from "@/lib/content";
import { getStudioSeed } from "@/lib/studio";

export const metadata: Metadata = { title: "Create course" };

export default function NewCoursePage() {
  // TODO: use the signed-in instructor.
  const marcus = instructors.find((i) => i.slug === "marcus-reid")!;
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader
          title="Create course"
          crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Courses", href: "/studio/courses" }, { label: "Create course" }]}
        />
        <CourseCreateForm
          seed={getStudioSeed()}
          instructor={{ name: marcus.name, email: "marcus.reid@ultimatedeejays.com", image: marcus.image }}
        />
      </div>
    </main>
  );
}
