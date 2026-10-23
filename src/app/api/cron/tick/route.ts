import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { advanceRounds, expireDue } from "@/server/domain/campaigns";
import { env } from "@/server/env";
import { processOutbox } from "@/server/messaging/outbox";

function authorised(request: Request) {
  const secret = env().CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/** Scheduled housekeeping: expire offers and campaigns, send automatic rounds, then deliver due messages. */
export async function POST(request: Request) {
  if (!authorised(request)) return Response.json({ error: "unauthorised" }, { status: 401 });
  const expired = await expireDue(db);
  const rounds = await advanceRounds(db, { baseUrl: env().NEXT_PUBLIC_APP_URL, messageProvider: env().MESSAGE_PROVIDER });
  const outbox = await processOutbox(db, new Date(), 100);
  return Response.json({ expired, rounds, outbox });
}
