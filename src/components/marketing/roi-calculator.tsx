"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

const WEEKS_PER_MONTH = 4.33;

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-display text-xl tabular-nums">
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
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--accent)]"
        style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, var(--surface-raised) ${pct}%)` }}
      />
    </div>
  );
}

/** "What could you recover?" An honest, clearly labelled estimate. */
export function RoiCalculator() {
  const reduce = useReducedMotion();
  const [cancellations, setCancellations] = useState(8);
  const [price, setPrice] = useState(1200);
  const [fill, setFill] = useState(25);
  const monthly = Math.round(cancellations * WEEKS_PER_MONTH * price * (fill / 100));
  const [shown, setShown] = useState(monthly);
  const last = useRef(monthly);

  useEffect(() => {
    if (reduce) {
      last.current = monthly;
      return;
    }
    const controls = animate(last.current, monthly, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    last.current = monthly;
    return () => controls.stop();
  }, [monthly, reduce]);
  const display = reduce ? monthly : shown;

  return (
    <div className="grid gap-8 rounded-[2rem] border bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
      <div className="grid content-start gap-7">
        <Slider label="Cancellations a week" value={cancellations} min={1} max={40} step={1} format={(v) => String(v)} onChange={setCancellations} />
        <Slider
          label="Average service price"
          value={price}
          min={300}
          max={6000}
          step={100}
          format={(v) => `₹${v.toLocaleString("en-IN")}`}
          onChange={setPrice}
        />
        <Slider label="Openings refilled" value={fill} min={10} max={50} step={5} format={(v) => `${v}%`} onChange={setFill} />
      </div>
      <div className="flex flex-col justify-between rounded-3xl bg-brand-green p-6 text-brand-cream sm:p-8">
        <div>
          <p className="text-sm text-brand-cream/75">You could get back about</p>
          <p className="mt-2 font-display text-5xl tracking-tight tabular-nums text-brand-lime sm:text-6xl" aria-live="polite">
            ₹{display.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-sm text-brand-cream/75">a month, from slots that would have stayed empty.</p>
        </div>
        <p className="mt-8 border-t border-brand-cream/15 pt-4 text-xs text-brand-muted">
          An estimate, not a promise. Our pilot target is to refill 20–35% of cancellations; your dashboard shows the real
          number, with completed visits kept separate from bookings.
        </p>
      </div>
    </div>
  );
}
