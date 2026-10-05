"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

type Position = { index: number; count: number; atStart: boolean; atEnd: boolean };

/*
 * Horizontal carousel built on native scroll-snap, so touch, trackpad and
 * keyboard scrolling all work. The dots and arrows read and drive the scroll
 * position; each dot is one snap position, not one slide.
 */
export function Carousel({
  label,
  slideClassName,
  controls = "bottom",
  children,
}: {
  label: string;
  /** Width of each slide, e.g. "basis-[85%] md:basis-[calc((100%-1.5rem)/2)]" (gap is 1.5rem). */
  slideClassName: string;
  controls?: "bottom" | "sides";
  children: ReactNode;
}) {
  const slides = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position>({ index: 0, count: 0, atStart: true, atEnd: false });

  // Distance between two snap positions: one slide plus the gap.
  const step = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return 0;
    return first.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const size = step();
        if (!size) return;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const count = Math.max(1, Math.round(maxScroll / size) + 1);
        const next: Position = {
          index: Math.min(count - 1, Math.round(track.scrollLeft / size)),
          count,
          atStart: track.scrollLeft <= 2,
          atEnd: track.scrollLeft >= maxScroll - 2,
        };
        setPos((prev) =>
          prev.index === next.index &&
          prev.count === next.count &&
          prev.atStart === next.atStart &&
          prev.atEnd === next.atEnd
            ? prev
            : next,
        );
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    track.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", measure);
    };
  }, [step]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: Math.min(index * step(), track.scrollWidth - track.clientWidth),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const prev = (
    <ArrowButton direction="prev" disabled={pos.atStart} onClick={() => goTo(pos.index - 1)} sides={controls === "sides"} />
  );
  const next = (
    <ArrowButton direction="next" disabled={pos.atEnd} onClick={() => goTo(pos.index + 1)} sides={controls === "sides"} />
  );

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="relative">
      <div
        ref={trackRef}
        tabIndex={0}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto overscroll-x-contain px-4 pt-2 pb-8 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            className={`shrink-0 snap-start ${slideClassName}`}
          >
            {slide}
          </div>
        ))}
      </div>

      {controls === "bottom" ? (
        <div className="mt-2 flex items-center justify-between gap-6">
          <div className="flex h-2.5 items-center gap-2">
            {pos.count > 1 &&
              Array.from({ length: pos.count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to position ${i + 1} of ${pos.count}`}
                  aria-current={i === pos.index || undefined}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === pos.index ? "w-6 bg-foreground" : "w-2 bg-foreground/15 hover:bg-foreground/30"
                  }`}
                />
              ))}
          </div>
          <div className="flex gap-3">
            {prev}
            {next}
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-[calc(50%-12px)] left-2 -translate-y-1/2 sm:left-0 sm:-translate-x-1/2">{prev}</div>
          <div className="absolute top-[calc(50%-12px)] right-2 -translate-y-1/2 sm:right-0 sm:translate-x-1/2">{next}</div>
        </>
      )}
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
  sides,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  sides: boolean;
}) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous slides" : "Next slides"}
      className={`inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-xs transition hover:border-foreground/20 hover:bg-muted disabled:pointer-events-none ${
        sides ? "shadow-[0_6px_20px_rgb(0_0_0/0.12)] disabled:opacity-0" : "disabled:opacity-40"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}
