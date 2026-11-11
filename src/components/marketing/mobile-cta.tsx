"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** On phones, a "Book a demo" bar slides up once the hero is gone, and steps aside at the form itself. */
export function MobileCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    const demo = document.getElementById("demo");
    if (!hero || !demo) return;
    const seen = new Map<Element, boolean>([
      [hero, true],
      [demo, false],
    ]);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setShow(!seen.get(hero) && !seen.get(demo));
    });
    io.observe(hero);
    io.observe(demo);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-2xl bg-brand-ink/95 p-2 pl-4 text-brand-cream shadow-2xl ring-1 ring-brand-cream/10 backdrop-blur transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
        show ? "translate-y-0" : "translate-y-[calc(100%+1.5rem)]",
      )}
      aria-hidden={!show}
      inert={!show}
    >
      <span className="text-sm">Refill your next cancellation</span>
      <a href="#demo" className="rounded-xl bg-brand-lime px-4 py-2.5 text-sm font-semibold text-brand-ink">
        Book a demo
      </a>
    </div>
  );
}
