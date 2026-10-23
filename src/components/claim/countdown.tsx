"use client";

import { useSyncExternalStore } from "react";

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Live "12:41 left" countdown. Renders the static fallback on the server and before hydration. */
export function Countdown({ until, fallback }: { until: string; fallback: string }) {
  const now = useSyncExternalStore(subscribe, nowSeconds, () => null);
  if (now === null) return <>{fallback}</>;
  const left = Math.max(0, Math.floor(new Date(until).getTime() / 1000) - now);
  if (left === 0) return <>Expired</>;
  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");
  return (
    <span aria-live="off" className="tabular-nums">
      {m}:{s} left
    </span>
  );
}
