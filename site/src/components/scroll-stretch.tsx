"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/** Big type that stretches wider and heavier as it scrolls through the screen. */
export function ScrollStretch({ children, className = "", from = 55, to = 150 }: { children: React.ReactNode; className?: string; from?: number; to?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const wdth = useTransform(scrollYProgress, [0.1, 0.6], [from, to]);
  const wght = useTransform(scrollYProgress, [0.1, 0.6], [300, 900]);
  return (
    <motion.div ref={ref} className={`stretch ${className}`} style={{ "--wdth": wdth, "--wght": wght } as React.CSSProperties}>
      {children}
    </motion.div>
  );
}
