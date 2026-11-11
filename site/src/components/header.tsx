"use client";

import { useEffect, useState } from "react";
import { Logo } from "./logo";

const LINKS = [
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Pilot", "#pilot"],
  ["FAQ", "#faq"],
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-line bg-bg/90 backdrop-blur" : "border-transparent bg-bg"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" aria-label="SlotBack home">
          <Logo />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm text-muted md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <a href="#demo" className="inline-flex h-10 items-center rounded-lg bg-green px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1a4434]">
          Book a demo
        </a>
      </div>
    </header>
  );
}
