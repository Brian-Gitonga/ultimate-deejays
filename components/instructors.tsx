import Image from "next/image";
import { getInstructors } from "@/lib/db/instructors";
import { Carousel } from "./carousel";
import { SectionHeading } from "./section-heading";

export async function Instructors() {
  const instructors = await getInstructors();
  return (
    <section id="instructors" aria-labelledby="instructors-title" className="py-16 lg:py-24">
      <div className="site-container">
        <SectionHeading
          id="instructors-title"
          eyebrow="Top Instructors"
          title="Meet Our Experts"
          description="Learn from DJs who play clubs, festivals and weddings every week, and love teaching what they know."
        />

        <div className="mt-10 lg:mt-12">
          <Carousel
            label="Instructors"
            controls="sides"
            slideClassName="basis-[72%] sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]"
          >
            {instructors.map((person) => (
              <figure key={person.slug} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={person.image}
                  alt={`Portrait of ${person.name}`}
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 32vw, (min-width: 640px) 48vw, 72vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-3 bottom-3 rounded-xl border border-white/60 bg-white/85 px-4 py-3 shadow-[0_8px_30px_rgb(0_0_0/0.12)] backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/80">
                  <p className="font-semibold text-neutral-900 dark:text-white">{person.name}</p>
                  <p className="text-sm text-brand-deep dark:text-brand">{person.specialty}</p>
                </figcaption>
              </figure>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
