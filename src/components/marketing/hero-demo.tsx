"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarX2, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const STAGES = [
  { icon: CalendarX2, tone: "text-danger", title: "Cancelled", body: "Hydrating facial · Today 4:00 pm" },
  { icon: MessageCircle, tone: "text-accent", title: "Offered to 5 waitlisted clients", body: "WhatsApp · first to confirm gets it" },
  { icon: CheckCircle2, tone: "text-success", title: "Fatima claimed it", body: "Confirmed in 6 minutes · on the schedule" },
] as const;

/** The product loop in one glance: a cancellation turns into a refilled slot. Static for reduced motion. */
export function HeroDemo() {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((s) => (s + 1) % (STAGES.length + 1)), 1800);
    return () => window.clearInterval(id);
  }, [reduce]);

  // Reduced motion shows the finished story, without cycling.
  const stage = reduce ? STAGES.length - 1 : tick;
  const shown = Math.min(stage, STAGES.length - 1);
  const done = stage >= STAGES.length - 1;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-y-6 inset-x-0 -z-10 rounded-[2rem] bg-accent/10 blur-2xl sm:-inset-x-6" aria-hidden />
      <div className="rounded-[1.75rem] border bg-surface p-4 shadow-xl shadow-black/5">
        <div className="mb-4 flex items-center justify-between text-xs text-muted">
          <span className="font-medium text-foreground">Casa Verde Salon</span>
          <span>Today</span>
        </div>
        <ol className="grid gap-2.5" aria-label="How a cancellation is refilled">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const visible = i <= shown;
            return (
              <motion.li
                key={s.title}
                initial={false}
                animate={{ opacity: visible ? 1 : 0.25, y: visible ? 0 : 6 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
                className="flex items-start gap-3 rounded-xl border bg-surface-raised/60 p-3"
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${s.tone}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted">{s.body}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
        <div className="mt-4 flex h-14 items-center justify-between rounded-xl bg-foreground px-4 text-background">
          <span className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4" aria-hidden /> Recovered today
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={done ? "done" : "pending"}
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className="text-lg font-semibold tabular-nums"
            >
              {done ? "+₹1,800" : "₹0"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
