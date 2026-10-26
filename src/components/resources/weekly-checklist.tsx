"use client";

import { useMemo, useSyncExternalStore } from "react";
import { WEEKLY_CHECKLIST } from "@/lib/resources";
import { Eyebrow, GlassCard } from "./glass";

const STORAGE_KEY = "slotback-rescue-checklist";

// Ticks are a per-device convenience kept in localStorage. Reading through useSyncExternalStore keeps the
// server render ("nothing ticked") and the first client render in agreement.
const listeners = new Set<() => void>();
let memory = "[]"; // used when storage is blocked, so ticks still work for this visit
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return memory;
  }
}
function writeRaw(value: number[]) {
  memory = JSON.stringify(value);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage blocked: the ticks just won't persist */
  }
  listeners.forEach((l) => l());
}
function parse(raw: string): number[] {
  try {
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? saved.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function WeeklyChecklist() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const done = useMemo(() => parse(raw), [raw]);
  const save = writeRaw;

  const pct = Math.round((done.length / WEEKLY_CHECKLIST.length) * 100);
  return (
    <GlassCard id="checklist" aria-labelledby="checklist-title">
      <div className="grid gap-2">
        <Eyebrow>Tool 4 · Weekly checklist</Eyebrow>
        <h2 id="checklist-title" className="font-display text-3xl leading-tight tracking-tight text-balance">
          The Monday no-show reset
        </h2>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-brand-ink/60" aria-hidden>
        <div className="h-full rounded-full bg-brand-lime transition-[width] motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <ul className="grid gap-2">
        {WEEKLY_CHECKLIST.map((item, i) => {
          const id = `checklist-${i}`;
          const checked = done.includes(i);
          return (
            <li key={item}>
              <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-brand-ink/50 px-4 py-3 font-medium">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => save(e.target.checked ? [...done, i] : done.filter((n) => n !== i))}
                  className="mt-0.5 size-5 shrink-0 accent-brand-lime"
                />
                <span className={checked ? "text-brand-cream/50 line-through" : undefined}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-cream/60">
          {done.length} of {WEEKLY_CHECKLIST.length} done
        </p>
        <button
          type="button"
          onClick={() => save([])}
          className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold hover:border-brand-lime focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
        >
          Start a new week
        </button>
      </div>
    </GlassCard>
  );
}
