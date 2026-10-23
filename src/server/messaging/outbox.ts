import type { PrismaClient } from "@/generated/prisma/client";
import { ProviderError } from "./provider";
import { providerByName } from "./registry";
import { redactLinks } from "./templates";

const MAX_ATTEMPTS = 5;
const LEASE_SECONDS = 120;

/** Exponential backoff: 1, 2, 4, 8 minutes. */
export function backoffMs(attempt: number) {
  return 60_000 * 2 ** Math.max(0, attempt - 1);
}

export type OutboxRunResult = { sent: number; retrying: number; failed: number };

/**
 * Delivers due outbox messages. Safe to run concurrently: rows are leased with
 * FOR UPDATE SKIP LOCKED, and each message carries an idempotency key for the provider.
 */
export async function processOutbox(db: PrismaClient, now = new Date(), limit = 25): Promise<OutboxRunResult> {
  const leased = await db.$queryRaw<{ id: string }[]>`
    UPDATE outbox_messages
       SET attempts = attempts + 1,
           next_attempt_at = ${new Date(now.getTime() + LEASE_SECONDS * 1000)}
     WHERE id IN (
       SELECT id FROM outbox_messages
        WHERE status = 'QUEUED' AND next_attempt_at <= ${now}
        ORDER BY next_attempt_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
     )
 RETURNING id`;

  const result: OutboxRunResult = { sent: 0, retrying: 0, failed: 0 };
  for (const { id } of leased) {
    const msg = await db.outboxMessage.findUniqueOrThrow({ where: { id } });
    const provider = providerByName(msg.provider);
    try {
      const sent = await provider.send({ channel: msg.channel, to: msg.toAddress, body: msg.body, idempotencyKey: msg.idempotencyKey });
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
