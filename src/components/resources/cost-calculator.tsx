"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow, GlassCard, fieldClass } from "./glass";

const WEEKS_PER_MONTH = 4.33;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function NumberField({ label, value, onChange, min = 0, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  const id = useId();
  return (
    <label htmlFor={id} className="grid gap-1.5 text-sm font-semibold text-brand-cream/85">
      {label}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className={cn(fieldClass, "tabular-nums")}
      />
    </label>
  );
}

function Stat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", hot ? "border-transparent bg-gradient-to-br from-[#d6ff5a] to-brand-lime text-brand-green" : "border-white/10 bg-brand-ink/50")}>
      <p className={cn("text-xs font-bold tracking-[0.12em] uppercase", hot ? "text-brand-green/70" : "text-brand-cream/60")}>{label}</p>
      <p className="mt-1 font-display text-3xl tracking-tight tabular-nums sm:text-4xl">{value}</p>
    </div>
  );
}

export function CostCalculator() {
  const [price, setPrice] = useState(1000);
  const [perWeek, setPerWeek] = useState(4);
  const [refilled, setRefilled] = useState(1);
  const [weeks, setWeeks] = useState(48);

  const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const lostPerWeek = Math.max(safe(perWeek) - safe(refilled), 0);
  const workingWeeks = Math.min(safe(weeks), 52);
  const perWeekValue = lostPerWeek * safe(price);

  return (
    <GlassCard id="calculator" aria-labelledby="calculator-title">
      <div className="grid gap-2">
        <Eyebrow>Tool 1 · Cost calculator</Eyebrow>
        <h2 id="calculator-title" className="font-display text-3xl leading-tight tracking-tight text-balance">
          What do cancellations really cost you?
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Average booking value (₹)" value={price} onChange={setPrice} step={50} />
        <NumberField label="Late cancellations or no-shows per week" value={perWeek} onChange={setPerWeek} />
        <NumberField label="How many of those you refill now" value={refilled} onChange={setRefilled} />
        <NumberField label="Working weeks per year" value={weeks} onChange={setWeeks} min={1} max={52} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <Stat label="Lost per month" value={rupees(perWeekValue * WEEKS_PER_MONTH)} />
        <Stat label="Lost per year" value={rupees(perWeekValue * workingWeeks)} />
        <Stat label="Back each year if you refill half" value={rupees((perWeekValue * workingWeeks) / 2)} hot />
        <Stat label="Empty slots per year" value={(lostPerWeek * workingWeeks).toLocaleString("en-IN")} />
      </div>
      <p className="text-sm text-brand-cream/60">These starting numbers are an example. Change them to match your business. A month here is 4.33 weeks.</p>
    </GlassCard>
  );
}
