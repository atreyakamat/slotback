"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { changeAppointmentStatus } from "../domain/appointments";
import { claimOffer, openCampaign, sendRound, stopCampaign } from "../domain/campaigns";
import { LIMITS } from "../security/rate-limit";
import { limitByIp } from "../security/request";
import { DomainError } from "../domain/errors";
import { env } from "../env";
import { processOutbox, retryMessage } from "../messaging/outbox";
import { fromError, fromZod, type ActionState } from "./result";

/** Delivers queued messages right after the response is sent, without making the user wait. */
function deliverSoon() {
  after(async () => {
    await processOutbox(db);
  });
}

const cancelSchema = z.object({ appointmentId: z.string().min(1), reason: z.string().trim().max(200).optional() });

/** Cancel + open a recovery campaign in one step, then show the campaign to launch. */
export async function cancelAndRefillAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const parsed = cancelSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  const actor = toActor(member);
  let campaignId: string;
  try {
    const campaign = await db.$transaction(async (tx) => {
      await changeAppointmentStatus(tx, actor, { appointmentId: parsed.data.appointmentId, to: "CANCELLED", reason: parsed.data.reason });
      return openCampaign(tx, actor, parsed.data.appointmentId);
    });
    campaignId = campaign.id;
  } catch (err) {
    return fromError(err);
  }
  redirect(`/app/campaigns/${campaignId}`);
}

/** Opens a campaign for an appointment that was already cancelled. */
export async function refillAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  let campaignId: string;
  try {
    campaignId = (await openCampaign(db, toActor(member), String(form.get("appointmentId")))).id;
  } catch (err) {
    return fromError(err);
  }
  redirect(`/app/campaigns/${campaignId}`);
}

export async function sendRoundAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  try {
    const result = await sendRound(db, toActor(member), String(form.get("campaignId")), {
      baseUrl: env().NEXT_PUBLIC_APP_URL,
      messageProvider: env().MESSAGE_PROVIDER,
    });
    deliverSoon();
    refresh();
    return {
      ok: true,
      message:
        result.sendAt > new Date()
          ? `Offer queued for ${result.offers} customer${result.offers === 1 ? "" : "s"}. It goes out when quiet hours end.`
          : "The opening is being offered to eligible customers. We'll show you when someone claims it.",
    };
  } catch (err) {
    return fromError(err);
  }
}

export async function stopCampaignAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  try {
    await stopCampaign(db, toActor(member), String(form.get("campaignId")));
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Stopped. Links already sent no longer work." };
}

export async function retryMessageAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const ok = await retryMessage(db, member.location.id, String(form.get("messageId")));
  if (!ok) return { ok: false, message: "That message can't be retried." };
  deliverSoon();
  refresh();
  return { ok: true, message: "Retrying." };
}

/** Public: a customer confirms an offer from the claim link. Authorised by the token alone. */
export async function claimAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const token = String(form.get("token") ?? "");
  let result;
  try {
    await limitByIp("claim", LIMITS.claimPerIp, "Too many attempts. Please wait a few minutes, or call the business.");
    result = await claimOffer(db, token);
  } catch (err) {
    if (err instanceof DomainError) return { ok: false, message: err.message };
    console.error(JSON.stringify({ level: "error", event: "claim_failed", message: err instanceof Error ? err.message : String(err) }));
    return { ok: false, message: "Something went wrong. Please try again, or call the business." };
  }
  if (result === "claimed") deliverSoon();
  // The page re-reads the offer and shows the outcome (booked, taken or expired).
  refresh();
  return { ok: result === "claimed" || result === "claimed_by_you" };
}
