type Step = { label: string; value: number; hint: string };

/** Horizontal funnel: each bar is scaled to the first step, with conversion from the step before. */
export function Funnel({ steps }: { steps: Step[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="grid gap-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const pct = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{s.label}</span>
              <span className="tabular-nums">
                {s.value}
                {pct !== null ? <span className="ml-2 text-xs text-muted">{pct}% of previous</span> : null}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-raised" aria-hidden>
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((s.value / top) * 100, s.value ? 2 : 0)}%` }} />
            </div>
            <p className="text-xs text-muted">{s.hint}</p>
          </li>
        );
      })}
    </ol>
  );
}
