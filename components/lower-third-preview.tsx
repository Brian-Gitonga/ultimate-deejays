"use client";

import Image from "next/image";
import { useState, type CSSProperties, type ReactNode, type SVGProps } from "react";
import { InstagramIcon, TiktokIcon, YoutubeIcon } from "./icons";

const styles = [
  {
    key: "name",
    label: "Name strap",
    caption: "Who's playing, with a second line for the night or the venue.",
    reads: "A name strap reading Kevo Mwangi, resident DJ, Saturday sessions",
  },
  {
    key: "track",
    label: "Now playing",
    caption: "The track that's on, for everyone asking for the ID in the chat.",
    reads: "A now playing card reading Midnight in Westlands, Kevo Mwangi, extended mix",
  },
  {
    key: "socials",
    label: "Socials",
    caption: "Your handles, so people watching can find you after the set.",
    reads: "A social tag reading @kevomwangi, with the Instagram, TikTok and YouTube logos",
  },
] as const;

type StyleKey = (typeof styles)[number]["key"];

// The brand's Night and green (lib/affiliate-portal.ts), used like a broadcaster's graphics package.
const night = "bg-[#0a0f0d] text-white";
const green = "bg-[#00a76f] text-[#0a0f0d]";

/*
 * The /lower-thirds hero frame: a still from a set with a lower third on it,
 * sitting where it would on screen (bottom left, inside the title-safe area).
 * Sizes are in container units so the graphic scales with the frame, like
 * a real one scales with the video. Picking a style plays its entrance; on
 * load, and for people who prefer reduced motion, it holds still.
 */
export function LowerThirdPreview() {
  const [current, setCurrent] = useState<StyleKey>("name");
  // Every pick is a new take: the graphic remounts and plays in. Take 0 is the page load.
  const [take, setTake] = useState(0);
  const style = styles.find((s) => s.key === current) ?? styles[0];
  const on = take > 0;

  return (
    <div>
      <div className="@container relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
        <Image
          src="/images/blog/land-your-first-club-booking.jpg"
          alt="A DJ mid-set behind the decks, in front of an LED wall"
          fill
          loading="eager"
          fetchPriority="high"
          sizes="(min-width: 2240px) 1152px, (min-width: 1656px) 960px, (min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />
        <div key={take} role="img" aria-label={style.reads} className="absolute bottom-[11%] left-[5.5%] max-w-[80%] drop-shadow-[0_0.4cqw_1.2cqw_rgb(0_0_0/0.35)]">
          {current === "name" ? <NameStrap on={on} /> : current === "track" ? <NowPlaying on={on} /> : <Socials on={on} />}
        </div>
      </div>

      <div role="group" aria-label="Lower third styles" className="mt-4 flex gap-6 border-b border-border">
        {styles.map((s) => {
          const active = s.key === current;
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCurrent(s.key);
                setTake((t) => t + 1);
              }}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
        {style.caption}
      </p>
    </div>
  );
}

const delayed = (on: boolean, ms: number): CSSProperties | undefined => (on && ms ? { animationDelay: `${ms}ms` } : undefined);

/* A plate: wipes on from the left once a style is picked. */
function Plate({ on, delay = 0, className, children }: { on: boolean; delay?: number; className: string; children: ReactNode }) {
  return (
    <div className={`${className} ${on ? "motion-safe:animate-lt-in" : ""}`} style={delayed(on, delay)}>
      {children}
    </div>
  );
}

/* The words on a plate: follow it in. */
function Words({ on, delay, children }: { on: boolean; delay: number; children: ReactNode }) {
  return (
    <span className={`inline-block ${on ? "motion-safe:animate-lt-text" : ""}`} style={delayed(on, delay)}>
      {children}
    </span>
  );
}

function NameStrap({ on }: { on: boolean }) {
  return (
    <div className="flex flex-col items-start">
      <Plate on={on} className={`${night} px-[2.4cqw] py-[1.5cqw] text-[max(1rem,4.6cqw)] leading-none font-bold tracking-[-0.02em]`}>
        <Words on={on} delay={110}>
          Kevo Mwangi
        </Words>
      </Plate>
      <Plate on={on} delay={90} className={`${green} px-[2.4cqw] py-[1cqw] text-[max(0.5625rem,1.7cqw)] leading-none font-semibold tracking-[0.12em] uppercase`}>
        <Words on={on} delay={200}>
          Resident DJ · Saturday sessions
        </Words>
      </Plate>
    </div>
  );
}

function NowPlaying({ on }: { on: boolean }) {
  return (
    <Plate on={on} className={`${night} flex items-center gap-[1.8cqw] p-[1.3cqw] pr-[3cqw]`}>
      <span className={`${green} flex size-[max(2.5rem,8.6cqw)] shrink-0 items-center justify-center`}>
        <RecordMark className="size-[55%]" />
      </span>
      <Words on={on} delay={120}>
        <span className="block text-[max(0.5rem,1.45cqw)] leading-none font-semibold tracking-[0.14em] text-[#00a76f] uppercase">Now playing</span>
        <span className="mt-[0.9cqw] block text-[max(0.875rem,3.2cqw)] leading-none font-bold tracking-[-0.01em]">Midnight in Westlands</span>
        <span className="mt-[0.8cqw] block text-[max(0.625rem,1.8cqw)] leading-none text-white/65">Kevo Mwangi · Extended mix</span>
      </Words>
    </Plate>
  );
}

function Socials({ on }: { on: boolean }) {
  const icon = "size-[max(0.8rem,2.7cqw)]";
  return (
    <div className="flex items-stretch">
      <Plate on={on} className={`${green} flex items-center gap-[1.3cqw] px-[1.9cqw]`}>
        <InstagramIcon className={icon} />
        <TiktokIcon className={icon} />
        <YoutubeIcon className={icon} />
      </Plate>
      <Plate on={on} delay={90} className={`${night} px-[2.4cqw] py-[1.6cqw] text-[max(0.9375rem,3.8cqw)] leading-none font-bold tracking-[-0.01em]`}>
        <Words on={on} delay={180}>
          @kevomwangi
        </Words>
      </Plate>
    </div>
  );
}

/* The record mark from the logo, standing in for cover art. */
function RecordMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  );
}
