import { Phone } from "./phone";

const BARS = [22, 40, 18, 55, 35, 70, 48, 62, 30, 80, 52, 66];
const RECENT = [
  ["Fatima Sheikh", "Hydrating facial", "+₹1,800"],
  ["Rohan Salgaonkar", "Women's haircut", "+₹1,200"],
  ["Neha Sawant", "Gel manicure", "+₹900"],
];

function Dashboard({ compact }: { compact?: boolean }) {
  return (
    <div className="grid gap-3 text-brand-ink">
      <div className="rounded-2xl bg-white p-4">
        <p className="text-[11px] text-brand-ink/60">Recovered by SlotBack · 30 days</p>
        <p className="mt-1 font-display text-3xl tracking-tight">₹40,500</p>
        <div className="mt-3 flex h-14 items-end gap-1" aria-hidden>
          {(compact ? BARS.slice(4) : BARS).map((h, i) => (
            <span key={i} className="flex-1 rounded-t-[3px] bg-brand-green" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white p-3">
        {RECENT.slice(0, compact ? 2 : 3).map(([n, s, v]) => (
          <div key={n} className="flex items-center justify-between gap-2 border-b border-brand-ink/10 py-2 text-[11px] last:border-0">
            <span className="min-w-0 truncate">
              <span className="font-semibold">{n}</span> <span className="text-brand-ink/60">· {s}</span>
            </span>
            <span className="font-semibold text-[#17733f]">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The same numbers on a laptop and a phone: one configurable product on web and mobile. */
export function DevicePreview() {
  return (
    <div className="relative mx-auto flex max-w-5xl items-end justify-center">
      <div className="tilt-in w-full max-w-3xl">
        <div className="rounded-t-2xl border-[10px] border-b-0 border-brand-ink bg-brand-ink shadow-[0_0_0_1px_rgb(245_239_225/0.12)]">
          <div className="grid grid-cols-[120px_1fr] overflow-hidden rounded-t-lg bg-brand-cream text-brand-ink">
            <div className="hidden border-r border-brand-ink/10 p-3 text-[11px] sm:block">
              <p className="mb-3 font-semibold">SlotBack</p>
              {["Today", "Schedule", "Recovery", "Waitlist", "Analytics"].map((n, i) => (
                <p key={n} className={i === 0 ? "rounded-md bg-brand-ink/5 px-2 py-1.5 font-medium" : "px-2 py-1.5 text-brand-ink/60"}>
                  {n}
                </p>
              ))}
            </div>
            <div className="col-span-2 p-4 sm:col-span-1">
              <p className="mb-3 font-display text-lg">Hello, Maya</p>
              <Dashboard />
            </div>
          </div>
        </div>
        <div className="mx-auto h-4 w-[110%] -translate-x-[4.5%] rounded-b-xl bg-brand-ink/90 shadow-[0_0_0_1px_rgb(245_239_225/0.12)]" aria-hidden />
      </div>
      <div className="rise-in absolute -right-2 -bottom-6 hidden w-[200px] md:block lg:-right-10">
        <Phone className="w-[200px] border-[8px]">
          <div className="p-3 pt-8">
            <p className="mb-2 font-display text-base">Today</p>
            <Dashboard compact />
          </div>
        </Phone>
      </div>
    </div>
  );
}
