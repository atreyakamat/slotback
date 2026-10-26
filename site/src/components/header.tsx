"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Logo } from "./logo";

const LINKS = [
  ["How it works", "#how"],
  ["Who it's for", "#who"],
  ["Your numbers", "#numbers"],
  ["FAQ", "#faq"],
];

export function Header() {
  const { scrollY, scrollYProgress } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 40));

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${solid ? "border-b border-cream/10 bg-ink/95 backdrop-blur-xl" : ""}`}>
      <motion.span className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-lime" style={{ scaleX: scrollYProgress }} aria-hidden />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <a href="#top" aria-label="SlotBack, back to top">
          <Logo />
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-sm text-cream/70 md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-lime">
              {label}
            </a>
          ))}
        </nav>
        <a href="#demo" className="inline-flex h-10 items-center rounded-full bg-lime px-5 text-sm font-semibold text-ink transition-transform hover:scale-105">
          Book a demo
        </a>
      </div>
    </header>
  );
}
