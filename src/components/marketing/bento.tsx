"use client";

import { motion, useReducedMotion } from "motion/react";
import { BellOff, Link2, Lock, ShieldCheck, Sparkles, Workflow, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Cell({ className, icon, title, body, children }: { className?: string; icon: ReactNode; title: string; body: string; children?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      className={cn("group relative flex flex-col overflow-hidden rounded-3xl border bg-surface p-6", className)}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-surface-raised text-accent">{icon}</span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{body}</p>
      {children ? <div className="mt-6 flex flex-1 items-end">{children}</div> : null}
    </motion.li>
  );
}

const BARS = [38, 52, 30, 64, 46, 78, 58];

/** Feature grid with small, purposeful motion in each cell. */
export function Bento() {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-4 md:grid-cols-6">
      <Cell
        className="md:col-span-4"
        icon={<Zap className="size-4" />}
        title="First to confirm, guaranteed"
        body="Five clients can tap at the same second. Exactly one gets the slot, enforced by the database, not by luck."
      >
        <div className="flex w-full items-center gap-3">
          {["Fatima", "Ishita", "Aditya"].map((n, i) => (
            <div
              key={n}
              className={cn(
                "flex-1 rounded-2xl border px-3 py-3 text-sm transition-transform duration-500 group-hover:-translate-y-1",
                i === 0 ? "border-transparent bg-highlight font-semibold text-highlight-foreground" : "text-muted",
              )}
            >
              {n}
              <span className="block text-xs font-normal">{i === 0 ? "Booked" : "Just missed it"}</span>
            </div>
          ))}
        </div>
      </Cell>
      <Cell className="md:col-span-2" icon={<BellOff className="size-4" />} title="Quiet hours" body="Nothing goes out late at night. Offers wait for morning and stop before the slot gets too close.">
        <p className="font-display text-3xl tabular-nums">
          23:00 <span className="text-muted">→</span> 07:00
        </p>
      </Cell>
      <Cell className="md:col-span-2" icon={<ShieldCheck className="size-4" />} title="Only people who said yes" body="Per-channel consent. An opt-out is honoured on the spot, even mid-campaign.">
        <div className="grid w-full gap-2 text-sm">
          {[
            ["WhatsApp", true],
            ["SMS", true],
            ["Email", false],
          ].map(([label, on]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-xl bg-surface-raised px-3 py-2">
              {label}
              <span className={cn("relative h-5 w-9 rounded-full transition-colors", on ? "bg-accent" : "bg-border")}>
                <span className={cn("absolute top-0.5 size-4 rounded-full bg-surface transition-all", on ? "left-[18px]" : "left-0.5")} />
              </span>
            </div>
          ))}
        </div>
      </Cell>
      <Cell className="md:col-span-2" icon={<Link2 className="size-4" />} title="No app for clients" body="They claim from a page that opens from the message. Nothing to download, no account.">
        <span className="rounded-full border px-4 py-2 font-mono text-xs">slotback.app/c/7Hq…</span>
      </Cell>
      <Cell className="md:col-span-2" icon={<Sparkles className="size-4" />} title="Honest numbers" body="Recovered revenue, fill rate and time to refill. Estimates are kept apart from visits that happened.">
        <div className="flex h-20 w-full items-end gap-1.5" aria-hidden>
          {BARS.map((h, i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-t-[4px] bg-accent"
              initial={reduce ? false : { height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={reduce ? { height: `${h}%` } : undefined}
            />
          ))}
        </div>
      </Cell>
      <Cell className="md:col-span-3" icon={<Workflow className="size-4" />} title="Automations that run themselves" body="Reminders before appointments, the next round of offers when one expires, a weekly summary for the owner. Switch each on or off.">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {["Cancelled", "Offer sent", "Claimed", "Reminder 2 h before"].map((c, i, all) => (
            <span key={c} className="flex items-center gap-2">
              <span className={cn("rounded-full px-3 py-1.5", i === all.length - 1 ? "bg-highlight text-highlight-foreground" : "bg-surface-raised")}>{c}</span>
              {i < all.length - 1 ? <span className="text-muted">→</span> : null}
            </span>
          ))}
        </div>
      </Cell>
      <Cell className="md:col-span-3" icon={<Lock className="size-4" />} title="Private by design" body="Claim links are single-use and expire. Your client list stays yours, and every action is in the activity log.">
        <div className="grid w-full gap-1.5 text-xs text-muted">
          <p>
            <span className="font-medium text-foreground">Maya</span> sent offers for Hydrating facial, 2:00 pm
          </p>
          <p>
            <span className="font-medium text-foreground">Fatima</span> claimed Hydrating facial, 2:00 pm
          </p>
        </div>
      </Cell>
    </ul>
  );
}
