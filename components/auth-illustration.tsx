import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { AwardIcon, CheckIcon, DiscIcon, HeadphonesIcon, MusicIcon, StarIcon } from "./icons";

/*
 * The DJ take on the reference's "learning dashboard" illustration: a tablet
 * showing a practice dashboard, with a spinning record, headphones, notes and
 * stars floating around it. Every size is in container units (cqw), so the
 * whole composition scales as one piece. Purely decorative.
 */
export function AuthIllustration() {
  return (
    <div aria-hidden="true" className="@container relative mx-auto aspect-[6/5] w-full max-w-[33.75rem] select-none">
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,var(--glow-mint),transparent_68%)]" />

      <StudioTablet />

      {/* Spinning record, top right */}
      <div className="absolute top-[4%] right-[3%] w-[31%] drop-shadow-[0_3cqw_4cqw_rgb(0_0_0/0.25)]">
        <svg viewBox="0 0 100 100" className="w-full motion-safe:animate-[spin_9s_linear_infinite]">
          <circle cx="50" cy="50" r="48.5" fill="#141414" stroke="#fff" strokeOpacity="0.12" strokeWidth="1" />
          {[44, 39, 34, 29].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" />
          ))}
          <path d="M20 30a36 36 0 0 1 22-14" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="50" r="17" fill="#00a76f" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="2.6" fill="#f5f5f5" />
        </svg>
      </div>

      {/* Headphones tile, top left */}
      <Floating className="top-[5%] left-[2%] w-[16%]" delay="-2s">
        <div className="flex aspect-square -rotate-12 items-center justify-center rounded-[3.6cqw] bg-linear-to-br from-[#8fd0ff] to-[#3d7fe0] text-white shadow-[0_2.4cqw_4cqw_-1.2cqw_rgb(31_87_191/0.55)]">
          <HeadphonesIcon className="w-[58%]" strokeWidth={2.2} />
        </div>
      </Floating>

      {/* Notes and stars */}
      <Floating className="top-[6%] left-[36%] w-[8%] text-accent-rose" delay="-1s">
        <MusicIcon className="w-full rotate-12" strokeWidth={2.6} />
      </Floating>
      <StarIcon fill="currentColor" className="absolute top-[17%] left-[50%] w-[5%] rotate-12 text-accent-yellow" />
      <StarIcon fill="currentColor" className="absolute top-[4%] left-[26%] w-[3.4%] -rotate-12 text-accent-rose" />
      <StarIcon fill="currentColor" className="absolute top-[52%] right-[2%] w-[5%] text-accent-yellow" />
      <StarIcon fill="currentColor" className="absolute bottom-[34%] left-[1%] w-[5%] -rotate-12 text-accent-yellow" />
      <StarIcon fill="currentColor" className="absolute bottom-[24%] left-[9%] w-[4%] rotate-12 text-accent-rose" />
      <span className="absolute top-[45%] left-[6%] size-[2.6cqw] rounded-full bg-accent-blue" />
      <span className="absolute bottom-[4%] left-[44%] size-[2.2cqw] rounded-full bg-[#9b87f5]" />

      {/* Lesson complete badge */}
      <Floating className="top-[62%] right-[6%] w-[9%]" delay="-3.5s">
        <span className="flex aspect-square items-center justify-center rounded-full bg-[#34c796] text-white shadow-[0_1.6cqw_3cqw_-1cqw_rgb(0_167_111/0.7)] ring-[length:0.8cqw] ring-white/70">
          <CheckIcon className="w-[55%]" strokeWidth={3} />
        </span>
      </Floating>

      {/* Now mixing chip, bottom left */}
      <Floating className="bottom-[7%] left-[3%]" delay="-4s">
        <div className="flex items-center gap-[1.8cqw] rounded-[2.6cqw] border-[length:0.35cqw] border-glass-border bg-glass px-[2.6cqw] py-[1.8cqw] shadow-[0_2cqw_5cqw_-1.5cqw_rgb(0_0_0/0.25)] backdrop-blur-md">
          <span className="flex h-[4.4cqw] items-end gap-[0.6cqw]">
            {[0, -0.3, -0.6, -0.15].map((delay, i) => (
              <span
                key={i}
                style={{ animationDelay: `${delay}s` } as CSSProperties}
                className="h-full w-[0.9cqw] origin-bottom scale-y-50 rounded-full bg-brand motion-safe:animate-eq"
              />
            ))}
          </span>
          <span className="leading-tight">
            <span className="block text-[1.9cqw] text-muted-foreground">Now mixing</span>
            <span className="block text-[2.3cqw] font-semibold whitespace-nowrap text-foreground">Harmonic Mixing</span>
          </span>
        </div>
      </Floating>

      {/* Practice streak chip, bottom right */}
      <Floating className="right-[4%] bottom-[12%]" delay="-1.5s">
        <div className="flex items-center gap-[1.6cqw] rounded-[2.6cqw] border-[length:0.35cqw] border-glass-border bg-glass px-[2.2cqw] py-[1.6cqw] shadow-[0_2cqw_5cqw_-1.5cqw_rgb(0_0_0/0.25)] backdrop-blur-md">
          <span className="flex size-[5cqw] items-center justify-center rounded-[1.4cqw] bg-accent-yellow text-neutral-900">
            <AwardIcon className="w-[60%]" strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block text-[2.3cqw] font-semibold text-foreground">7-day streak</span>
            <span className="block text-[1.9cqw] text-muted-foreground">Keep practicing!</span>
          </span>
        </div>
      </Floating>
    </div>
  );
}

function Floating({ className, delay, children }: { className: string; delay: string; children: ReactNode }) {
  return (
    <div style={{ animationDelay: delay }} className={`absolute motion-safe:animate-float ${className}`}>
      {children}
    </div>
  );
}

const waveform = [34, 58, 42, 76, 50, 88, 64, 40, 70, 96, 60, 46, 80, 52, 36, 62];

function StudioTablet() {
  return (
    <div className="absolute top-[22%] left-[13%] w-[68%] motion-safe:animate-float">
      <div className="rounded-[3.2cqw] bg-neutral-900 p-[1.3cqw] shadow-[0_4cqw_7cqw_-2.5cqw_rgb(0_0_0/0.4)]">
        <div className="rounded-[2.2cqw] bg-[#eef2fb] p-[2.4cqw] dark:bg-neutral-800">
          <div className="flex gap-[0.8cqw]">
            <span className="size-[1.1cqw] rounded-full bg-[#ff6b6b]" />
            <span className="size-[1.1cqw] rounded-full bg-[#ffc93c]" />
            <span className="size-[1.1cqw] rounded-full bg-[#34c796]" />
          </div>
          <p className="mt-[1.4cqw] text-[2.5cqw] font-extrabold tracking-wide text-[#2b3150] dark:text-white">MY DJ STUDIO</p>

          <div className="mt-[1.6cqw] grid grid-cols-[0.62fr_1fr_1fr] grid-rows-2 gap-[1.4cqw]">
            {/* Profile */}
            <div className="row-span-2 flex flex-col items-center rounded-[1.6cqw] bg-[#a8e6cf] px-[1cqw] py-[1.8cqw]">
              <Image
                src="/images/students/student-2.jpg"
                alt=""
                width={96}
                height={96}
                className="size-[7cqw] rounded-full object-cover ring-[length:0.5cqw] ring-white"
              />
              <span className="mt-[1.6cqw] h-[0.8cqw] w-[70%] rounded-full bg-white/80" />
              <span className="mt-[0.9cqw] h-[0.8cqw] w-[50%] rounded-full bg-white/60" />
              <div className="mt-[1.8cqw] w-full space-y-[1cqw] px-[0.6cqw]">
                {["bg-accent-blue", "bg-accent-yellow", "bg-accent-rose"].map((dot) => (
                  <div key={dot} className="flex items-center gap-[0.8cqw]">
                    <span className={`size-[1cqw] shrink-0 rounded-full ${dot}`} />
                    <span className="h-[0.6cqw] flex-1 rounded-full bg-white/70" />
                  </div>
                ))}
              </div>
            </div>

            <Tile label="Course progress">
              <div className="mt-[1.4cqw] space-y-[1cqw]">
                {[
                  ["w-[80%]", "bg-accent-blue"],
                  ["w-[55%]", "bg-accent-rose"],
                  ["w-[35%]", "bg-brand"],
                ].map(([width, color]) => (
                  <div key={color} className="h-[0.9cqw] rounded-full bg-[#e3e7f3] dark:bg-white/10">
                    <div className={`h-full rounded-full ${width} ${color}`} />
                  </div>
                ))}
              </div>
            </Tile>

            <Tile label="Your last mix">
              <div className="mt-[1.2cqw] flex h-[5.4cqw] items-end gap-[0.4cqw]">
                {waveform.map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${height}%` }}
                    className="flex-1 rounded-full bg-linear-to-t from-brand to-[#5ec8f2]"
                  />
                ))}
              </div>
            </Tile>

            <Tile label="Lessons done">
              <div className="mt-[1.2cqw] flex gap-[1cqw]">
                <span className="flex size-[5cqw] items-center justify-center rounded-[1.2cqw] bg-[#34c796] text-white">
                  <DiscIcon className="w-[58%]" strokeWidth={2.4} />
                </span>
                <span className="flex size-[5cqw] items-center justify-center rounded-[1.2cqw] bg-accent-rose text-white">
                  <HeadphonesIcon className="w-[58%]" strokeWidth={2.4} />
                </span>
              </div>
            </Tile>

            <Tile label="Badges">
              <div className="mt-[1.2cqw] flex gap-[0.9cqw]">
                <Medal className="bg-[#ffb938]">
                  <StarIcon fill="currentColor" className="w-[55%]" />
                </Medal>
                <Medal className="bg-[#34c796]">
                  <CheckIcon className="w-[55%]" strokeWidth={3.2} />
                </Medal>
                <Medal className="bg-[#8b7cf6]">
                  <MusicIcon className="w-[52%]" strokeWidth={2.8} />
                </Medal>
              </div>
            </Tile>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.6cqw] bg-white p-[1.4cqw] shadow-[0_0.4cqw_1.2cqw_rgb(0_0_0/0.06)] dark:bg-neutral-900">
      <p className="text-[1.25cqw] font-bold tracking-wide text-[#3b4160] uppercase dark:text-white/80">{label}</p>
      {children}
    </div>
  );
}

function Medal({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`flex size-[4.4cqw] items-center justify-center rounded-full text-white ring-[length:0.4cqw] ring-white shadow-[0_0.6cqw_1cqw_rgb(0_0_0/0.15)] dark:ring-neutral-900 ${className}`}>
      {children}
    </span>
  );
}
