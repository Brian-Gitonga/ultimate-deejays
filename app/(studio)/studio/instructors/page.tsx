import type { Metadata } from "next";
import { InstructorManager } from "@/components/studio/instructor-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getStudioInstructors } from "@/lib/db/studio/instructors";

export const metadata: Metadata = { title: "Instructors" };

export default async function StudioInstructorsPage() {
  const instructors = await getStudioInstructors();
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Instructors" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Instructors" }]} />
        <InstructorManager seed={instructors} />
      </div>
    </main>
  );
}
