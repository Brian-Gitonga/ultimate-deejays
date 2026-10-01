"use client";

import { useSyncExternalStore } from "react";

// Ticks once a minute; the server renders the plain date instead, so nothing mismatches on hydration.
const subscribe = (tick: () => void) => {
  const timer = setInterval(tick, 30_000);
  return () => clearInterval(timer);
};
const currentMinute = () => Math.floor(Date.now() / 60_000);

/** "12d 4h 33m left", counting down to the end of `until` (a YYYY-MM-DD date, UTC). */
export function Countdown({ until, fallback, className }: { until: string; fallback: string; className?: string }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  if (minute === null) return <span className={className}>{fallback}</span>;

  const end = Date.parse(`${until}T23:59:59Z`) / 60_000;
  const left = Math.max(0, Math.floor(end - minute));
  const days = Math.floor(left / 1440);
  const hours = Math.floor((left % 1440) / 60);
  const minutes = left % 60;

  return (
    <span className={className}>
      <span className="tabular-nums">{left === 0 ? "Closing now" : days ? `${days}d ${hours}h ${minutes}m left` : `${hours}h ${minutes}m left`}</span>
    </span>
  );
}
