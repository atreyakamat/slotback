/** Brand mark (logo B): a calendar with a check inside a returning arrow, on SlotBack green. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1080 1080" className={`shrink-0 ${className}`} aria-hidden>
      <rect width="1080" height="1080" rx="240" fill="#0F2E22" />
      <g stroke="#C6F432" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M668.3 187.6 A375 375 0 1 1 232.8 324.9" strokeWidth="62" />
        <path d="M277.3 261.4 L174.4 284.0 L291.2 365.8 Z" strokeWidth="16" fill="#C6F432" />
        <path d="M470.7 600.6 L520.2 644.1 L615.9 560.0" strokeWidth="48" />
      </g>
      <g stroke="#F5EFE1" fill="none" strokeWidth="48" strokeLinecap="round">
        <rect x="375" y="415" width="330" height="290" rx="52.8" strokeLinecap="butt" />
        <path d="M375 502 H705" strokeLinecap="butt" />
        <path d="M474 362.2 V443.8 M606 362.2 V443.8" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-lg font-semibold tracking-tight ${className}`}>
      <LogoMark />
      SlotBack
    </span>
  );
}
