const ITEMS = ["Salons", "Spas", "Dental clinics", "Physiotherapy", "Skin clinics", "Barbers", "Nail studios", "Made in Goa"];

/** A slow band of the businesses SlotBack is for. Pauses for reduced motion. */
export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-10 font-display text-2xl whitespace-nowrap sm:text-3xl">
          {item}
          <span className="size-2.5 rounded-full bg-brand-ink" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="overflow-hidden bg-brand-lime py-5 text-brand-ink" role="region" aria-label="Who SlotBack is for">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
