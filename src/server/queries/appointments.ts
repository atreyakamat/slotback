import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Member } from "../auth/dal";
import { repeatNoShows } from "../appointments/core";
import { db } from "../db";
import { addDays, localDateKey, zonedToUtc } from "@/lib/time";

export type ReminderState = "confirmed" | "reminded" | "scheduled" | "no-whatsapp" | "none";

const select = {
  id: true,
  startAt: true,
  endAt: true,
  status: true,
  source: true,
  confirmedAt: true,
  customerId: true,
  customer: { select: { name: true, phone: true } },
  service: { select: { name: true } },
  resource: { select: { name: true } },
  recoveryCampaign: { select: { id: true, status: true } },
  messages: {
    where: { purpose: { in: ["APPOINTMENT_REMINDER", "BOOKING_CONFIRMATION"] } },
    select: { purpose: true, status: true, nextAttemptAt: true, sentAt: true },
  },
} satisfies Prisma.AppointmentSelect;

function reminderState(a: { confirmedAt: Date | null; messages: { purpose: string; status: string }[] }): ReminderState {
  if (a.confirmedAt) return "confirmed";
  const reminders = a.messages.filter((m) => m.purpose === "APPOINTMENT_REMINDER");
  if (reminders.some((m) => m.status === "SENT" || m.status === "DELIVERED")) return "reminded";
  if (a.messages.some((m) => m.status === "QUEUED")) return "scheduled";
  if (a.messages.some((m) => m.status === "SUPPRESSED")) return "no-whatsapp";
  return a.messages.length === 0 ? "none" : "reminded";
}

/**
 * Staff appointments board for the member's location:
 * - needsOutcome: started, still BOOKED, so staff should record "came" or "no-show";
 * - needsCall: in the next 24 hours, reminded or unreachable, and not confirmed;
 * - days: the next 7 days of bookings.
 */
export async function getAppointmentsBoard(member: Member, now = new Date()) {
  const { id: locationId, timezone } = member.location;
  const today = localDateKey(now, timezone);
  const from = zonedToUtc(today, 0, timezone);
  const to = zonedToUtc(addDays(today, 7), 0, timezone);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000);

  const [upcoming, unresolved] = await Promise.all([
    db.appointment.findMany({ where: { locationId, startAt: { gte: from, lt: to } }, orderBy: { startAt: "asc" }, select }),
    db.appointment.findMany({
      where: { locationId, status: "BOOKED", startAt: { gte: weekAgo, lte: now } },
      orderBy: { startAt: "asc" },
      select,
    }),
  ]);

  const customerIds = [...new Set([...upcoming, ...unresolved].map((a) => a.customerId).filter((id): id is string => Boolean(id)))];
  const noShows = await repeatNoShows(db, locationId, now, { customerIds });

  const decorate = (a: (typeof upcoming)[number]) => ({
    ...a,
    reminder: reminderState(a),
    repeatNoShows: a.customerId ? (noShows.get(a.customerId) ?? 0) : 0,
  });

  const rows = upcoming.map(decorate);
  const dayIn = new Date(now.getTime() + 24 * 3600_000);
  const needsCall = rows.filter(
    (a) =>
      a.status === "BOOKED" &&
      a.startAt > now &&
      a.startAt <= dayIn &&
      (a.reminder === "reminded" || a.reminder === "no-whatsapp" || a.reminder === "none" || a.repeatNoShows > 0),
  );

  const days = new Map<string, typeof rows>();
  for (const a of rows) {
    if (a.startAt <= now && a.status === "BOOKED") continue; // shown under needsOutcome
    const key = localDateKey(a.startAt, timezone);
    days.set(key, [...(days.get(key) ?? []), a]);
  }

  return {
    needsOutcome: unresolved.map(decorate),
    needsCall,
    days: [...days.entries()].map(([date, appointments]) => ({ date, appointments })),
  };
}

/** No-show rate over the last `days` days: no-shows / (completed + no-shows). */
export async function getNoShowStats(locationId: string, now = new Date(), days = 30) {
  const since = new Date(now.getTime() - days * 24 * 3600_000);
  const rows = await db.appointment.groupBy({
    by: ["status"],
    where: { locationId, startAt: { gte: since, lte: now }, status: { in: ["COMPLETED", "NO_SHOW"] } },
    _count: { _all: true },
  });
  const count = (s: string) => rows.find((r) => r.status === s)?._count._all ?? 0;
  const noShows = count("NO_SHOW");
  const attended = count("COMPLETED");
  const total = noShows + attended;
  return { noShows, total, rate: total === 0 ? null : noShows / total };
}

const messageSelect = {
  id: true,
  purpose: true,
  channel: true,
  status: true,
  provider: true,
  toAddress: true,
  body: true,
  nextAttemptAt: true,
  sentAt: true,
  errorCode: true,
  appointment: { select: { customer: { select: { name: true } } } },
} satisfies Prisma.OutboxMessageSelect;

/** Message log for the location: what is coming up next, and what has already been handled. */
export async function getMessageLog(locationId: string, limit = 30) {
  const [upcoming, recent] = await Promise.all([
    db.outboxMessage.findMany({
      where: { locationId, status: "QUEUED" },
      orderBy: { nextAttemptAt: "asc" },
      take: limit,
      select: messageSelect,
    }),
    db.outboxMessage.findMany({
      where: { locationId, status: { not: "QUEUED" } },
      orderBy: [{ sentAt: { sort: "desc", nulls: "last" } }, { nextAttemptAt: "desc" }],
      take: limit,
      select: messageSelect,
    }),
  ]);
  return { upcoming, recent };
}

export async function getMessageCounts(locationId: string, now = new Date()) {
  const [due, scheduled] = await Promise.all([
    db.outboxMessage.count({ where: { locationId, status: "QUEUED", nextAttemptAt: { lte: now } } }),
    db.outboxMessage.count({ where: { locationId, status: "QUEUED", nextAttemptAt: { gt: now } } }),
  ]);
  return { due, scheduled };
}
