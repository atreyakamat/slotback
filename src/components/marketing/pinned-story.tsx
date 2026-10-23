"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Phone } from "./phone";
import { ClaimedScreen, StaffScreen, WhatsAppScreen } from "./story-screens";

const STEPS = [
  {
    kicker: "01 · Staff",
    title: "A client cancels. Two taps.",
    body: "Mark it cancelled and choose “Cancel and refill”. SlotBack checks who on your waitlist fits the service, the staff member and the time.",
    Screen: StaffScreen,
  },
  {
    kicker: "02 · Waitlist",
    title: "The right people hear first.",
    body: "Opted-in clients get a short WhatsApp or SMS with a secure link. Quiet hours and opt-outs are respected automatically.",
    Screen: WhatsAppScreen,
  },
  {
    kicker: "03 · Claimed",
    title: "First to tap gets it.",
    body: "Exactly one person can claim the slot, even if five tap at once. It lands on your schedule and in your recovered revenue.",
    Screen: ClaimedScreen,
  },
];

/** "How it works" as a pinned scroll story on large screens, and a simple sequence on phones. */
export function PinnedStory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))));
  const ActiveScreen = STEPS[active].Screen;

  return (
    <>
      {/* Large screens: the phone stays pinned while the steps scroll past. */}
      <div ref={ref} className="relative hidden md:block" style={{ height: `${STEPS.length * 90}vh` }}>
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-16 px-6">
            <ol className="grid gap-10">
              {STEPS.map((s, i) => (
                <li key={s.kicker} className={cn("transition-opacity duration-500", i === active ? "opacity-100" : "opacity-30")}>
                  <p className="text-sm font-medium text-accent">{s.kicker}</p>
                  <h3 className="mt-2 font-display text-3xl tracking-tight lg:text-4xl">{s.title}</h3>
                  <p className="mt-3 max-w-md text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="relative">
              <Phone>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active}
                    className="h-full"
                    initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: -24, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ActiveScreen />
                  </motion.div>
                </AnimatePresence>
              </Phone>
              <div className="mt-6 flex justify-center gap-2" aria-hidden>
                {STEPS.map((s, i) => (
                  <span key={s.kicker} className={cn("h-1.5 rounded-full bg-accent transition-all duration-500", i === active ? "w-8" : "w-1.5 opacity-30")} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phones: one step after another, no pinning. */}
      <ol className="grid gap-16 px-4 md:hidden">
        {STEPS.map(({ kicker, title, body, Screen }) => (
          <li key={kicker}>
            <p className="text-sm font-medium text-accent">{kicker}</p>
            <h3 className="mt-2 font-display text-3xl tracking-tight">{title}</h3>
            <p className="mt-3 text-muted">{body}</p>
            <Phone className="mt-8">
              <Screen />
            </Phone>
          </li>
        ))}
      </ol>
    </>
  );
}
