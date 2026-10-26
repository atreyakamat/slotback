"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

type Row = { time: string; service: string; staff: string; client: string; claimer: string; value: number };

const ROWS: Row[] = [
  { time: "10:00", service: "Hair spa", staff: "Shilpa", client: "Ananya D.", claimer: "Priya K.", value: 1800 },
  { time: "11:30", service: "Gel manicure", staff: "Rhea", client: "Sana M.", claimer: "Joanna F.", value: 1200 },
  { time: "13:00", service: "Facial", staff: "Shilpa", client: "Meera P.", claimer: "Tanvi S.", value: 2400 },
  { time: "15:30", service: "Cut + colour", staff: "Rhea", client: "Kavya N.", claimer: "Diya R.", value: 3200 },
];

const STEPS = [
  { phase: "booked", ms: 2200 },
  { phase: "cancelled", ms: 2000 },
  { phase: "offered", ms: 2400 },
  { phase: "refilled", ms: 2600 },
] as const;
type Phase = (typeof STEPS)[number]["phase"];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const BADGE: Record<Phase, { label: string; cls: string }> = {
  booked: { label: "Booked", cls: "bg-[#f1efe8] text-muted" },
  cancelled: { label: "Cancelled", cls: "bg-red-soft text-red" },
  offered: { label: "Offered to waitlist", cls: "bg-[#fff6d6] text-[#7a5a00]" },
  refilled: { label: "Refilled", cls: "bg-green-soft text-green" },
};

/** A calm product preview: one appointment at a time is cancelled and refilled. */
export function ProductPreview() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setTick((n) => n + 1), STEPS[tick % STEPS.length].ms);
    return () => clearTimeout(t);
  }, [tick, reduce]);

  const active = reduce ? 0 : Math.floor(tick / STEPS.length) % ROWS.length;
  const phase: Phase = reduce ? "refilled" : STEPS[tick % STEPS.length].phase;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-30px_rgba(11,31,23,0.25)]">
      <div className="flex items-center gap-2 border-b border-line bg-[#f6f4ee] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#e2ddd0]" />
        <span className="size-2.5 rounded-full bg-[#e2ddd0]" />
        <span className="size-2.5 rounded-full bg-[#e2ddd0]" />
        <span className="ml-3 text-xs text-muted">SlotBack · Today&apos;s schedule</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Saturday</p>
            <p className="font-semibold">Glow Studio, Panjim</p>
          </div>
          <span className="rounded-md border border-line px-2 py-1 text-[11px] text-muted">Example data</span>
        </div>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {ROWS.map((row, i) => {
            const p: Phase = i === active ? phase : "booked";
            const who = p === "refilled" ? row.claimer : row.client;
            return (
              <li key={row.time} className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-3 py-3 transition-colors duration-500 ${i === active && p !== "booked" ? "bg-[#fcfbf8]" : ""}`}>
                <span className="text-sm tabular-nums text-muted">{row.time}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.service}</span>
                  <span className="block truncate text-xs text-muted">
                    {who} · with {row.staff}
                  </span>
                </span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={p}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${BADGE[p].cls}`}
                  >
                    {BADGE[p].label}
                  </motion.span>
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#f6f4ee] p-3">
            <p className="text-xs text-muted">Last refill</p>
            <p className="mt-1 text-sm font-medium">{phase === "refilled" ? `${ROWS[active].service}, in 6 min` : "Waiting for a reply…"}</p>
          </div>
          <div className="rounded-xl bg-green-soft p-3">
            <p className="text-xs text-green/80">Value of refilled slot</p>
            <p className="mt-1 text-sm font-semibold text-green tabular-nums">{phase === "refilled" ? inr(ROWS[active].value) : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
