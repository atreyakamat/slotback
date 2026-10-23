import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * A headline whose words rise into place from behind a mask, in pure CSS so it paints
 * before any JavaScript loads. The full sentence stays real text for SEO and screen readers.
 */
export function KineticHeadline({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <h1 className={cn(className)}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span className="rise-word" style={{ "--i": i } as CSSProperties}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </h1>
  );
}
