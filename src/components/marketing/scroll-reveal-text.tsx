/**
 * A statement whose words fill in from faint to full ink as it scrolls through the viewport.
 * Driven by a CSS scroll timeline: no JavaScript, and solid text where timelines are unsupported.
 */
export function ScrollRevealText({ text }: { text: string }) {
  const words = text.split(" ");
  const span = 45 / words.length;
  return (
    <p className="ink-text font-display text-3xl leading-[1.15] tracking-tight text-balance sm:text-5xl lg:text-6xl">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} style={{ animationRange: `cover ${15 + i * span}% cover ${15 + (i + 1) * span}%` }}>
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
