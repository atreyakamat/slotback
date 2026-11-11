import { toActor } from "@/server/auth/dal";
import { db } from "@/server/db";
import { stopCampaign } from "@/server/domain/campaigns";
import { mobileRoute } from "@/server/mobile/route";

export const POST = mobileRoute<{ id: string }>(async ({ member, params }) => {
  await stopCampaign(db, toActor(member), params.id);
});
