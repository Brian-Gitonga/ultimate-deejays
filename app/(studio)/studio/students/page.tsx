import type { Metadata } from "next";
import { StudentManager } from "@/components/studio/student-manager";
import { StudioPageHeader } from "@/components/studio/ui";
import { getStudents } from "@/lib/db/studio/students";

export const metadata: Metadata = { title: "Students" };

export default async function StudioStudentsPage({ searchParams }: PageProps<"/studio/students">) {
  const [students, { q }] = await Promise.all([getStudents(), searchParams]);
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem] space-y-6">
        <StudioPageHeader title="Students" crumbs={[{ label: "Dashboard", href: "/studio" }, { label: "Students" }]} />
        <StudentManager seed={students} initialQuery={typeof q === "string" ? q : ""} />
      </div>
    </main>
  );
}
