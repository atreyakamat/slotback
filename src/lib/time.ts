/**
 * Timezone helpers. All instants are stored in UTC; a location's IANA timezone is used
 * to interpret wall-clock times ("10:30 on 24 Oct in Goa") and to display them.
 */

function partsInZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: weekdays.indexOf(map.weekday),
  };
}

/** Offset of `timeZone` from UTC at `date`, in minutes (IST = +330). */
export function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Local calendar date ("YYYY-MM-DD") of an instant in a timezone. */
export function localDateKey(date: Date, timeZone: string): string {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Local weekday (0 = Sunday) of an instant in a timezone. */
export function localWeekday(date: Date, timeZone: string): number {
  return partsInZone(date, timeZone).weekday;
}

/** Minutes after local midnight of an instant in a timezone. */
export function localMinuteOfDay(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  return p.hour * 60 + p.minute;
}

/** Converts a local wall-clock time (date key + minutes after midnight) to a UTC instant. */
export function zonedToUtc(dateKey: string, minuteOfDay: number, timeZone: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minuteOfDay);
  // Two passes handle offset changes (DST) around the target instant.
  let guess = naive - zoneOffsetMinutes(new Date(naive), timeZone) * 60000;
  guess = naive - zoneOffsetMinutes(new Date(guess), timeZone) * 60000;
  return new Date(guess);
}

/** Adds whole days to a date key. */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** "HH:mm" → minutes after midnight. */
export function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export function formatDate(date: Date, timeZone: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone, weekday: "short", day: "numeric", month: "short", ...opts }).format(
    date,
  );
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-13-45, 2026-02-30 and the like). */
export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 2000 && y <= 2100 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
