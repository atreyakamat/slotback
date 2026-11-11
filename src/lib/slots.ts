/**
 * Free-slot calculation for online booking. Pure: callers load opening hours and busy
 * intervals; this decides which start times can be offered.
 */
import { addDays, localWeekday, parseHm, zonedToUtc } from "./time";

/** Weekly opening hours keyed by weekday ("0" = Sunday), as stored on Location.businessHours. */
export type BusinessHours = Record<string, { open: string; close: string }[] | undefined>;

export type Busy = { resourceId: string; startAt: Date; endAt: Date };

export type Slot = { startAt: Date; endAt: Date; resourceId: string };

export type SlotQuery = {
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  timeZone: string;
  hours: BusinessHours;
  durationMinutes: number;
  intervalMinutes: number;
  /** Resources that can perform the service, in preference order. */
  resourceIds: string[];
  busy: Busy[];
  now: Date;
  minLeadMinutes: number;
};

/** Opening intervals for a local date, as minutes after midnight. Malformed entries are ignored. */
export function openingIntervals(hours: BusinessHours, date: string, timeZone: string): [number, number][] {
  const weekday = localWeekday(zonedToUtc(date, 12 * 60, timeZone), timeZone);
  const spans = hours[String(weekday)] ?? [];
  const out: [number, number][] = [];
  for (const span of spans) {
    if (!/^\d{2}:\d{2}$/.test(span?.open ?? "") || !/^\d{2}:\d{2}$/.test(span?.close ?? "")) continue;
    const open = parseHm(span.open);
    const close = parseHm(span.close);
    if (close > open) out.push([open, close]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Start times on `date` where at least one eligible resource is free for the whole service.
 * Each slot is assigned to the first free resource in `resourceIds` order. Slots that start
 * sooner than `minLeadMinutes` from `now` are not offered.
 */
export function freeSlots(q: SlotQuery): Slot[] {
  if (q.durationMinutes <= 0 || q.intervalMinutes <= 0 || q.resourceIds.length === 0) return [];
  const earliest = q.now.getTime() + q.minLeadMinutes * 60_000;
  const busyBy = new Map<string, Busy[]>();
  for (const b of q.busy) busyBy.set(b.resourceId, [...(busyBy.get(b.resourceId) ?? []), b]);

  const slots: Slot[] = [];
  for (const [open, close] of openingIntervals(q.hours, q.date, q.timeZone)) {
    for (let m = open; m + q.durationMinutes <= close; m += q.intervalMinutes) {
      const startAt = zonedToUtc(q.date, m, q.timeZone);
      if (startAt.getTime() < earliest) continue;
      const endAt = new Date(startAt.getTime() + q.durationMinutes * 60_000);
      const resourceId = q.resourceIds.find(
        (id) => !(busyBy.get(id) ?? []).some((b) => overlaps(startAt, endAt, b.startAt, b.endAt)),
      );
      if (resourceId) slots.push({ startAt, endAt, resourceId });
    }
  }
  return slots;
}

/** The local dates a customer may book, today first. */
export function bookableDates(today: string, horizonDays: number): string[] {
  return Array.from({ length: Math.max(0, horizonDays) }, (_, i) => addDays(today, i));
}
