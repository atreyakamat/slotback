"use client";

import { MessageCircle } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCountUp, useInView, useReducedMotion } from "./use-motion";

/** Columns are 30-minute slots from 10:00 to 18:00. */
const COLS = 16;
const STAFF = [
  { name: "Sneha", blocks: [{ c: 0, w: 4, who: "Ananya" }, { c: 5, w: 3, who: "Kavita" }, { c: 10, w: 5, who: "Tara" }] },
  { name: "Ryan", blocks: [{ c: 1, w: 2, who: "Joel" }, { c: 4, w: 2, who: "Arjun" }, { c: 8, w: 3, who: "Leon" }, { c: 13, w: 2, who: "Dylan" }] },
  { name: "Aisha", blocks: [{ c: 0, w: 2, who: "Neha" }, { c: 3, w: 2, who: "Riya" }, { c: 8, w: 2, who: "Divya", target: true }, { c: 12, w: 3, who: "Zoya" }] },
  { name: "Tanvi", blocks: [{ c: 2, w: 4, who: "Sara" }, { c: 7, w: 2, who: "Melissa" }, { c: 11, w: 4, who: "Alisha" }] },
];
const WAITLIST = ["F", "I", "A", "K", "S"];
const WINNER = 0;
const STEP_MS = [1600, 1700, 2100, 1700, 2600];

type Stage = 0 | 1 | 2 | 3 | 4;

/**
 * The product loop on a day grid: an appointment cancels, the opening is offered to the waitlist,
 * one customer claims it and the slot fills again. Loops while visible; static (finished) for reduced motion.
 */
export function SlotBoard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [tick, setTick] = useState(0);
  const stage = (reduce ? 4 : tick % 5) as Stage;

  useEffect(() => {
    if (reduce || !inView) return;
    const id = window.setTimeout(() => setTick((t) => t + 1), STEP_MS[tick % 5]);
    return () => window.clearTimeout(id);
  }, [tick, inView, reduce]);

  // The recovered counter counts up when the slot fills, and resets with the loop.
  const shown = useCountUp(stage === 4 ? 1800 : 0, { duration: 1100, from: 0 });

  const status =
    stage === 0
      ? "A normal Saturday at Casa Verde"
      : stage === 1
        ? "Divya cancels her 2:00 pm facial"
        : stage === 2
          ? "Offered to 5 on the waitlist, on WhatsApp"
          : stage === 3
            ? "Fatima taps first, 6 minutes later"
            : "Slot refilled. Nobody picked up a phone.";

  return (
    <div ref={ref} className="relative w-full" aria-label="Animated example: a cancelled slot is refilled from the waitlist" role="img">
      <div className="absolute -inset-x-4 -inset-y-6 -z-10 rounded-[2rem] bg-brand-lime/10 blur-2xl sm:-inset-x-8" aria-hidden />
      <div className="rounded-3xl border border-brand-cream/15 bg-brand-ink/60 p-4 text-brand-cream shadow-2xl shadow-black/30 backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between text-xs">
          <span className="font-semibold">Casa Verde · Saturday</span>
          <span className="tabular-nums text-brand-muted">10 am – 6 pm</span>
        </div>

        <div className="grid gap-1.5">
          {STAFF.map((s) => (
            <div key={s.name} className="grid grid-cols-[3.25rem_1fr] items-center gap-2">
              <span className="text-[11px] text-brand-muted">{s.name}</span>
              <div className="relative h-8 rounded-md bg-brand-cream/[0.04]" style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {s.blocks.map((b) => {
                  const isTarget = "target" in b && b.target;
                  const cancelled = isTarget && (stage === 1 || stage === 2 || stage === 3);
                  const refilled = isTarget && stage === 4;
                  return (
                    <div
                      key={b.c}
                      className={cn(
                        "m-[2px] flex motion-reduce:animate-none items-center overflow-hidden rounded-[5px] px-1.5 text-[10px] font-medium whitespace-nowrap",
                        cancelled
                          ? "border border-dashed border-brand-coral bg-brand-coral/10 text-brand-coral"
                          : refilled
                            ? "bg-brand-lime text-brand-ink"
                            : "bg-brand-green-light text-brand-cream/85",
                        refilled && "animate-[pop_0.5s_ease-out]",
                      )}
                      style={{ gridColumn: `${b.c + 1} / span ${b.w}` }}
                    >
                      {cancelled ? "Open" : refilled ? "Fatima" : b.who}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-brand-cream/10 pt-4">
          <MessageCircle className="size-4 shrink-0 text-brand-lime" aria-hidden />
          <div className="flex -space-x-1.5">
            {WAITLIST.map((initial, i) => {
              const offered = stage >= 2;
              const won = stage >= 3 && i === WINNER;
              return (
                <span key={initial + i} className="relative">
                  {stage === 2 && !reduce ? (
                    <span
                      className="absolute inset-0 animate-[ripple_1.5s_ease-out_infinite] rounded-full border border-brand-lime opacity-0"
                      style={{ animationDelay: `${i * 150}ms` } as CSSProperties}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative flex size-7 items-center justify-center rounded-full border-2 border-brand-ink text-[11px] font-semibold transition-colors duration-300",
                      won ? "bg-brand-lime text-brand-ink" : offered ? "bg-brand-green-light text-brand-cream" : "bg-brand-cream/10 text-brand-muted",
                    )}
                  >
                    {initial}
                  </span>
                </span>
              );
            })}
          </div>
          <p key={stage} className="min-w-0 flex-1 truncate text-xs text-brand-cream/80 motion-safe:animate-[fade-up_0.3s_ease-out]">
            {status}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-cream px-4 py-3 text-brand-ink">
          <span className="text-sm font-medium">Recovered today</span>
          <span className="font-display text-2xl tabular-nums">₹{shown.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
