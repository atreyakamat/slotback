/**
 * Appointment lifecycle for online booking and reminders: book, confirm, cancel, no-show,
 * complete. Functions take the Prisma client as an argument and avoid `server-only`, so the
 * demo seed and the tests can use them directly.
 *
 * Every state change writes its audit event (and any messages) in the same transaction.
 */
import { createHash, randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { ActorType } from "@/generated/prisma/enums";
import { normalizeIndianMobile } from "@/lib/phone";
import { planReminders } from "@/lib/reminders";
import { freeSlots, type BusinessHours } from "@/lib/slots";
import { addDays, formatDate, formatTime, localDateKey, zonedToUtc } from "@/lib/time";

type Tx = Prisma.TransactionClient;

/** Online bookings a single phone number may hold at once, per location. */
export const MAX_OPEN_ONLINE_BOOKINGS = 3;

// ─── Tokens ──────────────────────────────────────────────────────────────────

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A random manage-booking token. Only its hash is stored. */
export function newManageToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function manageUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/a/${token}`;
}

// ─── Messages ────────────────────────────────────────────────────────────────

type MessageContext = {
  customerName: string;
  serviceName: string;
  locationName: string;
  startAt: Date;
  timeZone: string;
  link: string;
};

function whenPhrase(startAt: Date, sendAt: Date, timeZone: string): string {
  const day = localDateKey(startAt, timeZone);
  const sendDay = localDateKey(sendAt, timeZone);
  const time = formatTime(startAt, timeZone);
  if (day === sendDay) return `today at ${time}`;
  if (day === addDays(sendDay, 1)) return `tomorrow at ${time}`;
  return `on ${formatDate(startAt, timeZone)} at ${time}`;
}

export function confirmationBody(c: MessageContext, now: Date): string {
  const first = c.customerName.split(" ")[0];
  return (
    `Hi ${first}, your ${c.serviceName} at ${c.locationName} is booked for ${whenPhrase(c.startAt, now, c.timeZone)}. ` +
    `Confirm or cancel here: ${c.link}`
  );
}

export function reminderBody(c: MessageContext, sendAt: Date): string {
  const first = c.customerName.split(" ")[0];
  return (
    `Hi ${first}, a reminder of your ${c.serviceName} at ${c.locationName} ${whenPhrase(c.startAt, sendAt, c.timeZone)}. ` +
    `Tap to confirm, or cancel so someone else can have the slot: ${c.link}`
  );
}

export type QueueInput = {
  appointment: { id: string; startAt: Date; locationId: string };
  location: { name: string; timezone: string; quietHoursStart: string; quietHoursEnd: string; reminderOffsetsMinutes: number[] };
  customer: { name: string; phone: string };
  serviceName: string;
  token: string;
  baseUrl: string;
  now: Date;
  includeConfirmation: boolean;
};

/** Builds the booking confirmation (optional) and scheduled reminder rows for one appointment. */
export function buildAppointmentMessages(q: QueueInput): Prisma.OutboxMessageCreateManyInput[] {
  const ctx: MessageContext = {
    customerName: q.customer.name,
    serviceName: q.serviceName,
    locationName: q.location.name,
    startAt: q.appointment.startAt,
    timeZone: q.location.timezone,
    link: manageUrl(q.baseUrl, q.token),
  };
  const base = {
    locationId: q.appointment.locationId,
    appointmentId: q.appointment.id,
    channel: "WHATSAPP" as const,
    provider: "whatsapp",
    toAddress: q.customer.phone,
  };
  const rows: Prisma.OutboxMessageCreateManyInput[] = [];
  if (q.includeConfirmation) {
    rows.push({
      ...base,
      purpose: "BOOKING_CONFIRMATION",
      body: confirmationBody(ctx, q.now),
      nextAttemptAt: q.now,
      idempotencyKey: `appt:${q.appointment.id}:confirmation`,
    });
  }
  const planned = planReminders({
    startAt: q.appointment.startAt,
    offsetsMinutes: q.location.reminderOffsetsMinutes,
    now: q.now,
    quiet: { start: q.location.quietHoursStart, end: q.location.quietHoursEnd },
    timeZone: q.location.timezone,
  });
  for (const r of planned) {
    rows.push({
      ...base,
      purpose: "APPOINTMENT_REMINDER",
      body: reminderBody(ctx, r.sendAt),
      nextAttemptAt: r.sendAt,
      idempotencyKey: `appt:${q.appointment.id}:reminder:${r.offsetMinutes}`,
    });
  }
  return rows;
}

/** Writes an appointment's messages to the outbox. Idempotency keys make re-queuing a no-op. */
export async function queueAppointmentMessages(tx: Tx, q: QueueInput): Promise<number> {
  const rows = buildAppointmentMessages(q);
  if (rows.length === 0) return 0;
  const { count } = await tx.outboxMessage.createMany({ data: rows, skipDuplicates: true });
  return count;
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingInput = {
  slug: string;
  serviceId: string;
  startAt: Date;
  name: string;
  phone: string;
  whatsappConsent: boolean;
};

export type BookingResult =
  | { ok: true; appointmentId: string; token: string }
  | { ok: false; error: "not-found" | "invalid-phone" | "invalid-name" | "slot-unavailable" | "too-many-bookings" };

/** True when Postgres rejected a write because of the no-double-booking exclusion constraint. */
export function isOverlapError(err: unknown): boolean {
  const text = (e: unknown): string => {
    if (!e || typeof e !== "object") return String(e ?? "");
    const o = e as { message?: unknown; cause?: unknown; meta?: unknown };
    return `${String(o.message ?? "")} ${JSON.stringify(o.meta ?? "")} ${o.cause ? text(o.cause) : ""}`;
  };
  return /appointments_no_resource_overlap|exclusion constraint|23P01/i.test(text(err));
}

/** Loads what the public booking page needs. Null when the link is unknown or switched off. */
export async function getBookingLocation(db: PrismaClient | Tx, slug: string) {
  return db.location.findFirst({
    where: { bookingSlug: slug, bookingEnabled: true },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      timezone: true,
      organizationId: true,
      businessHours: true,
      minLeadMinutes: true,
      bookingHorizonDays: true,
      slotIntervalMinutes: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      reminderOffsetsMinutes: true,
      services: {
        where: { active: true, resources: { some: { active: true } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, durationMinutes: true, pricePaise: true },
      },
    },
  });
}

/** Free start times for a service on a local date, with fresh busy data. */
export async function findFreeSlots(
  db: PrismaClient | Tx,
  location: { id: string; timezone: string; businessHours: unknown; minLeadMinutes: number; slotIntervalMinutes: number },
  service: { id: string; durationMinutes: number },
  date: string,
  now: Date,
) {
  const resources = await db.resource.findMany({
    where: { locationId: location.id, active: true, services: { some: { id: service.id } } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const dayStart = zonedToUtc(date, 0, location.timezone);
  const dayEnd = zonedToUtc(addDays(date, 1), 0, location.timezone);
  const busy = await db.appointment.findMany({
    where: {
      resourceId: { in: resources.map((r) => r.id) },
      status: { not: "CANCELLED" },
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { resourceId: true, startAt: true, endAt: true },
  });
  return freeSlots({
    date,
    timeZone: location.timezone,
    hours: (location.businessHours ?? {}) as BusinessHours,
    durationMinutes: service.durationMinutes,
    intervalMinutes: location.slotIntervalMinutes,
    resourceIds: resources.map((r) => r.id),
    busy,
    now,
    minLeadMinutes: location.minLeadMinutes,
  });
}

/**
 * Books an appointment from the public booking link. Re-checks the slot against fresh data;
 * the database exclusion constraint settles any remaining race between two patients.
 */
export async function bookOnline(
  db: PrismaClient,
  input: BookingInput,
  opts: { now: Date; baseUrl: string },
): Promise<BookingResult> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return { ok: false, error: "invalid-name" };
  const phone = normalizeIndianMobile(input.phone);
  if (!phone) return { ok: false, error: "invalid-phone" };

  const location = await getBookingLocation(db, input.slug);
  const service = location?.services.find((s) => s.id === input.serviceId);
  if (!location || !service) return { ok: false, error: "not-found" };

  const date = localDateKey(input.startAt, location.timezone);
  const today = localDateKey(opts.now, location.timezone);
  if (date < today || date >= addDays(today, location.bookingHorizonDays)) return { ok: false, error: "slot-unavailable" };
  const slots = await findFreeSlots(db, location, service, date, opts.now);
  const slot = slots.find((s) => s.startAt.getTime() === input.startAt.getTime());
  if (!slot) return { ok: false, error: "slot-unavailable" };

  const { token, hash } = newManageToken();
  try {
    return await db.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: { locationId: location.id, phone, deletedAt: null },
        select: { id: true, name: true },
      });
      if (customer) {
        const open = await tx.appointment.count({
          where: { customerId: customer.id, status: "BOOKED", source: "ONLINE", startAt: { gt: opts.now } },
        });
        if (open >= MAX_OPEN_ONLINE_BOOKINGS) return { ok: false as const, error: "too-many-bookings" as const };
      } else {
        customer = await tx.customer.create({
          data: { locationId: location.id, name, phone, preferredChannel: "WHATSAPP" },
          select: { id: true, name: true },
        });
      }

      if (input.whatsappConsent) {
        await tx.channelConsent.upsert({
          where: { customerId_channel: { customerId: customer.id, channel: "WHATSAPP" } },
          update: { status: "GRANTED", source: "online booking" },
          create: { customerId: customer.id, channel: "WHATSAPP", status: "GRANTED", source: "online booking" },
        });
      }

      const appointment = await tx.appointment.create({
        data: {
          locationId: location.id,
          customerId: customer.id,
          serviceId: service.id,
          resourceId: slot.resourceId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          source: "ONLINE",
          valuePaise: service.pricePaise,
          manageTokenHash: hash,
        },
        select: { id: true, startAt: true, locationId: true },
      });

      const queued = input.whatsappConsent
        ? await queueAppointmentMessages(tx, {
            appointment,
            location,
            customer: { name, phone },
            serviceName: service.name,
            token,
            baseUrl: opts.baseUrl,
            now: opts.now,
            includeConfirmation: true,
          })
        : 0;

      await tx.auditEvent.create({
        data: {
          organizationId: location.organizationId,
          actorType: "CUSTOMER",
          actorId: customer.id,
          entityType: "appointment",
          entityId: appointment.id,
          action: "appointment.booked_online",
          metadata: { messagesQueued: queued, whatsappConsent: input.whatsappConsent },
        },
      });
      return { ok: true as const, appointmentId: appointment.id, token };
    });
  } catch (err) {
    if (isOverlapError(err)) return { ok: false, error: "slot-unavailable" };
    throw err;
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

export type Actor = { type: ActorType; id: string | null };

export type TransitionResult = { ok: true } | { ok: false; error: "not-found" | "not-allowed" };

const appointmentForTransition = {
  id: true,
  status: true,
  startAt: true,
  endAt: true,
  serviceId: true,
  resourceId: true,
  valuePaise: true,
  confirmedAt: true,
  customerId: true,
  location: { select: { id: true, organizationId: true, minLeadMinutes: true, offerTtlMinutes: true, offerBatchSize: true } },
} satisfies Prisma.AppointmentSelect;

/** Scope for a lookup: staff pass their location id; customers pass their token hash. */
export type AppointmentRef = { id: string; locationId: string } | { tokenHash: string };

function whereFor(ref: AppointmentRef): Prisma.AppointmentWhereInput {
  return "tokenHash" in ref ? { manageTokenHash: ref.tokenHash } : { id: ref.id, locationId: ref.locationId };
}

async function audit(tx: Tx, organizationId: string, actor: Actor, appointmentId: string, action: string, metadata: Prisma.InputJsonValue = {}) {
  await tx.auditEvent.create({
    data: { organizationId, actorType: actor.type, actorId: actor.id, entityType: "appointment", entityId: appointmentId, action, metadata },
  });
}

/** Marks a future booked appointment as confirmed. Idempotent. */
export async function confirmAppointment(db: PrismaClient, ref: AppointmentRef, actor: Actor, now: Date): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const a = await tx.appointment.findFirst({ where: whereFor(ref), select: appointmentForTransition });
    if (!a) return { ok: false, error: "not-found" };
    if (a.status !== "BOOKED" || a.endAt <= now) return { ok: false, error: "not-allowed" };
    if (a.confirmedAt) return { ok: true };
    await tx.appointment.update({ where: { id: a.id }, data: { confirmedAt: now } });
    await audit(tx, a.location.organizationId, actor, a.id, "appointment.confirmed");
    return { ok: true };
  });
}

export type CancelResult = TransitionResult | { ok: true; campaignId: string | null };

/**
 * Cancels a booked appointment, withdraws its pending messages, and opens a draft recovery
 * campaign for the freed slot when there is still time to refill it from the waitlist.
 */
export async function cancelAppointment(
  db: PrismaClient,
  ref: AppointmentRef,
  actor: Actor,
  now: Date,
  reason: string | null = null,
): Promise<CancelResult> {
  return db.$transaction(async (tx) => {
    const a = await tx.appointment.findFirst({ where: whereFor(ref), select: appointmentForTransition });
    if (!a) return { ok: false, error: "not-found" };
    if (a.status !== "BOOKED" || a.startAt <= now) return { ok: false, error: "not-allowed" };

    // Conditional update: two concurrent cancels cannot both proceed.
    const { count } = await tx.appointment.updateMany({
      where: { id: a.id, status: "BOOKED" },
      data: { status: "CANCELLED", cancelledAt: now, cancelReason: reason?.slice(0, 200) ?? null },
    });
    if (count === 0) return { ok: false, error: "not-allowed" };

    await tx.outboxMessage.updateMany({
      where: { appointmentId: a.id, status: "QUEUED" },
      data: { status: "CANCELLED", errorCode: "appointment_cancelled", lockedUntil: null },
    });

    let campaignId: string | null = null;
    const leadMinutes = (a.startAt.getTime() - now.getTime()) / 60_000;
    if (leadMinutes >= a.location.minLeadMinutes) {
      const campaign = await tx.recoveryCampaign.create({
        data: {
          locationId: a.location.id,
          appointmentId: a.id,
          serviceId: a.serviceId,
          resourceId: a.resourceId,
          startAt: a.startAt,
          endAt: a.endAt,
          valuePaise: a.valuePaise,
          status: "DRAFT",
          rulesSnapshot: {
            minLeadMinutes: a.location.minLeadMinutes,
            offerTtlMinutes: a.location.offerTtlMinutes,
            offerBatchSize: a.location.offerBatchSize,
          },
          createdById: actor.type === "USER" ? actor.id : null,
        },
        select: { id: true },
      });
      campaignId = campaign.id;
    }

    await audit(tx, a.location.organizationId, actor, a.id, "appointment.cancelled", {
      leadMinutes: Math.round(leadMinutes),
      recoveryDrafted: campaignId !== null,
    });
    return { ok: true, campaignId };
  });
}

/** Staff record what happened after the start time: the patient came (COMPLETED) or did not (NO_SHOW). */
export async function recordOutcome(
  db: PrismaClient,
  ref: { id: string; locationId: string },
  outcome: "COMPLETED" | "NO_SHOW",
  actor: Actor,
  now: Date,
): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const a = await tx.appointment.findFirst({ where: whereFor(ref), select: appointmentForTransition });
    if (!a) return { ok: false, error: "not-found" };
    if (a.startAt > now) return { ok: false, error: "not-allowed" };
    // Staff may correct a recorded outcome, but never revive a cancelled appointment.
    if (a.status === "CANCELLED" || a.status === outcome) return a.status === outcome ? { ok: true } : { ok: false, error: "not-allowed" };
    await tx.appointment.update({
      where: { id: a.id },
      data:
        outcome === "NO_SHOW"
          ? { status: "NO_SHOW", noShowAt: now, completedAt: null }
          : { status: "COMPLETED", completedAt: now, noShowAt: null },
    });
    await tx.outboxMessage.updateMany({
      where: { appointmentId: a.id, status: "QUEUED" },
      data: { status: "CANCELLED", errorCode: "appointment_finished", lockedUntil: null },
    });
    await audit(tx, a.location.organizationId, actor, a.id, outcome === "NO_SHOW" ? "appointment.no_show" : "appointment.completed", {
      previous: a.status,
    });
    return { ok: true };
  });
}

/** Customer opt-out from their manage link: revokes WhatsApp consent and withdraws queued messages. */
export async function stopWhatsAppReminders(db: PrismaClient, tokenHash: string, now: Date): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const a = await tx.appointment.findFirst({
      where: { manageTokenHash: tokenHash },
      select: { id: true, customerId: true, location: { select: { organizationId: true } } },
    });
    if (!a || !a.customerId) return { ok: false, error: "not-found" };
    await tx.channelConsent.upsert({
      where: { customerId_channel: { customerId: a.customerId, channel: "WHATSAPP" } },
      update: { status: "REVOKED", source: "manage link" },
      create: { customerId: a.customerId, channel: "WHATSAPP", status: "REVOKED", source: "manage link" },
    });
    await tx.outboxMessage.updateMany({
      where: { appointment: { customerId: a.customerId }, channel: "WHATSAPP", status: "QUEUED" },
      data: { status: "SUPPRESSED", errorCode: "consent_revoked", lockedUntil: null },
    });
    await tx.auditEvent.create({
      data: {
        organizationId: a.location.organizationId,
        actorType: "CUSTOMER",
        actorId: a.customerId,
        entityType: "customer",
        entityId: a.customerId,
        action: "consent.revoked",
        metadata: { channel: "WHATSAPP", at: now.toISOString() },
      },
    });
    return { ok: true };
  });
}

/** Customers with at least `threshold` no-shows in the lookback window, keyed by customer id. */
export async function repeatNoShows(
  db: PrismaClient | Tx,
  locationId: string,
  now: Date,
  opts: { threshold?: number; lookbackDays?: number; customerIds?: string[] } = {},
): Promise<Map<string, number>> {
  const since = new Date(now.getTime() - (opts.lookbackDays ?? 180) * 24 * 3600_000);
  const rows = await db.appointment.groupBy({
    by: ["customerId"],
    where: {
      locationId,
      status: "NO_SHOW",
      startAt: { gte: since },
      customerId: opts.customerIds ? { in: opts.customerIds } : { not: null },
    },
    _count: { _all: true },
  });
  const out = new Map<string, number>();
  for (const r of rows) if (r.customerId && r._count._all >= (opts.threshold ?? 2)) out.set(r.customerId, r._count._all);
  return out;
}
