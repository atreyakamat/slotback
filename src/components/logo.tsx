import { cn } from "@/lib/utils";

/**
 * Brand mark (logo B): a calendar with a check inside a returning arrow, on SlotBack green.
 * Colours are fixed brand colours, so the mark looks the same in light and dark themes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1080 1080" className={cn("size-6 shrink-0", className)} aria-hidden>
      <rect width="1080" height="1080" rx="240" className="fill-brand-green" />
      <g className="stroke-brand-lime" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M668.3 187.6 A375 375 0 1 1 232.8 324.9" strokeWidth="62" />
        <path d="M277.3 261.4 L174.4 284.0 L291.2 365.8 Z" strokeWidth="16" className="fill-brand-lime" />
        <path d="M470.7 600.6 L520.2 644.1 L615.9 560.0" strokeWidth="48" />
      </g>
      <g className="stroke-brand-cream" fill="none" strokeWidth="48" strokeLinecap="round">
        <rect x="375" y="415" width="330" height="290" rx="52.8" strokeLinecap="butt" />
        <path d="M375 502 H705" strokeLinecap="butt" />
        <path d="M474 362.2 V443.8 M606 362.2 V443.8" />
      </g>
    </svg>
  );
}

/** Wordmark: the brand mark plus "SlotBack". */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark className="size-7" />
      SlotBack
    </span>
  );
}
