import type { ComponentType, SVGProps } from "react";
import { CountUp } from "./count-up";
import { AwardIcon, DownloadIcon, HeartIcon, UsersIcon } from "./icons";

type Stat = {
  value: number;
  decimals?: number;
  suffix: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  card: string;
  disc: string;
};

const stats: Stat[] = [
  {
    value: 2,
    suffix: "k+",
    label: "students",
    description: "Join 2,000+ students already learning to mix like a pro.",
    icon: UsersIcon,
    card: "bg-stat-blue",
    disc: "bg-[#34699a]",
  },
  {
    value: 35,
    suffix: "k+",
    label: "downloads",
    description: "Practice tracks, stems and cue sheets downloaded worldwide.",
    icon: DownloadIcon,
    card: "bg-stat-cream",
    disc: "bg-[#ffcb61]",
  },
  {
    value: 1.2,
    decimals: 1,
    suffix: "k+",
    label: "five-star reviews",
    description: "Five-star reviews from DJs at every level of experience.",
    icon: HeartIcon,
    card: "bg-stat-green",
    disc: "bg-[#4a9782]",
  },
  {
    value: 300,
    suffix: "+",
    label: "graduates booked",
    description: "Graduates now booked for clubs, weddings and festivals.",
    icon: AwardIcon,
    card: "bg-stat-periwinkle",
    disc: "bg-[#799eff]",
  },
];

export function Stats() {
  return (
    <section aria-label="Ultimate Deejays in numbers" className="site-container py-16 lg:py-20">
      <ul className="reveal grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {stats.map(({ value, decimals, suffix, label, description, icon: Icon, card, disc }) => (
          <li
            key={label}
            className={`flex flex-col items-center rounded-[1.25rem] px-6 py-10 text-center lg:py-12 ${card}`}
          >
            <span className={`flex size-14 items-center justify-center rounded-full text-white ${disc}`}>
              <Icon className="size-6" />
            </span>
            <p className="mt-5 text-[2.5rem] leading-none font-bold tracking-tight text-foreground lg:text-[2.75rem]">
              <CountUp value={value} decimals={decimals} suffix={suffix} />
              <span className="sr-only"> {label}</span>
            </p>
            <p className="mt-5 max-w-[15rem] text-base leading-relaxed text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
