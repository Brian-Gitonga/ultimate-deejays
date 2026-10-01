import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChallengeCard, challengeDate } from "@/components/challenge-card";
import { Countdown } from "@/components/countdown";
import { ArrowRightIcon, CameraIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import { YouTubePlayer } from "@/components/youtube-player";
import {
  challengeStatuses,
  challengeTypes,
  challenges,
  legendaryRoutines,
  type ChallengeStatus,
  type ChallengeType,
} from "@/lib/challenges";
import { youtubeId } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "DJ Challenges",
  description:
    "Monthly DJ challenges: scratch battles, one-minute blends, genre switches and more. Record your routine, share it and get judged by working DJs.",
  alternates: { canonical: "/challenges" },
};

const statusOrder: Record<ChallengeStatus, number> = { live: 0, upcoming: 1, ended: 2 };

export default async function ChallengesPage({ searchParams }: PageProps<"/challenges">) {
  const params = await searchParams;
  const type = challengeTypes.find((t) => t.slug === params.type)?.slug ?? null;
  const status = challengeStatuses.find((s) => s.slug === params.status)?.slug ?? null;

  const featured = challenges
    .filter((c) => c.status === "live")
    .sort((a, b) => b.entries - a.entries)[0];

  const shown = challenges
    .filter((c) => (!type || c.type === type) && (!status || c.status === status))
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.closes.localeCompare(b.closes));

  const href = (next: { type?: ChallengeType | null; status?: ChallengeStatus | null }) => {
    const q = new URLSearchParams();
    const t = next.type === undefined ? type : next.type;
    const s = next.status === undefined ? status : next.status;
    if (t) q.set("type", t);
    if (s) q.set("status", s);
    const search = q.toString();
    return search ? `/challenges?${search}#all-challenges` : "/challenges#all-challenges";
  };

  return (
    <main className="flex-1">
      {featured && (
        <section aria-labelledby="featured-title" className="relative isolate overflow-hidden bg-neutral-950 text-white">
          <Image src={featured.image} alt="" fill loading="eager" sizes="100vw" className="-z-10 object-cover opacity-35" />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/30" />
          <div className="site-container grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-sm font-semibold">
                <span className="size-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
                Featured challenge · Live now
              </p>
              <h1 className="mt-5 text-[2.25rem] leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">DJ Challenges</h1>
              <p className="mt-3 max-w-xl text-lg text-pretty text-white/75">
                Test your skills, share your routine and get judged by working DJs. New challenges every month.
              </p>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md sm:p-6">
                <h2 id="featured-title" className="text-2xl font-semibold">
                  {featured.title}
                </h2>
                <p className="mt-1 text-white/75">{featured.tagline}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <Countdown
                    until={featured.closes}
                    fallback={`Closes ${challengeDate.format(new Date(featured.closes))}`}
                    className="font-semibold text-brand"
                  />
                  <span className="inline-flex items-center gap-1.5 text-white/80">
                    <UsersIcon className="size-4" />
                    {featured.entries} entries so far
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-white/80">
                    <TrophyIcon className="size-4 text-accent-yellow" />
                    {featured.prize}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/challenges/${featured.slug}#enter`}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
                  >
                    Enter the challenge
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link
                    href={`/challenges/${featured.slug}`}
                    className="inline-flex h-11 items-center rounded-lg border border-white/25 px-5 text-sm font-semibold transition hover:bg-white/10"
                  >
                    Read the brief
                  </Link>
                </div>
              </div>
            </div>

            <ol className="grid gap-3">
              {[
                { icon: <TrophyIcon className="size-5" />, title: "Pick a challenge", text: "Scratch, mixing, transitions or genre: every level has one." },
                { icon: <CameraIcon className="size-5" />, title: "Record one take", text: "Film your hands and gear, then upload it to YouTube." },
                { icon: <UsersIcon className="size-5" />, title: "Get judged & featured", text: "Instructors score every entry and winners get featured." },
              ].map((step, i) => (
                <li key={step.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand">{step.icon}</span>
                  <span>
                    <span className="block text-sm text-white/60">Step {i + 1}</span>
                    <span className="block font-semibold">{step.title}</span>
                    <span className="block text-sm text-white/70">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section id="all-challenges" aria-labelledby="all-title" className="site-container scroll-mt-24 py-16 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="all-title" className="text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
              All challenges
            </h2>
            <p className="mt-2 text-muted-foreground">
              {shown.length} {shown.length === 1 ? "challenge" : "challenges"}
              {type || status ? " match your filters" : ", live, upcoming and past"}
            </p>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
            <FilterRow label="Status">
              <Chip href={href({ status: null })} active={!status}>All</Chip>
              {challengeStatuses.map((s) => (
                <Chip key={s.slug} href={href({ status: s.slug })} active={status === s.slug}>
                  {s.name}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Type">
              <Chip href={href({ type: null })} active={!type}>All</Chip>
              {challengeTypes.map((t) => (
                <Chip key={t.slug} href={href({ type: t.slug })} active={type === t.slug}>
                  {t.name}
                </Chip>
              ))}
            </FilterRow>
          </div>
        </div>

        {shown.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((challenge) => (
              <li key={challenge.slug}>
                <ChallengeCard challenge={challenge} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <p className="text-lg font-semibold text-foreground">No challenges match those filters</p>
            <Link href="/challenges#all-challenges" className="mt-3 inline-block font-medium text-brand hover:underline">
              Show all challenges
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="legends-title" className="border-t border-border bg-cream py-16 lg:py-24">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="text-base font-medium text-brand">Inspiration</p>
            <h2 id="legends-title" className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-foreground sm:text-[2rem]">
              Legendary routines
            </h2>
            <p className="mt-3 text-muted-foreground">
              Championship-winning routines from DMC and Red Bull 3Style. Study the pros, then show us what you&apos;ve got.
            </p>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {legendaryRoutines.map((routine) => (
              <li key={routine.youtube} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-video bg-neutral-950">
                  <YouTubePlayer label="Watch routine" videoId={youtubeId(routine.youtube)!} title={`${routine.dj}: ${routine.title}`} />
                </div>
                <div className="p-5">
                  <p className="font-semibold text-foreground">{routine.dj}</p>
                  <p className="text-sm text-muted-foreground">{routine.title}</p>
                  <p className="mt-2 text-[0.9375rem] text-foreground/80">{routine.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" data-lenis-prevent-horizontal>
      <span className="shrink-0 pr-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      {children}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition ${
        active
          ? "border-[#18181b] bg-[#18181b] text-white dark:border-foreground dark:bg-foreground dark:text-background"
          : "border-border bg-card text-foreground hover:border-foreground/30"
      }`}
    >
      {children}
    </Link>
  );
}
