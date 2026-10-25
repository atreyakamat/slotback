"use client";

import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduce(onChange: () => void) {
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True when the visitor asked their device to reduce motion. False during server render. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduce,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false,
  );
}

/** Tracks whether an element is on screen. With `once`, it stays true after the first sighting. */
export function useInView(ref: RefObject<Element | null>, { amount = 0.3, once = false }: { amount?: number; once?: boolean } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { threshold: amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, amount, once]);
  return inView;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Tweens a number towards `target` with requestAnimationFrame. Jumps straight there under reduced motion. */
export function useCountUp(target: number, { duration = 500, from }: { duration?: number; from?: number } = {}) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(from ?? target);
  const last = useRef(from ?? target);
  useEffect(() => {
    if (reduce) return;
    const origin = from ?? last.current;
    let raf = 0;
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      last.current = Math.round(origin + (target - origin) * easeOut(t));
      setValue(last.current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, from, reduce]);
  return reduce ? target : value;
}
