import type { Course } from "@/lib/content";
import { Carousel } from "./carousel";
import { CourseCard } from "./course-card";
import { SectionHeading } from "./section-heading";

export function CoursesSection({
  id,
  eyebrow,
  title,
  description,
  courses,
  glow,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  courses: Course[];
  glow: "mint-violet" | "violet-mint";
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative isolate overflow-hidden py-16 lg:py-24">
      {/* Glow wash + faint grid, as in the reference */}
      <div aria-hidden="true" className="fade-y absolute inset-0 -z-10">
        <div className={`absolute inset-0 glow-${glow}`} />
        <div className="grid-lines absolute inset-0" />
      </div>

      <div className="site-container">
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} description={description} />

        <div className="reveal mt-10 lg:mt-12">
          <Carousel
            label={title}
            slideClassName="basis-[85%] sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]"
          >
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
