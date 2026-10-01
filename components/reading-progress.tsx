"use client";

import { useEffect, useRef } from "react";

/*
 * Thin bar across the top of the window showing how far through the article
 * you are. It writes the transform directly so scrolling never re-renders React.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const target = document.getElementById(targetId);
    if (!bar || !target) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight * 0.6;
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
        bar.style.transform = `scaleX(${progress})`;
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[0.1875rem]">
      <div
        ref={barRef}
        style={{ transform: "scaleX(0)" }}
        className="h-full origin-left bg-linear-to-r from-brand to-[#0a6fb8]"
      />
    </div>
  );
}
