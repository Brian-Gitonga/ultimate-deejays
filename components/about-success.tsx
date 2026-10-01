import Image from "next/image";
import Link from "next/link";
import { courseCount } from "@/lib/content";

const stats = [
  { value: String(courseCount), label: "Courses" },
  { value: "2k+", label: "Students" },
  { value: "300+", label: "Graduates Booked" },
];

const graduates = [
  { src: "/images/about/graduate-first-residency.jpg", alt: "Student DJ smiling while mixing on a controller" },
  { src: "/images/about/graduate-party-set.jpg", alt: "DJ laughing and dancing behind the decks during a set" },
  { src: "/images/about/graduate-headphones.jpg", alt: "Smiling DJ holding his headphones in a club" },
];

export function AboutSuccess() {
  return (
    <section aria-labelledby="success-title" className="relative isolate py-16 lg:py-24">
      <div aria-hidden="true" className="glow-success fade-y absolute inset-0 -z-10" />

      <div className="site-container grid items-center gap-12 lg:grid-cols-[0.95fr_2fr] lg:gap-16">
        <div className="reveal">
          <h2
            id="success-title"
            className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[2rem]"
          >
            Our Success Is Measured on the Dance Floor
          </h2>
          <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-[1.0625rem]">
            We don&apos;t count video views. We count first mixes recorded, first gigs booked and first crowds won over.
            Every residency, wedding and festival slot our graduates land is proof the method works, and the reason we
            keep raising the bar.
          </p>

          <Link
            href="/courses"
            className="mt-7 inline-flex h-11 items-center rounded-lg bg-linear-to-r from-brand to-[#0a6fb8] px-5 text-base font-medium text-white shadow-[0_10px_24px_-10px_rgb(0_120_103/0.7)] transition hover:brightness-110"
          >
            Browse Courses
          </Link>

          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-[0.9375rem] text-muted-foreground">{stat.label}</dt>
                <dd className="text-[2rem] leading-none font-bold tracking-tight text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="reveal grid grid-cols-3 gap-3 sm:gap-6">
          {graduates.map((photo) => (
            <div key={photo.src} className="relative aspect-[3/5] overflow-hidden rounded-2xl bg-muted">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1280px) 250px, (min-width: 1024px) 20vw, 32vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
