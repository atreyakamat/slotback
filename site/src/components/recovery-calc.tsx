"use client";

import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect, useState } from "react";

function Slider({ label, value, min, max, step, format, onChange }: { label: string; value: number; min: number; max: number; step: number; format: (n: number) => string; onChange: (n: number) => void }) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm text-cream/70">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-lg tabular-nums">
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

/** Monthly revenue a business could win back, from three numbers they know. */
export function RecoveryCalc() {
  const [cancels, setCancels] = useState(8);
  const [value, setValue] = useState(1500);
  const [rate, setRate] = useState(30);
  const monthly = cancels * (52 / 12) * value * (rate / 100);

  const mv = useMotionValue(monthly);
  const text = useTransform(mv, inr);
  const wdth = useTransform(mv, [0, 150000], [80, 150], { clamp: true });
  useEffect(() => {
    const c = animate(mv, monthly, { type: "spring", stiffness: 120, damping: 20 });
    return () => c.stop();
  }, [monthly, mv]);

  return (
    <div className="grid gap-10 rounded-[32px] border border-cream/10 bg-green/50 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div className="grid gap-8">
        <Slider label="Cancellations a week" value={cancels} min={1} max={40} step={1} format={String} onChange={setCancels} />
        <Slider label="Average appointment" value={value} min={300} max={6000} step={100} format={inr} onChange={setValue} />
        <Slider label="Share SlotBack refills" value={rate} min={10} max={60} step={5} format={(n) => `${n}%`} onChange={setRate} />
      </div>
      <div className="rounded-[24px] bg-lime p-6 text-ink sm:p-8">
        <p className="font-mono text-xs tracking-widest uppercase">Won back each month</p>
        <motion.p className="stretch mt-3 text-5xl leading-none tabular-nums sm:text-7xl" style={{ "--wdth": wdth } as React.CSSProperties} aria-live="polite">
          {text}
        </motion.p>
        <p className="mt-5 text-sm text-ink/70">An estimate from your numbers, not a promise. A pilot shows you the real figure.</p>
      </div>
    </div>
  );
}
