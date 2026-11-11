const WORDS = ["Cancelled", "Offered", "Claimed", "Refilled"];

function Row({ outline, className }: { outline?: boolean; className: string }) {
  const items = [...WORDS, ...WORDS, ...WORDS];
  return (
    <p className={`flex w-max gap-8 whitespace-nowrap font-display text-6xl leading-none tracking-tight sm:text-8xl lg:text-9xl ${className}`}>
      {items.map((w, i) => (
        <span key={i} className={outline ? "text-transparent [-webkit-text-stroke:1.5px_var(--accent)]" : i % 4 === 3 ? "text-accent" : undefined}>
          {w}
          <span className="text-muted" aria-hidden>
            {" "}
            ·
          </span>
        </span>
      ))}
    </p>
  );
}

/** Two giant rows of the product loop that slide in opposite directions as the page scrolls. Decorative. */
export function ScrollBand() {
  return (
    <div className="band overflow-hidden py-16 sm:py-24" aria-hidden>
      <div className="grid gap-4 sm:gap-6">
        <Row className="band-left" />
        <Row outline className="band-right" />
      </div>
    </div>
  );
}
