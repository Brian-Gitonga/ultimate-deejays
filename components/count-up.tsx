"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Counts up to `value` the first time it scrolls into view. The final number is
 * what the server renders and what screen readers get; only the visible copy
 * animates, and only if it starts below the fold.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1600,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // null means "show the final value"
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    let frame = requestAnimationFrame(() => setShown(0));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          setShown(t < 1 ? value * (1 - Math.pow(1 - t, 3)) : null);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  const text = (n: number) => `${n.toFixed(decimals)}${suffix}`;

  return (
    <span ref={ref}>
      <span aria-hidden="true" className="tabular-nums">
        {text(shown ?? value)}
      </span>
      <span className="sr-only">{text(value)}</span>
    </span>
  );
}
