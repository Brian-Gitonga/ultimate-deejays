import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ChallengeCard, challengeDate, statusStyles } from "@/components/challenge-card";
import { ChallengeEntryForm } from "@/components/challenge-entry-form";
import { Countdown } from "@/components/countdown";
import { AwardIcon, CalendarIcon, CheckIcon, ChevronRightIcon, HomeIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import { YouTubePlayer } from "@/components/youtube-player";
import { challengeTypes, challenges, getChallenge, type Challenge } from "@/lib/challenges";
import { youtubeId } from "@/lib/curriculum";
import { siteName, siteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return challenges.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/challenges/[slug]">): Promise<Metadata> {
  const challenge = getChallenge((await params).slug);
  if (!challenge) return {};
  const title = `${challenge.title}: DJ Challenge`;
  return {
    title,
    description: `${challenge.tagline} ${challenge.brief.split(". ")[0]}.`,
    alternates: { canonical: `/challenges/${challenge.slug}` },
    openGraph: { type: "website", title, description: challenge.tagline, url: `/challenges/${challenge.slug}`, siteName, images: [challenge.image] },
  };
}

const longDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function ChallengePage({ params }: PageProps<"/challenges/[slug]">) {
  const challenge = getChallenge((await params).slug);
  if (!challenge) notFound();

  const status = statusStyles[challenge.status];
  const type = challengeTypes.find((t) => t.slug === challenge.type)?.name;
  const more = challenges.filter((c) => c.slug !== challenge.slug && c.status !== "ended").slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${challenge.title} DJ Challenge`,
    description: challenge.brief,
    startDate: challenge.opens,
    endDate: challenge.closes,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: new URL(`/challenges/${challenge.slug}`, siteUrl).toString() },
    image: new URL(challenge.image, siteUrl).toString(),
    organizer: { "@type": "Organization", name: siteName, url: siteUrl },
  };

  return (
    <main className="flex-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
        <Image src={challenge.image} alt="" fill loading="eager" sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />
        <div className="site-container py-12 lg:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
              <li>
                <Link href="/" className="flex items-center hover:text-white">
                  <HomeIcon className="size-4" />
                  <span className="sr-only">Home</span>
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRightIcon className="size-3.5" /></li>
              <li><Link href="/challenges" className="hover:text-white">Challenges</Link></li>
              <li aria-hidden="true"><ChevronRightIcon className="size-3.5" /></li>
              <li aria-current="page" className="text-white">{challenge.title}</li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">{type}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">{challenge.difficulty}</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-[2.25rem] leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">{challenge.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{challenge.tagline}</p>

          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<CalendarIcon className="size-4" />} label={challenge.status === "upcoming" ? "Opens" : "Closes"}>
              {challenge.status === "live" ? (
                <Countdown until={challenge.closes} fallback={challengeDate.format(new Date(challenge.closes))} />
              ) : (
                challengeDate.format(new Date(challenge.status === "upcoming" ? challenge.opens : challenge.closes))
              )}
            </Stat>
            <Stat icon={<UsersIcon className="size-4" />} label="Entries">
              {challenge.status === "upcoming" ? "Not open yet" : challenge.entries}
            </Stat>
            <Stat icon={<AwardIcon className="size-4" />} label="Level">{challenge.difficulty}</Stat>
            <Stat icon={<TrophyIcon className="size-4" />} label="Prize">Winner featured</Stat>
          </dl>
        </div>
      </section>

      <div className="site-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14 lg:py-16">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="brief-title">
            <h2 id="brief-title" className="text-2xl font-bold tracking-tight text-foreground">The brief</h2>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-foreground/80">{challenge.brief}</p>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-yellow/15 p-4 text-[0.9375rem] text-foreground">
              <TrophyIcon className="mt-0.5 size-5 shrink-0 text-accent-amber" />
              <span><span className="font-semibold">Prize:</span> {challenge.prize}</span>
            </p>
          </section>

          <section aria-labelledby="rules-title">
            <h2 id="rules-title" className="text-2xl font-bold tracking-tight text-foreground">Rules</h2>
            <ul className="mt-4 space-y-3">
              {challenge.rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-[1.0625rem] text-foreground/80">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="judging-title">
            <h2 id="judging-title" className="text-2xl font-bold tracking-tight text-foreground">How it&apos;s judged</h2>
            <ul className="mt-4 space-y-4">
              {challenge.judging.map((item) => (
                <li key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.weight}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${item.weight}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {challenge.winners && <Winners challenge={challenge} />}

          <section aria-labelledby="inspiration-title">
            <h2 id="inspiration-title" className="text-2xl font-bold tracking-tight text-foreground">Get inspired</h2>
            <p className="mt-2 text-muted-foreground">Routines from the pros that show what this challenge is about.</p>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2">
              {challenge.inspiration.map((video) => (
                <li key={video.youtube} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative aspect-video bg-neutral-950">
                    <YouTubePlayer label="Watch routine" videoId={youtubeId(video.youtube)!} title={`${video.dj}: ${video.title}`} />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-foreground">{video.dj}</p>
                    <p className="text-sm text-muted-foreground">{video.title}</p>
                    <p className="mt-2 text-sm text-foreground/80">{video.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside id="enter" aria-labelledby="enter-title" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] dark:border-white/10">
            {challenge.status === "live" && (
              <>
                <h2 id="enter-title" className="text-xl font-semibold text-foreground">Enter this challenge</h2>
                <p className="mt-1 mb-5 text-sm text-muted-foreground">
                  Entries close {longDate.format(new Date(challenge.closes))}.
                </p>
                <ChallengeEntryForm challenge={challenge.slug} />
              </>
            )}
            {challenge.status === "upcoming" && (
              <>
                <h2 id="enter-title" className="text-xl font-semibold text-foreground">Opens {longDate.format(new Date(challenge.opens))}</h2>
                <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                  Start practicing now. Read the brief, study the routines and get your setup ready to record.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#18181b] text-[0.9375rem] font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
                >
                  Create an account to enter
                </Link>
              </>
            )}
            {challenge.status === "ended" && (
              <>
                <h2 id="enter-title" className="text-xl font-semibold text-foreground">This challenge has ended</h2>
                <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                  {challenge.entries} DJs entered. Congratulations to the winners, and thanks to everyone who took part.
                </p>
                <Link
                  href="/challenges?status=live#all-challenges"
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#18181b] text-[0.9375rem] font-semibold text-white hover:bg-[#27272a] dark:bg-foreground dark:text-background"
                >
                  See live challenges
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      {more.length > 0 && (
        <section aria-labelledby="more-title" className="border-t border-border bg-cream py-16">
          <div className="site-container">
            <h2 id="more-title" className="text-[1.75rem] font-bold tracking-tight text-foreground">More challenges</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((c) => (
                <li key={c.slug}>
                  <ChallengeCard challenge={c} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-md">
      <dt className="flex items-center gap-1.5 text-xs text-white/65">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
    </div>
  );
}

const podium = { 1: "order-2 sm:-mt-6 bg-accent-yellow/20 border-accent-yellow/40", 2: "order-1", 3: "order-3" } as const;
const medal = { 1: "bg-accent-yellow text-neutral-900", 2: "bg-neutral-300 text-neutral-900", 3: "bg-[#d99a6c] text-neutral-900" } as const;

function Winners({ challenge }: { challenge: Challenge }) {
  return (
    <section aria-labelledby="winners-title">
      <h2 id="winners-title" className="text-2xl font-bold tracking-tight text-foreground">Winners</h2>
      <ol className="mt-8 grid grid-cols-3 items-end gap-3 sm:gap-5">
        {challenge.winners!.map((w) => (
          <li key={w.place} className={`flex flex-col items-center rounded-2xl border border-border p-4 text-center sm:p-6 ${podium[w.place]}`}>
            <span className="relative">
              <Image src={w.avatar} alt="" width={96} height={96} className="size-14 rounded-full object-cover sm:size-20" />
              <span className={`absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full text-sm font-bold ring-2 ring-background ${medal[w.place]}`}>
                {w.place}
              </span>
            </span>
            <span className="mt-3 font-semibold text-foreground">{w.name}</span>
            <span className="text-xs text-muted-foreground">{w.city}</span>
            <span className="sr-only">Place {w.place}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
