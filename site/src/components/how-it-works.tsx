"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    n: "01",
    title: "A client cancels.",
    body: "Your staff open the booking and tap Refill. That's it: two taps, no phone calls, no scrolling through old chats.",
    tag: "2 taps for staff",
  },
  {
    n: "02",
    title: "Your waitlist hears first.",
    body: "SlotBack messages the clients who asked for that service and time, and who agreed to hear from you. Nobody else.",
    tag: "WhatsApp or SMS",
  },
  {
    n: "03",
    title: "First tap wins.",
    body: "The first client to confirm gets the slot. Everyone else is told it's gone, and the booking lands on your schedule.",
    tag: "1 tap for clients",
  },
];

type Msg = { from: "biz" | "me" | "sys"; text: string };

const CHATS: Msg[][] = [
  [{ from: "sys", text: "Ananya cancelled · Sat 10:00 Hair spa" }],
  [
    { from: "sys", text: "Ananya cancelled · Sat 10:00 Hair spa" },
    { from: "biz", text: "Hi Priya! A Hair spa slot just opened today at 10:00 with Shilpa. Want it? Tap to claim, it's first come, first served." },
  ],
  [
    { from: "biz", text: "Hi Priya! A Hair spa slot just opened today at 10:00 with Shilpa. Want it? Tap to claim, it's first come, first served." },
    { from: "me", text: "Claim it 🙌" },
    { from: "biz", text: "You're booked! Sat 10:00, Hair spa. See you soon ✨" },
  ],
];

/** Three steps on the left; on wide screens a phone stays pinned on the right and plays the chat. */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
      <ol className="grid gap-6 lg:gap-0">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            className="flex flex-col justify-center lg:min-h-[78vh]"
          >
            <div className={`rounded-[28px] border p-6 transition-all duration-500 sm:p-8 lg:border-transparent lg:p-0 ${active === i ? "border-lime/40 lg:opacity-100" : "border-cream/10 lg:opacity-30"}`}>
              <p className="flex items-center gap-3 font-mono text-xs tracking-widest text-lime uppercase">
                <span>{s.n}</span>
                <span className="h-px w-10 bg-lime/50" />
                <span>{s.tag}</span>
              </p>
              <h3 className="stretch mt-5 text-[2.4rem] leading-none [--wdth:105] sm:text-6xl sm:[--wdth:115]">{s.title}</h3>
              <p className="mt-5 max-w-md text-lg text-cream/70">{s.body}</p>
              <div className="mt-6 lg:hidden">
                <Chat msgs={CHATS[i]} />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="hidden lg:block">
        <div className="sticky top-[12vh]">
          <Phone>
            <Chat msgs={CHATS[active]} />
          </Phone>
        </div>
      </div>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[640px] w-[320px] rounded-[48px] border-[10px] border-[#1d1f1e] bg-[#0b141a] shadow-[0_50px_120px_-30px_rgba(198,244,50,0.3)]">
      <div className="absolute top-2 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="flex items-center gap-3 border-b border-white/5 bg-[#1f2c33] px-4 pt-11 pb-3 text-sm">
        <span className="flex size-8 items-center justify-center rounded-full bg-lime font-bold text-ink">G</span>
        <span>
          <span className="block font-medium">Glow Studio, Panjim</span>
          <span className="block text-[11px] text-white/50">via SlotBack</span>
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Chat({ msgs }: { msgs: Msg[] }) {
  return (
    <div className="flex min-h-40 flex-col gap-2 rounded-2xl bg-[#0b141a] p-3 lg:p-0">
      <AnimatePresence initial={false} mode="popLayout">
        {msgs.map((m) => (
          <motion.div
            key={m.text}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={
              m.from === "sys"
                ? "mx-auto rounded-lg bg-[#182229] px-3 py-1.5 text-center font-mono text-[10px] text-white/60"
                : m.from === "me"
                  ? "ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-tl-sm bg-[#1f2c33] px-3 py-2 text-sm text-white"
            }
          >
            {m.text}
            {m.from === "biz" && m.text.includes("Tap to claim") ? (
              <span className="mt-2 block rounded-lg border-t border-white/10 pt-2 text-center font-medium text-[#53bdeb]">Claim this slot</span>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
