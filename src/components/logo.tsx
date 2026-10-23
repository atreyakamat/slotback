import { cn } from "@/lib/utils";

/** Wordmark: a filled square "slot" with a returning arc. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="6" className="fill-foreground" />
        <path
          d="M8 12.5a4 4 0 1 0 1.2-2.85M8 7.5v2.4h2.4"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-background"
        />
      </svg>
      SlotBack
    </span>
  );
}
