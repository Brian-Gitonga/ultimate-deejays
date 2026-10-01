import type { ReactNode } from "react";

/*
 * Placeholder partner logos — swap these for real venue / partner logos
 * (SVG or PNG in /public) once you have permission to use them.
 */
const logos: { color: string; mark: ReactNode; word: ReactNode }[] = [
  {
    color: "text-[#1f57bf]",
    mark: <circle cx="12" cy="12" r="9" strokeWidth="4" fill="none" stroke="currentColor" strokeDasharray="42 15" />,
    word: <span className="text-[1.5em] font-extrabold tracking-tight uppercase">Logoipsum</span>,
  },
  {
    color: "text-neutral-700",
    mark: <path d="M12 2 22 12 12 22 2 12Z M12 7 17 12 12 17 7 12Z" fillRule="evenodd" fill="currentColor" />,
    word: <span className="text-[1.5em] font-light tracking-[0.2em] uppercase">Logoipsum</span>,
  },
  {
    color: "text-neutral-900",
    mark: null,
    word: <span className="font-serif text-[1.75em] font-bold italic">Logoipsum</span>,
  },
  {
    color: "text-[#1e3a8a]",
    mark: <path d="M4 20V9l8-6 8 6v11h-6v-6h-4v6Z" fill="currentColor" />,
    word: <span className="text-[1.5em] font-semibold">Logoipsum</span>,
  },
  {
    color: "text-[#6d28d9]",
    mark: (
      <>
        <circle cx="13" cy="13" r="8" strokeWidth="3.5" fill="none" stroke="currentColor" />
        <path d="M3 3h4M5 1v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    word: <span className="text-[1.5em] font-bold tracking-tight">Logoipsum</span>,
  },
  {
    color: "text-[#1e40af]",
    mark: <path d="M3 5h18v14H3Z M8 5v14M16 5v14M3 12h18" fill="none" stroke="currentColor" strokeWidth="2.5" />,
    word: <span className="font-serif text-[1.625em] font-semibold">Logoipsum</span>,
  },
];

export function TrustedBy() {
  return (
    <section className="site-container pb-16">
      <p className="text-center text-base text-muted-foreground sm:text-[1.0625rem]">
        Trusted by DJs now playing clubs, festivals and events worldwide
      </p>
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 text-[0.8125rem] sm:gap-x-12 sm:gap-y-8 sm:text-sm xl:flex-nowrap xl:justify-between xl:gap-x-6 xl:text-[0.9375rem]">
        {logos.map((logo, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 ${logo.color} dark:text-neutral-400`}
            aria-label="Partner logo placeholder"
          >
            {logo.mark && (
              <svg viewBox="0 0 24 24" className="size-[2em]" aria-hidden="true">
                {logo.mark}
              </svg>
            )}
            <span aria-hidden="true">{logo.word}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
