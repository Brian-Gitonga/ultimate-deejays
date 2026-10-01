import Image from "next/image";
import Link from "next/link";
import { team } from "@/lib/content";
import { ArrowRightIcon } from "./icons";

export function AboutTeam() {
  return (
    <section id="team" aria-labelledby="team-title" className="site-container py-16 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_2fr] lg:gap-16">
        <div className="reveal">
          <h2
            id="team-title"
            className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-foreground sm:text-[2rem]"
          >
            The DJs Behind the Decks
          </h2>
          <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-[1.0625rem]">
            Every course is taught by a working DJ. Our instructors play clubs, festivals, weddings and radio every week,
            and they built each lesson around the mistakes they made on the way up, so you can skip straight to the good
            part. Behind the scenes, our student success team makes sure no question goes unanswered.
          </p>
          <Link
            href="/careers"
            className="group mt-6 inline-flex items-center gap-2 text-base font-medium text-brand hover:text-brand-deep dark:hover:text-brand/80"
          >
            Want to teach with us? See open roles
            <ArrowRightIcon className="size-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        <ul className="reveal grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {team.map((person) => (
            <li key={person.slug}>
              <figure className="group relative aspect-[24/25] overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={person.image}
                  alt={`Portrait of ${person.name}`}
                  fill
                  sizes="(min-width: 1280px) 190px, (min-width: 640px) 22vw, 46vw"
                  className="object-cover object-[50%_30%] transition duration-700 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/40 to-transparent px-3 pt-10 pb-3 text-white">
                  <p className="text-sm leading-tight font-semibold">{person.name}</p>
                  <p className="mt-0.5 text-xs leading-snug text-white/80">{person.role}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
