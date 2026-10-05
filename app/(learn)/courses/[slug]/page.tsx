import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePlayer, type PlayerCourse } from "@/components/course-player";
import { findTopic, formatDuration, isoDuration } from "@/lib/course-taxonomy";
import { getCourseDetail, getPublishedCourses } from "@/lib/db/courses";
import { getCourseReviews } from "@/lib/db/reviews";
import { getSiteSettings } from "@/lib/db/settings";
import { siteName, siteUrl } from "@/lib/site";

// Published courses are built ahead of time; courses published later render on first visit.
export async function generateStaticParams() {
  return (await getPublishedCourses()).map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const detail = await getCourseDetail((await params).slug);
  if (!detail) return {};
  const { course } = detail;
  return {
    title: course.title,
    description: course.summary,
    // ?lesson= only picks the starting video, so every lesson URL points at the course page.
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      type: "website",
      title: course.title,
      description: course.summary,
      url: `/courses/${course.slug}`,
      siteName,
      images: [{ url: course.image, width: 960, height: 672, alt: course.title }],
    },
    twitter: { card: "summary_large_image", title: course.title, description: course.summary, images: [course.image] },
  };
}

export default async function CoursePlayerPage({ params, searchParams }: PageProps<"/courses/[slug]">) {
  const detail = await getCourseDetail((await params).slug);
  if (!detail || !detail.sections.length) notFound();

  const { course, sections } = detail;
  const [reviews, settings] = await Promise.all([getCourseReviews(course.id), getSiteSettings()]);
  const lessons = sections.flatMap((s) => s.lessons);
  const requested = (await searchParams).lesson;
  const initialLesson = lessons.find((l) => l.slug === requested)?.slug ?? lessons[0].slug;

  const playerCourse: PlayerCourse = {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    image: course.image,
    access: course.access,
    accessName: settings.plans.find((p) => p.slug === course.access)?.name ?? course.access,
    level: course.level,
    durationLabel: formatDuration(course.durationMinutes),
    students: course.students,
    rating: course.rating,
    reviews: course.reviews,
    instructor: {
      name: course.instructor.name,
      image: course.instructor.image,
      specialty: course.instructor.specialty,
      bio: course.instructor.bio,
    },
  };

  const abs = (path: string) => new URL(path, siteUrl).toString();
  const topic = findTopic(course.subcategory ?? course.category);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": abs(`/courses/${course.slug}`),
    name: course.title,
    description: course.summary,
    url: abs(`/courses/${course.slug}`),
    image: abs(course.image),
    inLanguage: "en",
    educationalLevel: course.level,
    about: topic?.topic.name,
    provider: { "@type": "Organization", name: siteName, sameAs: siteUrl },
    ...(course.reviews > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: course.rating, reviewCount: course.reviews, bestRating: 5 },
    }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: isoDuration(course.durationMinutes),
      instructor: { "@type": "Person", name: course.instructor.name },
    },
    // Lesson videos are for members, so the outline is listed without them.
    syllabusSections: sections.map((section) => ({
      "@type": "Syllabus",
      name: section.title,
      timeRequired: `PT${section.lessons.reduce((sum, l) => sum + l.durationSeconds, 0)}S`,
    })),
    isAccessibleForFree: course.access === "warm-up",
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CoursePlayer course={playerCourse} sections={sections} initialLesson={initialLesson} reviews={reviews} />
    </main>
  );
}
