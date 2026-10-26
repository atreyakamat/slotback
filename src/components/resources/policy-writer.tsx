"use client";

import { useState } from "react";
import { LATE_RULE_LABELS, NOTICE_OPTIONS, cancellationPolicy, type LateRule, type Notice, type Tone } from "@/lib/resources";
import { cn } from "@/lib/utils";
import { CopyButton, Eyebrow, GlassCard } from "./glass";

function Choice<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-semibold text-brand-cream/85">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-9 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold transition-colors hover:border-brand-lime focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-lime",
              o.value === value && "border-transparent bg-brand-lime text-brand-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PolicyWriter() {
  const [notice, setNotice] = useState<Notice>(24);
  const [rule, setRule] = useState<LateRule>("none");
  const [tone, setTone] = useState<Tone>("friendly");
  const policy = cancellationPolicy({ notice, rule, tone });
  return (
    <GlassCard id="policy" aria-labelledby="policy-title">
      <div className="grid gap-2">
        <Eyebrow>Tool 3 · Policy writer</Eyebrow>
        <h2 id="policy-title" className="font-display text-3xl leading-tight tracking-tight text-balance">
          A cancellation policy clients won’t hate
        </h2>
      </div>
      <Choice legend="How much notice do you ask for?" options={NOTICE_OPTIONS.map((n) => ({ value: n, label: `${n} hours` }))} value={notice} onChange={setNotice} />
      <Choice
        legend="What happens after that?"
        options={(Object.keys(LATE_RULE_LABELS) as LateRule[]).map((r) => ({ value: r, label: LATE_RULE_LABELS[r] }))}
        value={rule}
        onChange={setRule}
      />
      <Choice legend="Tone" options={[{ value: "friendly" as Tone, label: "Friendly" }, { value: "firm" as Tone, label: "Firm" }]} value={tone} onChange={setTone} />
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-brand-ink/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Your policy</h3>
          <CopyButton getText={() => policy} label="Copy policy" />
        </div>
        <p aria-live="polite" className="whitespace-pre-wrap">{policy}</p>
      </div>
      <p className="text-sm text-brand-cream/60">Put it on your booking confirmation, your Instagram highlights and a card at reception.</p>
    </GlassCard>
  );
}
