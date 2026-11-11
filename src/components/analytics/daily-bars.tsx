"use client";

import { useState } from "react";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

export type DailyPoint = { date: string; label: string; tick: string; value: number; valueLabel: string; detail: string };

/**
 * Single-series daily bar chart. Bars are anchored to the baseline with a rounded data end,
 * gridlines stay recessive, and every bar has a hover/focus tooltip larger than the mark.
 */
/** Values are paise; the axis is labelled in rupees. */
export function DailyBars({ points }: { points: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...points.map((p) => p.value), 100000);
  const nice = niceMax(max);
  const ticks = [0, nice / 2, nice];
  const H = 220;
  const labelEvery = Math.ceil(points.length / 8);
  const hovered = active === null ? null : points[active];

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="relative w-12 shrink-0 text-right text-[11px] tabular-nums text-muted" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: H - (t / nice) * H }}>
              {formatPaise(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="relative" style={{ height: H }} onMouseLeave={() => setActive(null)}>
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-border/70" style={{ top: H - (t / nice) * H }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {points.map((p, i) => {
                const h = p.value === 0 ? 0 : Math.max((p.value / nice) * H, 3);
                return (
                  <button
                    key={p.date}
                    type="button"
                    className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-offset-0"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    aria-label={`${p.label}: ${p.valueLabel}, ${p.detail}`}
                  >
                    <span
                      className={cn(
                        "block w-full max-w-6 rounded-t-[4px] bg-accent transition-opacity",
                        active !== null && active !== i && "opacity-40",
                      )}
                      style={{ height: h }}
                    />
                  </button>
                );
              })}
            </div>
            {hovered && active !== null ? (
              <div
                role="status"
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border bg-surface px-3 py-2 text-xs shadow-lg"
                style={{ left: `${((active + 0.5) / points.length) * 100}%` }}
              >
                <p className="font-medium text-foreground">{hovered.label}</p>
                <p className="tabular-nums text-foreground">{hovered.valueLabel}</p>
                <p className="text-muted">{hovered.detail}</p>
              </div>
            ) : null}
          </div>
          <div className="mt-2 flex gap-[2px] text-[11px] text-muted">
            {points.map((p, i) => (
              <span key={p.date} className="min-w-0 flex-1 text-center">
                {i % labelEvery === 0 ? p.tick : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function niceMax(v: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return step * exp;
}
