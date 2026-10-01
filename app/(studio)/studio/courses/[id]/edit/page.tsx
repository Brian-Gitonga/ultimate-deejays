import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseEditor } from "@/components/studio/course-editor";
import { getStudioSeed } from "@/lib/studio";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCoursePage({ params }: PageProps<"/studio/courses/[id]/edit">) {
  const { id } = await params;
  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[90rem]">
        {/* The editor reads ?step= on the client */}
        <Suspense>
          <CourseEditor seed={getStudioSeed()} courseId={id} />
        </Suspense>
      </div>
    </main>
  );
}
