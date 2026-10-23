import type { Channel } from "@/generated/prisma/client";
import { localMinuteOfDay, localWeekday, parseHm } from "@/lib/time";
import type { Db } from "./types";

/** The open slot being offered. */
export type Slot = {
  locationId: string;
  serviceId: string;
  resourceId: string;
  startAt: Date;
  endAt: Date;
  /** The customer who cancelled; never offered their own slot back. */
  cancelledCustomerId: string | null;
};

export type Candidate = {
  waitlistEntryId: string;
  customerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  preferredChannel: Channel;
  granted: Channel[];
  entryServiceId: string | null;
  preferredDays: number[];
  earliestMinute: number;
  latestMinute: number;
  joinedAt: Date;
  /** Customer already has a non-cancelled appointment overlapping the slot. */
  busy: boolean;
  /** Customer was already offered this slot. */
  alreadyOffered: boolean;
};

export type ExclusionReason =
  | "no_consent"
  | "no_contact"
  | "different_service"
  | "day_not_preferred"
  | "outside_time_window"
  | "busy"
  | "cancelled_this_slot"
  | "already_offered";

export const EXCLUSION_LABELS: Record<ExclusionReason, string> = {
  no_consent: "No messaging consent",
  no_contact: "No phone or email for a consented channel",
  different_service: "Wants a different service",
  day_not_preferred: "Day not in their preferences",
  outside_time_window: "Outside their preferred times",
  busy: "Already booked at that time",
  cancelled_this_slot: "Cancelled this appointment",
  already_offered: "Already offered this opening",
};

export type Evaluated =
  | { candidate: Candidate; eligible: true; channel: Channel; address: string; rank: number }
  | { candidate: Candidate; eligible: false; reason: ExclusionReason };

function addressFor(c: Candidate, channel: Channel): string | null {
  return channel === "EMAIL" ? c.email : c.phone;
}

/** Picks the customer's preferred channel when it is consented and reachable, otherwise the next best one. */
export function pickChannel(c: Candidate): { channel: Channel; address: string } | null {
  const order: Channel[] = [c.preferredChannel, "WHATSAPP", "SMS", "EMAIL"];
  for (const channel of order) {
    if (!c.granted.includes(channel)) continue;
    const address = addressFor(c, channel);
    if (address) return { channel, address };
  }
  return null;
}

/**
 * Decides who may be offered a slot, and in what order. Pure and deterministic so the
 * rules are easy to test and to explain to an owner.
 *
 * Order: customers who asked for this exact service first, then "any service"; within
 * each group, whoever joined the waitlist earliest goes first.
 */
export function evaluateCandidates(slot: Slot, timezone: string, candidates: Candidate[]): Evaluated[] {
  const weekday = localWeekday(slot.startAt, timezone);
  const startMin = localMinuteOfDay(slot.startAt, timezone);
  const endMin = startMin + Math.round((slot.endAt.getTime() - slot.startAt.getTime()) / 60000);

  const results: Evaluated[] = candidates.map((c) => {
    if (c.customerId === slot.cancelledCustomerId) return { candidate: c, eligible: false, reason: "cancelled_this_slot" };
    if (c.alreadyOffered) return { candidate: c, eligible: false, reason: "already_offered" };
    if (c.entryServiceId && c.entryServiceId !== slot.serviceId)
      return { candidate: c, eligible: false, reason: "different_service" };
    if (c.preferredDays.length > 0 && !c.preferredDays.includes(weekday))
      return { candidate: c, eligible: false, reason: "day_not_preferred" };
    if (startMin < c.earliestMinute || endMin > c.latestMinute)
      return { candidate: c, eligible: false, reason: "outside_time_window" };
    if (c.busy) return { candidate: c, eligible: false, reason: "busy" };
    if (c.granted.length === 0) return { candidate: c, eligible: false, reason: "no_consent" };
    const pick = pickChannel(c);
    if (!pick) return { candidate: c, eligible: false, reason: "no_contact" };
    return { candidate: c, eligible: true, ...pick, rank: 0 };
  });

  const eligible = results
    .filter((r): r is Extract<Evaluated, { eligible: true }> => r.eligible)
    .sort((a, b) => {
      const exact = Number(b.candidate.entryServiceId === slot.serviceId) - Number(a.candidate.entryServiceId === slot.serviceId);
      return exact || a.candidate.joinedAt.getTime() - b.candidate.joinedAt.getTime();
    });
  eligible.forEach((r, i) => (r.rank = i + 1));

  return [...eligible, ...results.filter((r) => !r.eligible)];
}

/** Loads every active waitlist entry at the slot's location with what eligibility needs. */
export async function loadCandidates(db: Db, slot: Slot, campaignId?: string, now = new Date()): Promise<Candidate[]> {
  const entries = await db.waitlistEntry.findMany({
    where: {
      locationId: slot.locationId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      customer: { deletedAt: null },
    },
    orderBy: { createdAt: "asc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          preferredChannel: true,
          consents: { where: { status: "GRANTED" }, select: { channel: true } },
          appointments: {
            where: { status: { not: "CANCELLED" }, startAt: { lt: slot.endAt }, endAt: { gt: slot.startAt } },
            select: { id: true },
          },
          offers: campaignId ? { where: { campaignId }, select: { id: true } } : false,
        },
      },
    },
  });

  // One entry per customer: the first (oldest) one wins.
  const seen = new Set<string>();
  const list: Candidate[] = [];
  for (const e of entries) {
    if (seen.has(e.customerId)) continue;
    seen.add(e.customerId);
    list.push({
      waitlistEntryId: e.id,
      customerId: e.customerId,
      name: e.customer.name,
      phone: e.customer.phone,
      email: e.customer.email,
      preferredChannel: e.customer.preferredChannel,
      granted: e.customer.consents.map((c) => c.channel),
      entryServiceId: e.serviceId,
      preferredDays: e.preferredDays,
      earliestMinute: e.earliestMinute,
      latestMinute: e.latestMinute,
      joinedAt: e.createdAt,
      busy: e.customer.appointments.length > 0,
      alreadyOffered: Array.isArray(e.customer.offers) && e.customer.offers.length > 0,
    });
  }
  return list;
}

/** True when `at` falls inside the location's quiet hours (which may wrap midnight). */
export function inQuietHours(at: Date, timezone: string, start: string, end: string): boolean {
  const m = localMinuteOfDay(at, timezone);
  const s = parseHm(start);
  const e = parseHm(end);
  if (s === e) return false;
  return s < e ? m >= s && m < e : m >= s || m < e;
}
