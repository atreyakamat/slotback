import { createHmac, timingSafeEqual } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Db } from "../domain/types";
import { safePost, type SafePostResult } from "./safe-fetch";

/**
 * Each integration's signing secret is derived from the server secret and the integration id,
 * so it never has to be stored. Rotating SESSION_SECRET rotates every signing secret.
 */
export function signingSecret(integrationId: string, serverSecret: string) {
  return `whsec_${createHmac("sha256", serverSecret).update(`webhook:${integrationId}`).digest("base64url")}`;
}

/** `v1=<hex>` over "<timestamp>.<body>", Stripe-style, so a captured delivery can't be replayed later. */
export function signPayload(secret: string, timestamp: number, body: string) {
  return `v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

/** What a receiver does: check the signature and reject anything older than five minutes. */
export function verifyDelivery(secret: string, timestamp: string, body: string, signature: string, now = Date.now()) {
  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || Math.abs(now / 1000 - ts) > 300) return false;
  const expected = Buffer.from(signPayload(secret, ts, body));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export type WebhookEvent = "slot.claimed" | "ping";

/** Queues an event for every active integration of the location that has a webhook. */
export async function enqueueWebhooks(db: Db, locationId: string, event: WebhookEvent, data: Prisma.InputJsonObject) {
  const targets = await db.integration.findMany({
    where: { locationId, revokedAt: null, webhookUrl: { not: null } },
    select: { id: true },
  });
  for (const t of targets) {
    await db.webhookDelivery.create({ data: { integrationId: t.id, event, payload: data } });
  }
  return targets.length;
}

const BACKOFF_MINUTES = [1, 5, 15, 60, 180, 360, 720];
export const MAX_WEBHOOK_ATTEMPTS = BACKOFF_MINUTES.length + 1;

type Post = (url: string, body: string, headers: Record<string, string>) => Promise<SafePostResult>;

/** Delivers due webhooks. Each delivery is leased with SKIP LOCKED so parallel runs never double-send. */
export async function processWebhooks(db: PrismaClient, serverSecret: string, now = new Date(), limit = 25, post: Post = safePost) {
  const leased = await db.$queryRaw<{ id: string }[]>`
    UPDATE webhook_deliveries SET next_attempt_at = ${new Date(now.getTime() + 60_000)}
    WHERE id IN (
      SELECT id FROM webhook_deliveries
      WHERE status = 'QUEUED' AND next_attempt_at <= ${now}
      ORDER BY next_attempt_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id`;
  let delivered = 0;
  let failed = 0;
  for (const { id } of leased) {
    const d = await db.webhookDelivery.findUniqueOrThrow({ where: { id }, include: { integration: true } });
    if (d.integration.revokedAt || !d.integration.webhookUrl) {
      await db.webhookDelivery.update({ where: { id }, data: { status: "FAILED", lastError: "integration removed" } });
      failed++;
      continue;
    }
    const body = JSON.stringify({ id: d.id, event: d.event, createdAt: d.createdAt.toISOString(), data: d.payload });
    const timestamp = Math.floor(now.getTime() / 1000);
    const attempts = d.attempts + 1;
    let error: string | null = null;
    try {
      const res = await post(d.integration.webhookUrl, body, {
        "x-slotback-event": d.event,
        "x-slotback-delivery": d.id,
        "x-slotback-timestamp": String(timestamp),
        "x-slotback-signature": signPayload(signingSecret(d.integrationId, serverSecret), timestamp, body),
      });
      if (res.status < 200 || res.status >= 300) error = `HTTP ${res.status}`;
    } catch (err) {
      error = err instanceof Error ? err.message.slice(0, 200) : "request failed";
    }
    if (!error) {
      await db.webhookDelivery.update({ where: { id }, data: { status: "DELIVERED", attempts, deliveredAt: now, lastError: null } });
      delivered++;
    } else if (attempts >= MAX_WEBHOOK_ATTEMPTS) {
      await db.webhookDelivery.update({ where: { id }, data: { status: "FAILED", attempts, lastError: error } });
      failed++;
    } else {
      const wait = BACKOFF_MINUTES[attempts - 1] * 60_000;
      await db.webhookDelivery.update({ where: { id }, data: { attempts, lastError: error, nextAttemptAt: new Date(now.getTime() + wait) } });
    }
  }
  return { delivered, failed, attempted: leased.length };
}
