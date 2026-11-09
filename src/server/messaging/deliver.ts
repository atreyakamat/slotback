/**
 * Outbox delivery worker. Picks due messages under a short lease (so concurrent runs never
 * send the same row twice), re-checks that each one should still go out, and hands it to
 * the provider. Called by the cron endpoint and the staff "send due messages" button.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { isQuiet, moveAfterQuietHours } from "@/lib/reminders";
import { SendError, type MessageSender } from "./sender";

const LEASE_MINUTES = 5;
const MAX_ATTEMPTS = 5;
/** A reminder this close to (or after) the appointment start is no longer useful. */
const STALE_BEFORE_START_MINUTES = 15;

export type DeliveryReport = { claimed: number; sent: number; deferred: number; skipped: number; failed: number };

async function claimDue(db: PrismaClient, now: Date, limit: number, locationId?: string): Promise<string[]> {
  const leaseUntil = new Date(now.getTime() + LEASE_MINUTES * 60_000);
  const rows = locationId
    ? await db.$queryRaw<{ id: string }[]>`
        UPDATE outbox_messages SET locked_until = ${leaseUntil}
        WHERE id IN (
          SELECT id FROM outbox_messages
          WHERE status = 'QUEUED' AND next_attempt_at <= ${now}
            AND (locked_until IS NULL OR locked_until < ${now})
            AND location_id = ${locationId}
          ORDER BY next_attempt_at
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id`
    : await db.$queryRaw<{ id: string }[]>`
        UPDATE outbox_messages SET locked_until = ${leaseUntil}
        WHERE id IN (
          SELECT id FROM outbox_messages
          WHERE status = 'QUEUED' AND next_attempt_at <= ${now}
            AND (locked_until IS NULL OR locked_until < ${now})
          ORDER BY next_attempt_at
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id`;
  return rows.map((r) => r.id);
}

export async function deliverDueMessages(
  db: PrismaClient,
  sender: MessageSender,
  opts: { now?: Date; limit?: number; locationId?: string } = {},
): Promise<DeliveryReport> {
  const now = opts.now ?? new Date();
  const ids = await claimDue(db, now, opts.limit ?? 100, opts.locationId);
  const report: DeliveryReport = { claimed: ids.length, sent: 0, deferred: 0, skipped: 0, failed: 0 };

  for (const id of ids) {
    const m = await db.outboxMessage.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        channel: true,
        purpose: true,
        toAddress: true,
        body: true,
        attempts: true,
        idempotencyKey: true,
        location: { select: { timezone: true, quietHoursStart: true, quietHoursEnd: true } },
        appointment: { select: { status: true, startAt: true, customerId: true } },
        offer: { select: { customerId: true } },
      },
    });
    if (!m || m.status !== "QUEUED") continue;

    const close = (status: "CANCELLED" | "SUPPRESSED", errorCode: string) =>
      db.outboxMessage.update({ where: { id }, data: { status, errorCode, lockedUntil: null } });

    // 1. Appointment messages only make sense while the appointment is still on.
    if (m.purpose !== "OFFER") {
      if (!m.appointment || m.appointment.status !== "BOOKED") {
        await close("CANCELLED", "appointment_not_booked");
        report.skipped++;
        continue;
      }
      if (m.appointment.startAt.getTime() - now.getTime() < STALE_BEFORE_START_MINUTES * 60_000) {
        await close("CANCELLED", "stale");
        report.skipped++;
        continue;
      }
    }

    // 2. Consent is checked at send time, not only when the message was queued.
    const customerId = m.appointment?.customerId ?? m.offer?.customerId ?? null;
    const consent = customerId
      ? await db.channelConsent.findUnique({ where: { customerId_channel: { customerId, channel: m.channel } }, select: { status: true } })
      : null;
    if (consent?.status !== "GRANTED") {
      await close("SUPPRESSED", "no_consent");
      report.skipped++;
      continue;
    }

    // 3. Never message inside quiet hours: defer to when they end, if that is still useful.
    const quiet = { start: m.location.quietHoursStart, end: m.location.quietHoursEnd };
    if (isQuiet(now, quiet, m.location.timezone)) {
      const later = moveAfterQuietHours(now, quiet, m.location.timezone);
      const tooLate =
        m.appointment && m.appointment.startAt.getTime() - later.getTime() < STALE_BEFORE_START_MINUTES * 60_000;
      if (tooLate) {
        await close("CANCELLED", "stale");
        report.skipped++;
      } else {
        await db.outboxMessage.update({ where: { id }, data: { nextAttemptAt: later, lockedUntil: null } });
        report.deferred++;
      }
      continue;
    }

    // 4. Send.
    try {
      const result = await sender.send({
        id: m.id,
        channel: m.channel,
        purpose: m.purpose,
        to: m.toAddress,
        body: m.body,
        idempotencyKey: m.idempotencyKey,
      });
      await db.outboxMessage.update({
        where: { id },
        data: {
          status: "SENT",
          provider: sender.name,
          providerMessageId: result.providerMessageId,
          sentAt: now,
          attempts: { increment: 1 },
          errorCode: null,
          lockedUntil: null,
        },
      });
      report.sent++;
    } catch (err) {
      const attempts = m.attempts + 1;
      const retryable = !(err instanceof SendError) || err.retryable;
      const giveUp = !retryable || attempts >= MAX_ATTEMPTS;
      await db.outboxMessage.update({
        where: { id },
        data: {
          attempts,
          status: giveUp ? "FAILED" : "QUEUED",
          errorCode: err instanceof SendError ? err.code : "send_error",
          nextAttemptAt: new Date(now.getTime() + 2 ** attempts * 60_000),
          provider: sender.name,
          lockedUntil: null,
        },
      });
      report.failed++;
    }
  }
  return report;
}
