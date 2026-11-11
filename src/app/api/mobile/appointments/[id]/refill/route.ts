import { db } from "@/server/db";
import { changeAppointmentStatus } from "@/server/domain/appointments";
import { openCampaign } from "@/server/domain/campaigns";
import { toActor } from "@/server/auth/dal";
import { mobileRoute, readJson } from "@/server/mobile/route";

/** Cancel and refill: cancels a booked appointment (or takes an already-cancelled one) and opens a campaign for the slot. */
export const POST = mobileRoute<{ id: string }>(async ({ member, request, params }) => {
  const body = await readJson(request);
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) || undefined : undefined;
  const actor = toActor(member);
  const campaign = await db.$transaction(async (tx) => {
    const appt = await tx.appointment.findFirst({ where: { id: params.id, locationId: actor.locationId }, select: { status: true } });
    if (appt?.status === "BOOKED") await changeAppointmentStatus(tx, actor, { appointmentId: params.id, to: "CANCELLED", reason });
    return openCampaign(tx, actor, params.id);
  });
  return { campaignId: campaign.id };
});
