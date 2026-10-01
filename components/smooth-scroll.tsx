"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/*
 * Eases mouse-wheel and trackpad scrolling with Lenis. The page still scrolls
 * natively underneath, so the sticky header, scroll-driven reveals and
 * carousels keep working. Touch devices keep native scrolling, and Lenis
 * switches itself off for users who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      // In-page #links glide too, stopping short of the sticky header (reads scroll-padding-top).
      anchors: true,
      stopInertiaOnNavigate: true,
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
