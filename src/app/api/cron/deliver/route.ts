import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { deliverDueMessages } from "@/server/messaging/deliver";
import { senderFor } from "@/server/messaging/sender";

function authorized(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Delivers due outbox messages (booking confirmations, reminders). Called every few minutes
 * by the Netlify scheduled function in netlify/functions/deliver-outbox.mts.
 */
export async function POST(request: Request) {
  const secret = env().CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (!authorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await deliverDueMessages(db, senderFor(env().WHATSAPP_PROVIDER));
  return Response.json(report);
}
