import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A simple phone frame for product illustrations. */
export function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[9/19] w-[260px] rounded-[2.6rem] border-[10px] border-brand-ink bg-brand-ink shadow-2xl ring-1 shadow-black/25 ring-brand-cream/12", className)}>
      <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-brand-ink" aria-hidden />
      <div className="relative h-full overflow-hidden rounded-[2rem] bg-brand-cream text-brand-ink">{children}</div>
    </div>
  );
}
