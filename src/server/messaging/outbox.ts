import { Prisma, type Channel, type PrismaClient } from "@/generated/prisma/client";
import { isQuiet, moveAfterQuietHours } from "@/lib/reminders";
import { ProviderError } from "./provider";
import { providerByName } from "./registry";
import { redactLinks, type TemplateRef } from "./templates";

const MAX_ATTEMPTS = 5;
const LEASE_SECONDS = 120;
/** A reminder this close to (or after) the appointment start is no longer useful. */
const STALE_BEFORE_START_MS = 15 * 60_000;

/** Exponential backoff: 1, 2, 4, 8 minutes. */
export function backoffMs(attempt: number) {
  return 60_000 * 2 ** Math.max(0, attempt - 1);
}

export type OutboxRunResult = { sent: number; retrying: number; failed: number; skipped: number; deferred: number };

/**
 * Delivers due outbox messages. Safe to run concurrently: rows are leased with
 * FOR UPDATE SKIP LOCKED, and each message carries an idempotency key for the provider.
 */
export async function processOutbox(
  db: PrismaClient,
  now = new Date(),
  limit = 25,
  opts: { locationId?: string } = {},
): Promise<OutboxRunResult> {
  const scope = opts.locationId ? Prisma.sql`AND location_id = ${opts.locationId}` : Prisma.empty;
  const leased = await db.$queryRaw<{ id: string }[]>`
    UPDATE outbox_messages
       SET attempts = attempts + 1,
           next_attempt_at = ${new Date(now.getTime() + LEASE_SECONDS * 1000)}
     WHERE id IN (
       SELECT id FROM outbox_messages
        WHERE status = 'QUEUED' AND next_attempt_at <= ${now} ${scope}
        ORDER BY next_attempt_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
     )
 RETURNING id`;

  const result: OutboxRunResult = { sent: 0, retrying: 0, failed: 0, skipped: 0, deferred: 0 };
  for (const { id } of leased) {
    const msg = await db.outboxMessage.findUniqueOrThrow({ where: { id } });
    if (msg.appointmentId) {
      const verdict = await checkAppointmentMessage(db, msg, now);
      if (verdict !== "send") {
        result[verdict]++;
        continue;
      }
    }
    try {
      const provider = providerByName(msg.provider);
      const sent = await provider.send({
        channel: msg.channel,
        to: msg.toAddress,
        body: msg.body,
        template: (msg.template as TemplateRef | null) ?? null,
        idempotencyKey: msg.idempotencyKey,
      });
      const status = sent.delivered ? "DELIVERED" : "SENT";
      await db.$transaction([
        db.outboxMessage.update({
          where: { id },
          data: {
            status,
            sentAt: now,
            providerMessageId: sent.providerMessageId,
            errorCode: null,
            body: provider.keepsBodies ? msg.body : redactLinks(msg.body),
            template: provider.keepsBodies ? undefined : Prisma.DbNull,
          },
        }),
        ...(msg.offerId
          ? [
              db.offer.updateMany({
                where: { id: msg.offerId, status: "QUEUED" },
                data: { status, sentAt: now },
              }),
            ]
          : []),
      ]);
      result.sent++;
    } catch (err) {
      const retryable = err instanceof ProviderError ? err.retryable : true;
      const code = err instanceof ProviderError ? err.code : "unexpected_error";
      if (retryable && msg.attempts < MAX_ATTEMPTS) {
        await db.outboxMessage.update({
          where: { id },
          data: { errorCode: code, nextAttemptAt: new Date(now.getTime() + backoffMs(msg.attempts)) },
        });
        result.retrying++;
      } else {
        await db.$transaction([
          db.outboxMessage.update({ where: { id }, data: { status: "FAILED", errorCode: code } }),
          ...(msg.offerId
            ? [db.offer.updateMany({ where: { id: msg.offerId, status: "QUEUED" }, data: { status: "FAILED" } })]
            : []),
        ]);
        result.failed++;
      }
    }
  }
  return result;
}

/** Puts a failed message back in the queue (staff "Retry" action). */
export async function retryMessage(db: PrismaClient, locationId: string, messageId: string, now = new Date()) {
  const { count } = await db.outboxMessage.updateMany({
    where: { id: messageId, locationId, status: "FAILED" },
    data: { status: "QUEUED", attempts: 0, nextAttemptAt: now, errorCode: null },
  });
  if (count > 0) {
    const msg = await db.outboxMessage.findUniqueOrThrow({ where: { id: messageId } });
    if (msg.offerId) await db.offer.updateMany({ where: { id: msg.offerId, status: "FAILED" }, data: { status: "QUEUED" } });
  }
  return count > 0;
}

type LeasedMessage = { id: string; appointmentId: string | null; channel: Channel };

/**
 * Send-time checks for appointment confirmations and reminders. Things change after a message
 * is queued (a cancellation, a revoked consent, quiet hours), so they are checked again here.
 */
async function checkAppointmentMessage(db: PrismaClient, msg: LeasedMessage, now: Date): Promise<"send" | "skipped" | "deferred"> {
  const close = (status: "CANCELLED" | "SUPPRESSED", errorCode: string) =>
    db.outboxMessage.update({ where: { id: msg.id }, data: { status, errorCode } });

  const appt = await db.appointment.findUnique({
    where: { id: msg.appointmentId! },
    select: {
      status: true,
      startAt: true,
      customerId: true,
      location: { select: { timezone: true, quietHoursStart: true, quietHoursEnd: true } },
    },
  });
  if (!appt || appt.status !== "BOOKED") {
    await close("CANCELLED", "appointment_not_booked");
    return "skipped";
  }
  if (appt.startAt.getTime() - now.getTime() < STALE_BEFORE_START_MS) {
    await close("CANCELLED", "stale");
    return "skipped";
  }

  const consent = appt.customerId
    ? await db.channelConsent.findUnique({
        where: { customerId_channel: { customerId: appt.customerId, channel: msg.channel } },
        select: { status: true },
      })
    : null;
  if (consent?.status !== "GRANTED") {
    await close("SUPPRESSED", "no_consent");
    return "skipped";
  }

  const quiet = { start: appt.location.quietHoursStart, end: appt.location.quietHoursEnd };
  if (isQuiet(now, quiet, appt.location.timezone)) {
    const later = moveAfterQuietHours(now, quiet, appt.location.timezone);
    if (appt.startAt.getTime() - later.getTime() < STALE_BEFORE_START_MS) {
      await close("CANCELLED", "stale");
      return "skipped";
    }
    // Waiting for quiet hours to end is not a failed attempt.
    await db.outboxMessage.update({ where: { id: msg.id }, data: { nextAttemptAt: later, attempts: { decrement: 1 } } });
    return "deferred";
  }
  return "send";
}
