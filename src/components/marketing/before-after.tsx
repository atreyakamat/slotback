import { Check, PhoneOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TODAY = [
  ["2:00 pm", "Divya cancels her facial."],
  ["2:05 pm", "The front desk starts calling the regulars, one by one."],
  ["2:20 pm", "Three don’t pick up. Two can’t come at short notice."],
  ["2:35 pm", "Clients are waiting at the counter. The calls stop."],
] as const;

const WITH = [
  ["2:00 pm", "Divya cancels her facial."],
  ["2:01 pm", "Two taps: offered to 5 clients who fit, on WhatsApp."],
  ["2:07 pm", "Fatima taps first. The others see it’s taken."],
  ["2:07 pm", "It’s on the schedule and counted in recovered revenue."],
] as const;

function Column({ tone, title, rows, outcome, detail }: { tone: "before" | "after"; title: string; rows: readonly (readonly [string, string])[]; outcome: string; detail: string }) {
  const after = tone === "after";
  return (
    <div className={cn("flex flex-col rounded-[2rem] p-6 sm:p-8", after ? "from-right bg-brand-green text-brand-cream" : "from-left border bg-surface")}>
      <p className={cn("flex items-center gap-2 text-sm font-medium", after ? "text-brand-lime" : "text-muted")}>
        {after ? <Check className="size-4" aria-hidden /> : <PhoneOff className="size-4" aria-hidden />}
        {title}
      </p>
      <ol className="mt-6 grid gap-5">
        {rows.map(([time, text], i) => (
          <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-3">
            <span className={cn("pt-0.5 text-xs tabular-nums", after ? "text-brand-muted" : "text-muted")}>{time}</span>
            <span className={cn("relative border-l pl-4", after ? "border-brand-cream/15" : "")}>
              <span className={cn("absolute top-1.5 -left-[5px] size-2.5 rounded-full", after ? "bg-brand-lime" : "bg-border")} aria-hidden />
              {text}
            </span>
          </li>
        ))}
      </ol>
      <div className={cn("mt-auto flex items-end justify-between gap-4 border-t pt-5", after ? "mt-8 border-brand-cream/15" : "mt-8")}>
        <div>
          <p className={cn("font-display text-4xl tabular-nums", after ? "text-brand-lime" : "text-danger")}>{outcome}</p>
          <p className={cn("mt-1 text-sm", after ? "text-brand-cream/75" : "text-muted")}>{detail}</p>
        </div>
        {after ? null : <X className="mb-2 size-6 text-danger" aria-hidden />}
      </div>
    </div>
  );
}

/** The same 2 pm cancellation handled by phone, and with SlotBack. */
export function BeforeAfter() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Column tone="before" title="Today, by phone" rows={TODAY} outcome="₹0" detail="35 minutes on the phone, and the chair stays empty." />
      <Column tone="after" title="With SlotBack" rows={WITH} outcome="₹1,800" detail="About a minute of staff time. Nobody picked up a phone." />
    </div>
  );
}
