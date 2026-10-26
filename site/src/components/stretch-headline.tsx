"use client";

import { useEffect, useRef } from "react";

/**
 * A headline whose letters spring open on load, then widen and thicken near the pointer.
 * Each line is a separate block. Screen readers get the plain text once.
 */
export function StretchHeadline({ lines, className = "" }: { lines: { text: string; className?: string }[]; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>(".letter"));
    const frame = requestAnimationFrame(() => el.setAttribute("data-ready", ""));

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return () => cancelAnimationFrame(frame);

    let raf = 0;
    let px = -1e4;
    let py = -1e4;
    const tick = () => {
      raf = 0;
      for (const s of letters) {
        const r = s.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
        const t = Math.max(0, 1 - d / 280);
        if (t > 0) {
          s.setAttribute("data-near", "");
          s.style.setProperty("--wdth", String(Math.round(100 + 50 * t)));
          s.style.setProperty("--wght", String(Math.round(800 + 100 * t)));
        } else if (s.hasAttribute("data-near")) {
          s.style.removeProperty("--wdth");
          s.style.removeProperty("--wght");
        }
      }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      px = py = -1e4;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  let i = 0;
  return (
    <h1 ref={ref} className={`stretch ${className}`} aria-label={lines.map((l) => l.text).join(" ")}>
      {lines.map((line) => (
        <span key={line.text} className={`block ${line.className ?? ""}`} aria-hidden>
          {line.text.split(" ").map((word, w) => (
            <span key={w} className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, c) => (
                <span key={c} className="letter" style={{ transitionDelay: `${i++ * 35}ms` }}>
                  {ch}
                </span>
              ))}
              {w < line.text.split(" ").length - 1 ? " " : null}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
