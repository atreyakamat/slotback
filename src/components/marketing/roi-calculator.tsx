"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "./use-motion";

const WEEKS_PER_MONTH = 4.33;

/** Starting points per business type. Illustrative only: every owner should move the sliders to their own week. */
const PRESETS = [
  { key: "salon", label: "Salon", cancellations: 8, price: 1200, example: "A cancelled hair spa on a busy Saturday" },
  { key: "skin", label: "Skin clinic", cancellations: 6, price: 3500, example: "A cancelled peel the morning of the visit" },
  { key: "physio", label: "Physio", cancellations: 10, price: 900, example: "A missed follow-up session after lunch" },
  { key: "dental", label: "Dental", cancellations: 5, price: 2000, example: "A cleaning cancelled an hour before" },
] as const;

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

/** "What could you recover?" An honest, clearly labelled estimate, with a starting point per business type. */
export function RoiCalculator() {
  const [preset, setPreset] = useState(0);
  const [cancellations, setCancellations] = useState<number>(PRESETS[0].cancellations);
  const [price, setPrice] = useState<number>(PRESETS[0].price);
  const [fill, setFill] = useState(25);
  const monthly = Math.round(cancellations * WEEKS_PER_MONTH * price * (fill / 100));
  const display = useCountUp(monthly);
  const hours = Math.round((cancellations * WEEKS_PER_MONTH * 35) / 60);

  function choose(i: number) {
    setPreset(i);
    setCancellations(PRESETS[i].cancellations);
    setPrice(PRESETS[i].price);
  }

  return (
    <div className="rounded-[2rem] border bg-surface p-6 sm:p-10">
      <div className="relative grid grid-cols-2 gap-1 rounded-2xl bg-surface-raised p-1 sm:grid-cols-4" role="group" aria-label="Start from a business like yours">
        <span
          className="absolute inset-y-1 left-1 hidden w-[calc((100%-0.5rem-0.75rem)/4)] rounded-xl bg-background shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:block"
          style={{ transform: `translateX(calc(${preset} * (100% + 0.25rem)))` }}
          aria-hidden
        />
        {PRESETS.map((p, i) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={preset === i}
            onClick={() => choose(i)}
            className={cn(
              "relative rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              preset === i ? "bg-background text-foreground shadow-sm sm:bg-transparent sm:shadow-none" : "text-muted hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Example: {PRESETS[preset].example}. Adjust the numbers to match your week.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
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
            <p className="mt-6 flex items-baseline gap-2 border-t border-brand-cream/15 pt-4">
              <span className="font-display text-2xl tabular-nums">~{hours} h</span>
              <span className="text-sm text-brand-cream/75">of front-desk phone time saved a month</span>
            </p>
          </div>
          <p className="mt-8 border-t border-brand-cream/15 pt-4 text-xs text-brand-muted">
            An estimate, not a promise. It assumes about 35 minutes of calls to refill a slot by hand. Our pilot target is to
            refill 20–35% of cancellations; your dashboard shows the real number, with completed visits kept separate.
          </p>
        </div>
      </div>
    </div>
  );
}
