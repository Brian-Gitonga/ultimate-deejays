import type { Metadata } from "next";
import { MyCourses, type MyCourse } from "@/components/my-courses";
import { courses } from "@/lib/content";
import { getCurriculum } from "@/lib/curriculum";

export const metadata: Metadata = { title: "My courses" };

export default function MyCoursesPage() {
  const catalog: MyCourse[] = courses.map((course) => {
    const lessons = getCurriculum(course).flatMap((s) => s.lessons);
    return {
      slug: course.slug,
      title: course.title,
      image: course.image,
      instructor: course.instructor.name,
      level: course.level,
      lessons: lessons.map((l) => l.slug),
      students: course.students,
    };
  });

  return <MyCourses catalog={catalog} />;
}
