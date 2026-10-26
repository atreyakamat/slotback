"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

type Row = { time: string; service: string; client: string; claimer: string; value: number };

const ROWS: Row[] = [
  { time: "10:00", service: "Hair spa", client: "Ananya", claimer: "Priya", value: 1800 },
  { time: "11:30", service: "Gel nails", client: "Rhea", claimer: "Joanna", value: 1200 },
  { time: "13:00", service: "HydraFacial", client: "Sana", claimer: "Fatima", value: 2400 },
  { time: "15:30", service: "Lash lift", client: "Meera", claimer: "Tanvi", value: 1500 },
  { time: "17:00", service: "Cut + colour", client: "Kavya", claimer: "Diya", value: 3200 },
];

// One refill, step by step: booked → cancelled → offered → claimed → refilled.
const STEPS = [
  { phase: "booked", ms: 1100 },
  { phase: "cancelled", ms: 1500 },
  { phase: "offered", ms: 2000 },
  { phase: "claimed", ms: 1300 },
  { phase: "refilled", ms: 1900 },
] as const;
type Phase = (typeof STEPS)[number]["phase"];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** A day's schedule that keeps losing and winning back appointments, to show the loop at a glance. */
export function LiveBoard() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const step = STEPS[tick % STEPS.length];
    const t = setTimeout(() => setTick((n) => n + 1), step.ms);
    return () => clearTimeout(t);
  }, [tick, reduce]);

  const active = Math.floor(tick / STEPS.length) % ROWS.length;
  const phase: Phase = reduce ? "refilled" : STEPS[tick % STEPS.length].phase;
  // Rows already refilled this loop stay lime, and the total is what those rows are worth.
  const doneBefore = (i: number) => reduce || i < active;
  const recovered = ROWS.reduce((sum, r, i) => (doneBefore(i) || (i === active && phase === "refilled") ? sum + r.value : sum), 0);

  return (
    <div className="relative rounded-[28px] border border-cream/10 bg-green/70 p-4 shadow-[0_40px_120px_-40px_rgba(198,244,50,0.35)] backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted uppercase">Today · Panjim</p>
          <p className="mt-1 font-semibold">Saturday schedule</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-widest text-muted uppercase">Won back</p>
          <motion.p key={recovered} initial={{ scale: 1.25, color: "#c6f432" }} animate={{ scale: 1, color: "#f5efe1" }} className="stretch mt-1 text-2xl tabular-nums [--wdth:120]">
            {inr(recovered)}
          </motion.p>
        </div>
      </div>

      <ul className="grid gap-2">
        {ROWS.map((row, i) => {
          const isActive = i === active && !reduce;
          const p: Phase = isActive ? phase : doneBefore(i) ? "refilled" : "booked";
          const who = p === "claimed" || p === "refilled" ? row.claimer : row.client;
          return (
            <li
              key={row.time}
              className={`relative grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 transition-colors duration-500 ${
                p === "cancelled"
                  ? "border-coral/50 bg-coral/10"
                  : p === "offered"
                    ? "border-cream/25 bg-cream/5"
                    : p === "claimed" || p === "refilled"
                      ? "border-lime/50 bg-lime/10"
                      : "border-cream/10 bg-ink/40"
              }`}
            >
              <span className="font-mono text-xs text-muted">{row.time}</span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-medium ${p === "cancelled" ? "text-coral line-through" : ""}`}>{row.service}</span>
                <span className="block truncate text-xs text-muted">{p === "cancelled" ? `${row.client} cancelled` : p === "offered" ? "Offered to 3 on the waitlist" : who}</span>
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={p}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide whitespace-nowrap uppercase ${
                    p === "cancelled"
                      ? "bg-coral text-ink"
                      : p === "offered"
                        ? "bg-cream text-ink"
                        : p === "claimed"
                          ? "bg-lime text-ink"
                          : p === "refilled"
                            ? "bg-lime/15 text-lime"
                            : "bg-cream/10 text-cream/70"
                  }`}
                >
                  {p === "booked" ? "Booked" : p === "cancelled" ? "Cancelled" : p === "offered" ? "Sending…" : p === "claimed" ? "Claimed" : `+${inr(row.value)}`}
                </motion.span>
              </AnimatePresence>
              {isActive && p === "offered" ? <Pings /> : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 flex items-center gap-2 px-1 font-mono text-[10px] tracking-widest text-muted uppercase">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-lime" />
        </span>
        Simulated · a sample Goa salon
      </p>
    </div>
  );
}

/** Three message pings flying out of the row while the slot is offered. */
function Pings() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-24 flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((k) => (
        <motion.span
          key={k}
          className="size-1.5 rounded-full bg-lime"
          initial={{ opacity: 0, x: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], x: 40, scale: 1 }}
          transition={{ duration: 0.9, delay: k * 0.18, repeat: Infinity, repeatDelay: 0.2 }}
        />
      ))}
    </span>
  );
}
