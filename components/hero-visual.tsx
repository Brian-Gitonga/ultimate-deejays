import Image from "next/image";
import type { ReactNode } from "react";
import { LessonIcon, PlayIcon } from "./icons";

/*
 * Every piece is positioned in % of a square box, so the whole composition
 * scales as one unit. Card text steps up once the box is ≥ 32rem wide (@lg).
 */
export function HeroVisual({ courses, students, freeLessons }: { courses: number; students: string; freeLessons: number }) {
  return (
    <div className="@container relative mx-auto aspect-square w-full max-w-[43.75rem]">
      {/* Blue ring — a half arc sweeping from the bottom-left, over the top, to the top-right */}
      <svg
        viewBox="0 0 100 100"
        className="absolute left-[8.2%] top-[10.4%] w-[91%] overflow-visible"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="50"
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth="0.6"
          pathLength={100}
          strokeDasharray="50 50"
          transform="rotate(140 50 50)"
        />
      </svg>

      {/* Green disc */}
      <div className="absolute left-[11.2%] top-[13.4%] aspect-square w-[85%] rounded-full bg-brand-deep" />

      {/* Cut-out photo: clipped to the disc, head allowed above it */}
      <div className="hero-person-mask absolute left-[11.2%] top-0 h-[98.4%] w-[85%] overflow-hidden">
        <Image
          src="/images/hero-dj.webp"
          alt="DJ instructor wearing studio headphones"
          width={1000}
          height={1395}
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 1280px) 640px, (min-width: 1024px) 520px, 92vw"
          className="absolute left-[-2%] top-0 h-auto w-[108%] max-w-none"
        />
      </div>

      {/* Accent dots */}
      <div className="absolute left-[5.7%] top-[62.1%] aspect-square w-[12.6%] rounded-full bg-accent-blue" />
      <div className="absolute left-[92%] top-[51.4%] aspect-square w-[8%] rounded-full bg-accent-yellow" />

      {/* Floating stat cards */}
      <GlassCard className="left-0 top-[23%]">
        <StatWithIcon icon={<LessonIcon />} value={String(courses)} label={courses === 1 ? "DJ Course" : "DJ Courses"} />
      </GlassCard>

      <GlassCard className="left-[75.9%] top-[11.2%] flex-col px-3 py-3 @lg:px-4 @lg:py-4">
        <ProgressRing value={75} label={students} />
        <span className="mt-1.5 text-xs text-foreground @lg:mt-2 @lg:text-[0.9375rem]">Students</span>
      </GlassCard>

      <GlassCard className="left-[57.2%] top-[85.6%]">
        <StatWithIcon icon={<PlayIcon />} value={String(freeLessons)} label="Free Lessons" />
      </GlassCard>
    </div>
  );
}

function GlassCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`absolute flex items-center rounded-xl border-2 border-glass-border bg-glass px-2.5 py-2 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-md @lg:rounded-2xl @lg:px-[1.125rem] @lg:py-4 ${className}`}
    >
      {children}
    </div>
  );
}

function StatWithIcon({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 @lg:gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_2px_8px_rgb(0_0_0/0.08)] @lg:size-[3.375rem] @lg:rounded-[0.875rem] dark:bg-neutral-800">
        <span className="flex size-6 items-center justify-center rounded-[0.4375rem] bg-brand text-white [&>svg]:size-3.5 @lg:size-[1.875rem] @lg:rounded-[0.625rem] @lg:[&>svg]:size-[1.125rem]">
          {icon}
        </span>
      </span>
      <span className="flex flex-col whitespace-nowrap">
        <span className="text-base leading-tight font-semibold text-foreground @lg:text-[1.4375rem]">{value}</span>
        <span className="text-[0.6875rem] leading-tight text-foreground/90 @lg:mt-0.5 @lg:text-[0.9375rem]">{label}</span>
      </span>
    </div>
  );
}

function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative size-14 @lg:size-[5.75rem]">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" className="stroke-neutral-200 dark:stroke-white/15" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${value} 100`}
          className="stroke-brand"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-foreground @lg:text-[1.4375rem]">
        {label}
      </span>
    </div>
  );
}
