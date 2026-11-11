import { after } from "next/server";
import { toActor } from "@/server/auth/dal";
import { db } from "@/server/db";
import { sendRound } from "@/server/domain/campaigns";
import { env } from "@/server/env";
import { processOutbox } from "@/server/messaging/outbox";
import { mobileRoute } from "@/server/mobile/route";

/** Sends the next round of offers, and delivers them right after responding. */
export const POST = mobileRoute<{ id: string }>(async ({ member, params }) => {
  const result = await sendRound(db, toActor(member), params.id, { baseUrl: env().NEXT_PUBLIC_APP_URL, messageProvider: env().MESSAGE_PROVIDER });
  after(async () => {
    await processOutbox(db);
  });
  return { offers: result.offers, sendAt: result.sendAt };
});
