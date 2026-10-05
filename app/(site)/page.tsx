import { CoursesSection } from "@/components/courses-section";
import { Faq } from "@/components/faq";
import { FeaturedCategories } from "@/components/featured-categories";
import { Hero } from "@/components/hero";
import { Instructors } from "@/components/instructors";
import { LatestPosts } from "@/components/latest-posts";
import { Newsletter } from "@/components/newsletter";
import { Stats } from "@/components/stats";
import { TrustedBy } from "@/components/trusted-by";
import { getLatestCourses, getPopularCourses } from "@/lib/db/courses";

export default async function Home() {
  const [popularCourses, latestCourses] = await Promise.all([getPopularCourses(), getLatestCourses()]);
  return (
    <main className="flex-1">
      {/* Pulled up under the sticky header so the glow shows through it at the top */}
      <div className="hero-backdrop -mt-20 pt-20 lg:-mt-[5.5rem] lg:pt-[5.5rem]">
        <Hero />
        <TrustedBy />
      </div>

      <FeaturedCategories />

      <CoursesSection
        id="courses"
        eyebrow="Courses"
        title="Popular Courses"
        description="Our most-enrolled courses, from your very first beatmatch to headline-ready sets on club-standard gear."
        courses={popularCourses}
        glow="mint-violet"
      />

      <Stats />

      <CoursesSection
        id="latest-courses"
        eyebrow="Just Dropped"
        title="Latest Courses"
        description="Fresh lessons every month: new techniques, new genres and new gear, straight from the booth."
        courses={latestCourses}
        glow="violet-mint"
      />

      <Instructors />
      <Faq />
      <LatestPosts />
      <Newsletter />
    </main>
  );
}
