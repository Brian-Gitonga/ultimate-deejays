import Image from "next/image";
import { NewsletterForm } from "./newsletter-form";

const subscribers = [1, 2, 3, 4, 5].map((n) => `/images/students/student-${n}.jpg`);

export function Newsletter() {
  return (
    <section aria-labelledby="newsletter-title" className="site-container pb-16 lg:pb-24">
      <div className="reveal relative isolate overflow-hidden rounded-[1.75rem] bg-brand-deep px-6 py-12 text-center sm:px-12 lg:rounded-[2.5rem] lg:py-16">
        <DoodlePattern />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(50%_70%_at_50%_45%,rgb(0_120_103/0.95),transparent_80%)]"
        />

        <h2 id="newsletter-title" className="text-[1.75rem] leading-tight font-bold tracking-tight text-white sm:text-[2rem]">
          Subscribe to Our Newsletter
        </h2>
        <p className="mx-auto mt-4 max-w-[32.5rem] text-base leading-relaxed text-white/85 sm:text-[1.0625rem]">
          New lessons, free practice packs and gig tips in your inbox every week. No spam, ever.
        </p>

        <NewsletterForm />

        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex">
            {subscribers.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                width={80}
                height={80}
                className={`size-9 rounded-full object-cover ring-2 ring-brand-deep ${i > 0 ? "-ml-2.5" : ""}`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-white sm:text-base">+2,000 DJs already subscribed</p>
        </div>
      </div>
    </section>
  );
}

/* Faint hand-drawn-style DJ doodles tiled across the card (the reference uses school doodles). */
function DoodlePattern() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 -z-20 size-full text-white/[0.09]">
      <defs>
        <pattern id="dj-doodles" width="260" height="260" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
            {/* Headphones */}
            <g transform="translate(16 18) scale(2.6) rotate(-14 12 12)">
              <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
            </g>
            {/* Vinyl record */}
            <g transform="translate(142 10) scale(2.8)">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6.5" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12c0-1.7.7-3.2 1.8-4.2M18 12c0 1.7-.7 3.2-1.8 4.2" />
            </g>
            {/* Single note */}
            <g transform="translate(212 104) scale(1.8) rotate(12 12 12)">
              <circle cx="8" cy="18" r="4" />
              <path d="M12 18V2l7 4" />
            </g>
            {/* Mixer faders */}
            <g transform="translate(24 138) scale(2.4) rotate(8 12 12)">
              <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" />
            </g>
            {/* Speaker */}
            <g transform="translate(118 124) scale(2.6) rotate(-8 12 12)">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <circle cx="12" cy="14" r="4" />
              <circle cx="12" cy="6" r="1" />
            </g>
            {/* Waveform */}
            <g transform="translate(188 200) scale(2)">
              <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" />
            </g>
            {/* Double note */}
            <g transform="translate(88 70) scale(1.5) rotate(-10 12 12)">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </g>
            {/* Microphone */}
            <g transform="translate(40 208) scale(1.9) rotate(18 12 12)">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dj-doodles)" />
    </svg>
  );
}
