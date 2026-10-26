const EVENTS = [
  ["10:00", "Hair spa", "refilled in 4 min"],
  ["11:30", "Gel nails", "refilled in 7 min"],
  ["13:00", "HydraFacial", "refilled in 3 min"],
  ["14:15", "Physio session", "refilled in 11 min"],
  ["15:30", "Lash lift", "refilled in 5 min"],
  ["16:45", "Scaling + polish", "refilled in 9 min"],
  ["17:00", "Cut + colour", "refilled in 6 min"],
];

/** An endless strip of example refills. Purely decorative. */
export function Ticker() {
  const items = [...EVENTS, ...EVENTS];
  return (
    <div className="relative overflow-hidden border-y border-ink/10 bg-lime py-4 text-ink" aria-hidden>
      <div className="flex w-max animate-ticker gap-10 motion-reduce:animate-none">
        {items.map(([t, s, r], i) => (
          <span key={i} className="flex items-center gap-3 font-mono text-sm whitespace-nowrap">
            <span className="opacity-60">{t}</span>
            <span className="font-semibold">{s}</span>
            <span className="line-through opacity-50">cancelled</span>
            <span>→ {r}</span>
            <span className="ml-6 size-2 rotate-45 bg-ink" />
          </span>
        ))}
      </div>
    </div>
  );
}
