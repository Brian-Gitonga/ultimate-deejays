import type { ComponentType, SVGProps } from "react";
import { getSiteStats } from "@/lib/db/stats";
import { CountUp } from "./count-up";
import { DownloadIcon, LessonIcon, PlayIcon, UsersIcon } from "./icons";

type Stat = {
  value: number;
  suffix: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  card: string;
  disc: string;
};

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

/*
 * The home page in numbers. Students comes from Studio → Settings; the rest
 * are counted from what's published, so they stay true as content is added.
 * A figure that is 0 is left out rather than shown as "0".
 */
export async function Stats() {
  const s = await getSiteStats();
  const stats: (Stat | false)[] = [
    s.students > 0 && {
      value: s.students,
      suffix: "+",
      label: "students",
      description: "Learning to DJ with us since we opened our doors.",
      icon: UsersIcon,
      card: "bg-stat-blue",
      disc: "bg-[#34699a]",
    },
    s.courses > 0 && {
      value: s.courses,
      suffix: "",
      label: plural(s.courses, "course"),
      description: "From your first beatmatch to club-ready sets, with more on the way.",
      icon: LessonIcon,
      card: "bg-stat-cream",
      disc: "bg-[#ffcb61]",
    },
    s.freeLessons > 0 && {
      value: s.freeLessons,
      suffix: "",
      label: `free ${plural(s.freeLessons, "lesson")}`,
      description:
        s.freeCourses > 0
          ? `Includes ${s.freeCourses === 1 ? "a full free course" : `${s.freeCourses} full free courses`}, plus previews of the paid ones. No card needed.`
          : "Previews of our paid courses, free with an account. No card needed.",
      icon: PlayIcon,
      card: "bg-stat-green",
      disc: "bg-[#4a9782]",
    },
    s.freeDownloads > 0 && {
      value: s.freeDownloads,
      suffix: "",
      label: `free ${plural(s.freeDownloads, "download")}`,
      description: "Cue sheets, templates and artwork in the Store, free with an account.",
      icon: DownloadIcon,
      card: "bg-stat-periwinkle",
      disc: "bg-[#799eff]",
    },
  ];
  const shown = stats.filter((x): x is Stat => !!x);
  if (!shown.length) return null;

  // Static class names so Tailwind sees them: 4 across on desktop, or 3 / 2 when a figure is left out.
  const columns = shown.length >= 4 ? "lg:grid-cols-4" : shown.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <section aria-label="Ultimate Deejays in numbers" className="site-container py-16 lg:py-20">
      <ul className={`grid gap-4 sm:grid-cols-2 sm:gap-6 ${columns}`}>
        {shown.map(({ value, suffix, label, description, icon: Icon, card, disc }) => (
          <li key={label} className={`flex flex-col items-center rounded-[1.25rem] px-6 py-10 text-center lg:py-12 ${card}`}>
            <span className={`flex size-14 items-center justify-center rounded-full text-white ${disc}`}>
              <Icon className="size-6" />
            </span>
            <p className="mt-5 text-[2.5rem] leading-none font-bold tracking-tight text-foreground lg:text-[2.75rem]">
              <CountUp value={value} suffix={suffix} />
              <span className="sr-only"> {label}</span>
            </p>
            <p className="mt-2 text-base font-semibold text-foreground">{label}</p>
            <p className="mt-3 max-w-[15rem] text-base leading-relaxed text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
