import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePlayer, type PlayerCourse } from "@/components/course-player";
import { courses, getCourse } from "@/lib/content";
import { findTopic, formatDuration, isoDuration } from "@/lib/course-taxonomy";
import { getCurriculum, youtubeId } from "@/lib/curriculum";
import { siteName, siteUrl } from "@/lib/site";

// Every course is known at build time; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = getCourse((await params).slug);
  if (!course) return {};
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
  const course = getCourse((await params).slug);
  if (!course) notFound();

  const sections = getCurriculum(course);
  const lessons = sections.flatMap((s) => s.lessons);
  const requested = (await searchParams).lesson;
  const initialLesson = lessons.find((l) => l.slug === requested)?.slug ?? lessons[0].slug;

  const playerCourse: PlayerCourse = {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
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
    aggregateRating: { "@type": "AggregateRating", ratingValue: course.rating, reviewCount: course.reviews, bestRating: 5 },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: isoDuration(course.durationMinutes),
      instructor: { "@type": "Person", name: course.instructor.name },
    },
    hasPart: lessons.map((lesson) => ({
      "@type": "VideoObject",
      name: lesson.title,
      description: lesson.summary,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId(lesson.youtube)}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId(lesson.youtube)}`,
      duration: `PT${lesson.durationSeconds}S`,
      uploadDate: course.publishedAt,
    })),
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CoursePlayer course={playerCourse} sections={sections} initialLesson={initialLesson} />
    </main>
  );
}
