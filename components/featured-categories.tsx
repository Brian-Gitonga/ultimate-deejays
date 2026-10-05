import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { courseCategories, type CategorySlug } from "@/lib/course-taxonomy";
import { countCoursesByCategory } from "@/lib/courses";
import {
  ArrowUpRightIcon,
  DiscIcon,
  HeadphonesIcon,
  LaptopIcon,
  MegaphoneIcon,
  MicIcon,
  MusicIcon,
  SlidersIcon,
  WaveformIcon,
} from "./icons";
import { SectionHeading } from "./section-heading";

/* Icon and pastel tone (card fill + icon color, from the reference's palette) for each category. */
const looks: Record<CategorySlug, { icon: ComponentType<SVGProps<SVGSVGElement>>; tone: string }> = {
  fundamentals: { icon: HeadphonesIcon, tone: "bg-tint-violet [--icon:var(--accent-indigo)]" },
  mixing: { icon: SlidersIcon, tone: "bg-tint-mint [--icon:var(--brand-deep)] dark:[--icon:var(--brand)]" },
  scratch: { icon: DiscIcon, tone: "bg-tint-cream [--icon:var(--accent-amber)]" },
  production: { icon: WaveformIcon, tone: "bg-tint-rose [--icon:var(--accent-rose)]" },
  "software-gear": { icon: LaptopIcon, tone: "bg-tint-cream [--icon:var(--accent-amber)]" },
  genres: { icon: MusicIcon, tone: "bg-tint-violet [--icon:var(--accent-indigo)]" },
  performance: { icon: MicIcon, tone: "bg-tint-mint [--icon:var(--brand-deep)] dark:[--icon:var(--brand)]" },
  "branding-gigs": { icon: MegaphoneIcon, tone: "bg-tint-cream [--icon:var(--accent-amber)]" },
};

export async function FeaturedCategories() {
  const counts = await countCoursesByCategory();
  const categories = courseCategories.map(({ slug, name }) => ({ slug, name, courses: counts[slug], ...looks[slug] }));

  return (
    <section aria-labelledby="categories-title" className="site-container pt-6 pb-20 lg:pt-10 lg:pb-26">
      <SectionHeading
        id="categories-title"
        eyebrow="Top Categories"
        title="Featured Categories"
        description="Pick a lane and go deep. Every category is taught by working DJs who play these styles every weekend."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:mt-12 lg:grid-cols-4">
        {categories.map(({ name, slug, courses, icon: Icon, tone }) => (
          <li key={slug}>
            <Link
              href={`/courses?category=${slug}`}
              className={`group flex h-full flex-col rounded-2xl p-5 ring-1 ring-transparent transition duration-300 ring-inset hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_rgb(0_0_0/0.18)] hover:ring-black/5 dark:hover:ring-white/10 ${tone}`}
            >
              <Icon className="size-7 text-(--icon)" />
              <h3 className="mt-7 text-lg font-semibold tracking-tight text-foreground">{name}</h3>
              <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {courses} {courses === 1 ? "Course" : "Courses"}
                </span>
                <ArrowUpRightIcon className="size-4 transition group-hover:text-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
