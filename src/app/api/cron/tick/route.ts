import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { advanceRounds, expireDue } from "@/server/domain/campaigns";
import { env } from "@/server/env";
import { processWebhooks } from "@/server/integrations/webhooks";
import { processOutbox } from "@/server/messaging/outbox";
import { pruneRateLimits } from "@/server/security/rate-limit";

function authorised(request: Request) {
  const secret = env().CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/** Scheduled housekeeping: expire offers and campaigns, send automatic rounds, deliver due messages and webhooks. */
export async function POST(request: Request) {
  if (!authorised(request)) return Response.json({ error: "unauthorised" }, { status: 401 });
  const expired = await expireDue(db);
  const rounds = await advanceRounds(db, { baseUrl: env().NEXT_PUBLIC_APP_URL, messageProvider: env().MESSAGE_PROVIDER });
  const outbox = await processOutbox(db, new Date(), 100);
  const webhooks = await processWebhooks(db, env().SESSION_SECRET);
  const prunedRateLimits = await pruneRateLimits(db);
  return Response.json({ expired, rounds, outbox, webhooks, prunedRateLimits });
}
