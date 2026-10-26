"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (n: number) => string; onChange: (n: number) => void }) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm text-muted">
          {label}
        </label>
        <output htmlFor={id} className="font-semibold tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full"
        style={{ "--fill": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Monthly revenue a business could recover, from three numbers it knows. */
export function RecoveryCalc() {
  const [cancels, setCancels] = useState(6);
  const [value, setValue] = useState(1200);
  const [rate, setRate] = useState(30);
  const monthly = cancels * (52 / 12) * value * (rate / 100);

  const mv = useMotionValue(monthly);
  const text = useTransform(mv, inr);
  useEffect(() => {
    const c = animate(mv, monthly, { duration: 0.4, ease: "easeOut" });
    return () => c.stop();
  }, [monthly, mv]);

  return (
    <div className="grid overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-7 p-6 sm:p-8">
        <Slider label="Cancellations per week" value={cancels} min={1} max={30} step={1} format={String} onChange={setCancels} />
        <Slider label="Average appointment value" value={value} min={300} max={5000} step={100} format={inr} onChange={setValue} />
        <Slider label="Share of slots refilled" value={rate} min={10} max={60} step={5} format={(n) => `${n}%`} onChange={setRate} />
      </div>
      <div className="flex flex-col justify-center border-t border-line bg-green p-6 text-white sm:p-8 lg:border-t-0 lg:border-l">
        <p className="text-sm text-white/70">Estimated revenue recovered per month</p>
        <motion.p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl" aria-live="polite">
          {text}
        </motion.p>
        <p className="mt-4 text-sm text-white/70">An estimate based on your inputs. Your pilot will show the actual figure.</p>
      </div>
    </div>
  );
}
