"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Point = { month: string; value: number | null };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const compact = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `$${n}`);

/*
 * Single-series monthly revenue line. One hue (brand), 2px line, soft area,
 * recessive grid, crosshair + tooltip on hover or arrow keys, and a visually
 * hidden table with the same numbers for screen readers.
 */
// Round axis steps (1, 2, 2.5, 5 × 10ⁿ) so small series like monthly commissions still fill the chart.
function niceStep(max: number) {
  const raw = Math.max(max, 1) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
}

export function RevenueChart({ data, year, label = "revenue" }: { data: Point[]; year: number; label?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = 260;
  const pad = { top: 16, right: 12, bottom: 28, left: 44 };
  const known = data.map((d, i) => ({ ...d, i })).filter((d): d is { month: string; value: number; i: number } => d.value !== null);
  const max = Math.max(...known.map((d) => d.value));
  const step = niceStep(max);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (innerW * i) / (data.length - 1);
  const y = (v: number) => pad.top + innerH - (innerH * v) / top;

  const line = known.map((d, k) => `${k ? "L" : "M"}${x(d.i)},${y(d.value)}`).join("");
  const area = known.length ? `${line}L${x(known.at(-1)!.i)},${y(0)}L${x(known[0].i)},${y(0)}Z` : "";
  const last = known.at(-1);
  const shown = active !== null ? known.find((d) => d.i === active) : undefined;

  function onMove(event: PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const i = Math.round(((event.clientX - rect.left) / rect.width) * (data.length - 1));
    setActive(Math.min(known.at(-1)?.i ?? 0, Math.max(0, i)));
  }

  function onKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const lastIndex = known.at(-1)?.i ?? 0;
    setActive((a) => {
      const current = a ?? lastIndex;
      return Math.min(lastIndex, Math.max(0, current + (event.key === "ArrowRight" ? 1 : -1)));
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Monthly ${label} in ${year}. Use left and right arrow keys to read each month.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          className="block overflow-visible rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="stroke-foreground/[0.07]" strokeDasharray={t ? "3 4" : undefined} />
              <text x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px]">
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text
              key={d.month}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              className={`text-[11px] ${d.value === null ? "fill-muted-foreground/45" : i === active ? "fill-foreground font-semibold" : "fill-muted-foreground"}`}
            >
              {d.month}
            </text>
          ))}

          <path d={area} fill="url(#revenue-fill)" />
          <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {shown && (
            <line x1={x(shown.i)} x2={x(shown.i)} y1={pad.top} y2={y(0)} className="stroke-foreground/25" strokeDasharray="3 3" />
          )}
          {(shown ?? last) && (
            <circle
              cx={x((shown ?? last)!.i)}
              cy={y((shown ?? last)!.value)}
              r={5}
              fill="var(--brand)"
              className="stroke-card"
              strokeWidth={2.5}
            />
          )}

          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}

      {shown && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg"
          style={{ left: x(shown.i), top: y(shown.value) - 12 }}
        >
          <p className="text-xs text-muted-foreground">
            {shown.month} {year}
          </p>
          <p className="font-semibold text-foreground tabular-nums">{money(shown.value)}</p>
        </div>
      )}

      <table className="sr-only">
        <caption>
          Monthly {label}, {year}
        </caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col" className="capitalize">
              {label}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{d.month}</th>
              <td>{d.value === null ? "Not yet" : money(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
