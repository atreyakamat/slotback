"use client";

import { useEffect, useRef, useState } from "react";
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
  const markers = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const ActiveScreen = STEPS[active].Screen;

  // One invisible marker per step; whichever crosses the middle of the viewport is the active step.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const el of markers.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Large screens: the phone stays pinned while the steps scroll past. */}
      <div className="relative hidden md:block" style={{ height: `${STEPS.length * 90}vh` }}>
        {STEPS.map((s, i) => (
          <div
            key={s.kicker}
            ref={(el) => {
              markers.current[i] = el;
            }}
            data-step={i}
            className="absolute inset-x-0"
            style={{ top: `${(i * 100) / STEPS.length}%`, height: `${100 / STEPS.length}%` }}
            aria-hidden
          />
        ))}
        <div className="sticky top-0 flex h-dvh items-center">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-16 px-6">
            <ol className="relative grid gap-10 pl-8">
              <span className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-border" aria-hidden />
              <span
                className="absolute top-1 left-0 w-0.5 rounded-full bg-accent transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ height: `calc((100% - 0.5rem) * ${(active + 1) / STEPS.length})` }}
                aria-hidden
              />
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
                <div key={active} className="h-full motion-safe:animate-[swap-in_0.45s_cubic-bezier(0.22,1,0.36,1)]">
                  <ActiveScreen />
                </div>
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
