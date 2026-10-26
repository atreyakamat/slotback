"use client";

import { useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Frosted card used across the Rescue Kit. Always sits on the brand-green backdrop, so it uses fixed brand colours. */
export function GlassCard({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "grid min-w-0 gap-5 rounded-[28px] border border-white/15 bg-gradient-to-br from-white/[0.11] to-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8",
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold tracking-[0.16em] text-brand-lime uppercase">{children}</p>;
}

/** Copies the text of `target` and says so. Falls back to selecting the text where the clipboard is blocked. */
export function CopyButton({ getText, label = "Copy", className }: { getText: () => string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "select">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(getText());
      setState("copied");
    } catch {
      setState("select");
    }
    timer.current = setTimeout(() => setState("idle"), 1800);
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-brand-cream transition-colors hover:border-brand-lime focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-lime",
        state === "copied" && "border-transparent bg-brand-lime text-brand-ink",
        className,
      )}
    >
      {state === "copied" ? "Copied" : state === "select" ? "Select and copy" : label}
    </button>
  );
}

export const fieldClass =
  "h-11 w-full min-w-0 rounded-xl border border-white/15 bg-brand-ink/60 px-3.5 text-base text-brand-cream placeholder:text-brand-cream/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-lime";
