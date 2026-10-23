"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Final call to action: the logo draws itself, then the ask. */
export function ClosingCta() {
  const reduce = useReducedMotion();
  const draw = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 1.2, delay, ease: [0.65, 0, 0.35, 1] as const },
        };
  return (
    <section className="bg-brand-green text-brand-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <svg viewBox="0 0 1080 1080" className="size-28 sm:size-36" aria-hidden>
          <motion.path d="M668.3 187.6 A375 375 0 1 1 232.8 324.9" fill="none" stroke="var(--brand-lime)" strokeWidth="62" strokeLinecap="round" {...draw(0)} />
          <motion.path d="M277.3 261.4 L174.4 284.0 L291.2 365.8 Z" fill="var(--brand-lime)" stroke="var(--brand-lime)" strokeWidth="16" strokeLinejoin="round" {...draw(1)} />
          <rect x="375" y="415" width="330" height="290" rx="52.8" fill="none" stroke="var(--brand-cream)" strokeWidth="48" />
          <path d="M375 502 H705 M474 362.2 V443.8 M606 362.2 V443.8" fill="none" stroke="var(--brand-cream)" strokeWidth="48" strokeLinecap="round" />
          <motion.path d="M470.7 600.6 L520.2 644.1 L615.9 560.0" fill="none" stroke="var(--brand-lime)" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" {...draw(0.9)} />
        </svg>
        <h2 className="mt-10 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-6xl">
          Your next cancellation is already a booking.
        </h2>
        <p className="mt-5 max-w-xl text-lg text-brand-cream/75">See it work on your own services in a 20-minute walkthrough.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#demo" className={buttonVariants({ variant: "brand", size: "lg" })}>
            Book a demo <ArrowRight />
          </a>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "border-brand-cream/30 bg-transparent text-brand-cream hover:bg-brand-green-light")}
          >
            Open the demo salon
          </Link>
        </div>
      </div>
    </section>
  );
}
