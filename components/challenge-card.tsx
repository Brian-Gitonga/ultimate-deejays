import Image from "next/image";
import Link from "next/link";
import { challengeTypes, type Challenge } from "@/lib/challenges";
import { Countdown } from "./countdown";
import { CalendarIcon, TrophyIcon, UsersIcon } from "./icons";

export const challengeDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const statusStyles: Record<Challenge["status"], { label: string; className: string }> = {
  live: { label: "Live now", className: "bg-brand text-white" },
  upcoming: { label: "Coming soon", className: "bg-accent-yellow text-neutral-900" },
  ended: { label: "Ended", className: "bg-neutral-900/80 text-white" },
};

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const status = statusStyles[challenge.status];
  const type = challengeTypes.find((t) => t.slug === challenge.type)?.name;
  const winner = challenge.winners?.find((w) => w.place === 1);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-black/[0.06] bg-card p-2 shadow-[0_8px_30px_-6px_rgb(0_0_0/0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-14px_rgb(0_0_0/0.2)] dark:border-white/10">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <Image
          src={challenge.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 46vw, 92vw"
          className={`object-cover transition duration-500 group-hover:scale-105 ${challenge.status === "ended" ? "grayscale-[40%]" : ""}`}
        />
        <span className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
          {challenge.status === "live" && <span className="size-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" />}
          {status.label}
        </span>
        <span className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-xs font-medium text-white">
          <span>{type} · {challenge.difficulty}</span>
          {challenge.status !== "upcoming" && (
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="size-3.5" />
              {challenge.entries} entries
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        <h3 className="text-lg leading-snug font-semibold text-foreground">
          <Link
            href={`/challenges/${challenge.slug}`}
            className="outline-none transition-colors group-hover:text-brand after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand"
          >
            {challenge.title}
          </Link>
        </h3>
        <p className="mt-1 mb-4 text-[0.9375rem] text-muted-foreground">{challenge.tagline}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          {challenge.status === "live" && (
            <Countdown
              until={challenge.closes}
              fallback={`Closes ${challengeDate.format(new Date(challenge.closes))}`}
              className="font-medium text-brand-deep dark:text-brand"
            />
          )}
          {challenge.status === "upcoming" && (
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <CalendarIcon className="size-4 text-muted-foreground" />
              Opens {challengeDate.format(new Date(challenge.opens))}
            </span>
          )}
          {challenge.status === "ended" && winner && (
            <span className="inline-flex min-w-0 items-center gap-2 text-foreground">
              <Image src={winner.avatar} alt="" width={48} height={48} className="size-6 rounded-full object-cover" />
              <span className="truncate">Won by {winner.name}</span>
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground" title={challenge.prize}>
            <TrophyIcon className="size-4 text-accent-amber" />
            Prize
          </span>
        </div>
      </div>
    </article>
  );
}
