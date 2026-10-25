const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Formats integer paise as rupees, e.g. 250000 → "₹2,500". */
export function formatPaise(paise: number): string {
  return inr.format(Math.round(paise / 100));
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
