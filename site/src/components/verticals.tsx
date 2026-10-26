"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const CARDS = [
  { n: "01", name: "Skin & aesthetic clinics", line: "High-value sessions that hurt the most when a chair sits empty.", color: "bg-lime text-ink" },
  { n: "02", name: "Physiotherapy", line: "Regular patients who'd happily take an earlier session.", color: "bg-cream text-ink" },
  { n: "03", name: "Nails & lashes", line: "Short appointments, long waitlists, lots of last-minute changes.", color: "bg-coral text-ink" },
  { n: "04", name: "Dental clinics", line: "Cleanings and check-ups that are easy to move forward.", color: "bg-green-light text-cream" },
  { n: "05", name: "Salons & spas", line: "Weekend rushes where every cancellation is someone else's chance.", color: "bg-cream text-ink" },
];

function Card({ c }: { c: (typeof CARDS)[number] }) {
  return (
    <li className={`flex h-[22rem] w-[78vw] max-w-[26rem] shrink-0 snap-center flex-col justify-between rounded-[32px] p-7 sm:h-[26rem] ${c.color}`}>
      <span className="stretch text-7xl leading-none [--wdth:150] [--wght:900]">{c.n}</span>
      <span>
        <span className="stretch block text-[1.75rem] leading-none [--wdth:100] sm:text-4xl sm:[--wdth:110]">{c.name}</span>
        <span className="mt-4 block text-base opacity-75">{c.line}</span>
      </span>
    </li>
  );
}

/** Who it's for. On wide screens the row slides sideways as you scroll down; on phones it swipes. */
export function Verticals() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-62%"]);

  return (
    <>
      <div ref={ref} className="relative hidden h-[260vh] lg:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <Heading />
          <motion.ul style={{ x }} className="mt-14 flex gap-6 pl-[max(2rem,calc((100vw-72rem)/2))]">
            {CARDS.map((c) => (
              <Card key={c.n} c={c} />
            ))}
          </motion.ul>
        </div>
      </div>
      <div className="py-24 lg:hidden">
        <Heading />
        <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
          {CARDS.map((c) => (
            <Card key={c.n} c={c} />
          ))}
        </ul>
      </div>
    </>
  );
}

function Heading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
      <p className="font-mono text-xs tracking-widest text-lime uppercase">Who it’s for</p>
      <h2 className="stretch mt-4 text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-7xl sm:[--wdth:120]">Anyone who runs on appointments.</h2>
    </div>
  );
}
