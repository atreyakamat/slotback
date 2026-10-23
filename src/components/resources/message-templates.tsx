"use client";

import { useId, useState } from "react";
import { MESSAGE_TEMPLATES } from "@/lib/resources";
import { CopyButton, Eyebrow, GlassCard, fieldClass } from "./glass";

export function MessageTemplates() {
  const [business, setBusiness] = useState("Glow Studio");
  const [slot, setSlot] = useState("4:30 PM today");
  const businessId = useId();
  const slotId = useId();
  return (
    <GlassCard id="messages" aria-labelledby="messages-title">
      <div className="grid gap-2">
        <Eyebrow>Tool 2 · Message templates</Eyebrow>
        <h2 id="messages-title" className="font-display text-3xl leading-tight tracking-tight text-balance">
          Copy-paste messages that win slots back
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={businessId} className="grid gap-1.5 text-sm font-semibold text-brand-cream/85">
          Your business name
          <input id={businessId} className={fieldClass} value={business} onChange={(e) => setBusiness(e.target.value)} autoComplete="organization" />
        </label>
        <label htmlFor={slotId} className="grid gap-1.5 text-sm font-semibold text-brand-cream/85">
          Slot that opened
          <input id={slotId} className={fieldClass} value={slot} onChange={(e) => setSlot(e.target.value)} />
        </label>
      </div>
      <ul className="grid gap-3">
        {MESSAGE_TEMPLATES.map((t) => {
          const text = t.render({ business, slot });
          return (
            <li key={t.key} className="grid gap-3 rounded-2xl border border-white/10 bg-brand-ink/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">{t.title}</h3>
                  <p className="text-sm text-brand-cream/60">{t.when}</p>
                </div>
                <CopyButton getText={() => text} />
              </div>
              <p className="rounded-2xl rounded-bl-sm border border-brand-lime/20 bg-brand-green/80 px-4 py-3 whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</p>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
