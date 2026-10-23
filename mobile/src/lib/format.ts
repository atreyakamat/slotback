/** Formats paise as rupees, e.g. 182000 → "₹1,820". */
export function rupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export function time(iso: string | Date, timeZone: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).replace(" ", " ");
}

export function day(iso: string | Date, timeZone: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone });
}

/** "YYYY-MM-DD" for a date in the business's timezone. */
export function dateKey(d: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts.slice(0, 10);
}

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function minutesLabel(m: number) {
  if (m <= 0) return "Any time";
  const h = Math.floor(m / 60) % 24;
  return `${h % 12 === 0 ? 12 : h % 12}${m % 60 ? `:${String(m % 60).padStart(2, "0")}` : ""}${h >= 12 ? "pm" : "am"}`;
}

export function countdown(until: string | null, now: number) {
  if (!until) return "";
  const s = Math.max(0, Math.round((new Date(until).getTime() - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
