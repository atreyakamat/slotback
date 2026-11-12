/**
 * Appointment reminder timing. Pure: decides when each reminder should go out, honouring the
 * location's quiet hours (no messages between quietStart and quietEnd, local time).
 */
import { addDays, localDateKey, localMinuteOfDay, parseHm, zonedToUtc } from "./time";

export type QuietHours = { start: string; end: string };

export type PlannedReminder = { offsetMinutes: number; sendAt: Date };

/** Minimum gap between two reminders for the same appointment; closer ones are merged. */
const MIN_GAP_MINUTES = 60;
/** Reminders moved out of quiet hours go out this long before quiet hours begin. */
const QUIET_MARGIN_MINUTES = 15;

/** Whether a local minute-of-day falls inside quiet hours. Handles windows that wrap midnight. */
export function isQuietMinute(minute: number, quiet: QuietHours): boolean {
  const start = parseHm(quiet.start);
  const end = parseHm(quiet.end);
  if (start === end) return false;
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}

export function isQuiet(at: Date, quiet: QuietHours, timeZone: string): boolean {
  return isQuietMinute(localMinuteOfDay(at, timeZone), quiet);
}

/** If `at` is inside quiet hours, the moment just before those quiet hours began; otherwise `at`. */
export function moveBeforeQuietHours(at: Date, quiet: QuietHours, timeZone: string): Date {
  const minute = localMinuteOfDay(at, timeZone);
  if (!isQuietMinute(minute, quiet)) return at;
  const start = parseHm(quiet.start);
  const end = parseHm(quiet.end);
  const day = localDateKey(at, timeZone);
  // For a window that wraps midnight, an early-morning time belongs to the previous evening's window.
  const startDay = start > end && minute < end ? addDays(day, -1) : day;
  return new Date(zonedToUtc(startDay, start, timeZone).getTime() - QUIET_MARGIN_MINUTES * 60_000);
}

/** If `at` is inside quiet hours, the moment those quiet hours end; otherwise `at`. */
export function moveAfterQuietHours(at: Date, quiet: QuietHours, timeZone: string): Date {
  const minute = localMinuteOfDay(at, timeZone);
  if (!isQuietMinute(minute, quiet)) return at;
  const start = parseHm(quiet.start);
  const end = parseHm(quiet.end);
  const day = localDateKey(at, timeZone);
  const endDay = start > end && minute >= start ? addDays(day, 1) : day;
  return zonedToUtc(endDay, end, timeZone);
}

/**
 * When to send each reminder for an appointment starting at `startAt`.
 * - A reminder that would land in quiet hours is sent before quiet hours begin instead.
 * - Reminders whose time has already passed are skipped (the booking confirmation covers them).
 * - Reminders closer than an hour to an earlier one are merged into it.
 */
export function planReminders(opts: {
  startAt: Date;
  offsetsMinutes: number[];
  now: Date;
  quiet: QuietHours;
  timeZone: string;
}): PlannedReminder[] {
  const offsets = [...new Set(opts.offsetsMinutes.filter((o) => Number.isInteger(o) && o > 0))].sort((a, b) => b - a);
  const planned: PlannedReminder[] = [];
  for (const offsetMinutes of offsets) {
    const ideal = new Date(opts.startAt.getTime() - offsetMinutes * 60_000);
    const sendAt = moveBeforeQuietHours(ideal, opts.quiet, opts.timeZone);
    if (sendAt <= opts.now || sendAt >= opts.startAt) continue;
    const last = planned.at(-1);
    if (last && sendAt.getTime() - last.sendAt.getTime() < MIN_GAP_MINUTES * 60_000) continue;
    planned.push({ offsetMinutes, sendAt });
  }
  return planned;
}

/** Human label for a reminder offset: 1440 → "24 hours", 120 → "2 hours", 30 → "30 minutes". */
export function describeOffset(minutes: number): string {
  if (minutes % 1440 === 0 && minutes >= 2880) return `${minutes / 1440} days`;
  if (minutes % 60 === 0) return minutes === 60 ? "1 hour" : `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

/** Offsets an owner can choose from in settings. */
export const REMINDER_OFFSET_CHOICES = [2880, 1440, 240, 120, 60] as const;
