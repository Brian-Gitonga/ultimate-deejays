import Image from "next/image";
import Link from "next/link";
import { getSiteStats, studentsLabel } from "@/lib/db/stats";
import { HeroVisual } from "./hero-visual";

const students = [1, 2, 3, 4, 5].map((n) => `/images/students/student-${n}.jpg`);

export async function Hero() {
  const stats = await getSiteStats();
  return (
    <section className="site-container pt-8 pb-14 lg:pt-16 lg:pb-20 xl:pt-20">
      <div className="grid items-center gap-y-14 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-5">
          <p className="text-base font-medium uppercase text-brand sm:text-[1.0625rem] xl:text-lg">
            Your DJ journey starts here
          </p>

          {/* U+2011 non-breaking hyphen keeps "Pro‑Level" on one line */}
          <h1 className="mt-2.5 max-w-[35rem] text-[2.125rem] leading-[1.25] font-bold tracking-tight text-foreground sm:text-[2.5rem] xl:text-[2.75rem] xl:leading-[1.4]">
            Master the Decks with Pro&#8209;Level Online DJ Courses
          </h1>

          <p className="mt-6 max-w-[35rem] text-[1.0625rem] leading-[1.65] text-pretty text-muted-foreground xl:text-lg">
            Learn to beatmatch, mix, scratch and read a crowd from a working DJ. Step-by-step
            video lessons you can follow at your own pace, from first mix to first gig.
          </p>

          <Link
            href="/courses"
            className="mt-7 inline-flex h-11 items-center rounded-lg bg-[#18181b] px-5 text-base font-medium text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
          >
            Browse Courses
          </Link>

          <div className="mt-10 flex items-center gap-4 lg:mt-14">
            <div className="flex">
              {students.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  width={96}
                  height={96}
                  className={`size-10 rounded-full object-cover ring-2 ring-background sm:size-12 ${i > 0 ? "-ml-3 sm:-ml-3.5" : ""}`}
                />
              ))}
            </div>
            <div>
              {stats.students > 0 && <p className="text-base font-semibold text-foreground sm:text-lg">{studentsLabel(stats.students)} students learning</p>}
              <p className="text-sm text-muted-foreground sm:text-base">
                Free to start. No card needed.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <HeroVisual courses={stats.courses} students={studentsLabel(stats.students)} freeLessons={stats.freeLessons} />
        </div>
      </div>
    </section>
  );
}
