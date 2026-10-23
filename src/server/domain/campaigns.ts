import type { Prisma } from "@/generated/prisma/client";
import { addDays, localDateKey, parseHm, zonedToUtc } from "@/lib/time";
import { providerFor } from "../messaging/registry";
import { confirmationMessage, offerMessage } from "../messaging/templates";
import { recordAudit } from "./audit";
import { evaluateCandidates, inQuietHours, loadCandidates, type Evaluated, type Slot } from "./eligibility";
import { DomainError, violatesConstraint } from "./errors";
import { generateClaimToken, hashClaimToken, looksLikeClaimToken } from "./tokens";
import { withTx, type Actor, type Db } from "./types";

export type RulesSnapshot = {
  minLeadMinutes: number;
  offerTtlMinutes: number;
  offerBatchSize: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
};

export type LaunchOptions = { baseUrl: string; now?: Date; messageProvider?: string };

async function loadLocation(db: Db, locationId: string) {
  return db.location.findUniqueOrThrow({
    where: { id: locationId },
    include: { organization: { select: { id: true, name: true, isDemo: true } } },
  });
}

async function loadCampaign(db: Db, actor: Actor, id: string) {
  const campaign = await db.recoveryCampaign.findFirst({
    where: { id, locationId: actor.locationId },
    include: { appointment: { select: { customerId: true } } },
  });
  if (!campaign) throw new DomainError("not_found", "That recovery campaign was not found.");
  return campaign;
}

function slotOf(c: { locationId: string; serviceId: string; resourceId: string; startAt: Date; endAt: Date; appointment: { customerId: string | null } }): Slot {
  return {
    locationId: c.locationId,
    serviceId: c.serviceId,
    resourceId: c.resourceId,
    startAt: c.startAt,
    endAt: c.endAt,
    cancelledCustomerId: c.appointment.customerId,
  };
}

/** When the next message may go out, respecting quiet hours. */
export function nextSendTime(now: Date, rules: RulesSnapshot): Date {
  if (!inQuietHours(now, rules.timezone, rules.quietHoursStart, rules.quietHoursEnd)) return now;
  const today = localDateKey(now, rules.timezone);
  let end = zonedToUtc(today, parseHm(rules.quietHoursEnd), rules.timezone);
  if (end <= now) end = zonedToUtc(addDays(today, 1), parseHm(rules.quietHoursEnd), rules.timezone);
  return end;
}

/**
 * Opens a draft recovery campaign for a cancelled appointment. Idempotent: calling it twice
 * for the same appointment returns the same campaign.
 */
export async function openCampaign(db: Db, actor: Actor, appointmentId: string, now = new Date()) {
  return withTx(db, async (tx) => {
    const appointment = await tx.appointment.findFirst({ where: { id: appointmentId, locationId: actor.locationId } });
    if (!appointment) throw new DomainError("not_found", "That appointment was not found.");
    if (appointment.status !== "CANCELLED") throw new DomainError("invalid", "Only a cancelled appointment can be refilled.");
    if (appointment.startAt <= now) throw new DomainError("invalid", "This opening has already started.");

    const existing = await tx.recoveryCampaign.findUnique({ where: { appointmentId } });
    if (existing) return existing;

    const location = await loadLocation(tx, actor.locationId);
    const rules: RulesSnapshot = {
      minLeadMinutes: location.minLeadMinutes,
      offerTtlMinutes: location.offerTtlMinutes,
      offerBatchSize: location.offerBatchSize,
      quietHoursStart: location.quietHoursStart,
      quietHoursEnd: location.quietHoursEnd,
      timezone: location.timezone,
    };
    const campaign = await tx.recoveryCampaign.create({
      data: {
        locationId: actor.locationId,
        appointmentId,
        serviceId: appointment.serviceId,
        resourceId: appointment.resourceId,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        valuePaise: appointment.valuePaise,
        rulesSnapshot: rules as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(appointment.startAt.getTime() - rules.minLeadMinutes * 60_000),
        createdById: actor.userId,
      },
    });
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "campaign",
      entityId: campaign.id,
      action: "campaign.created",
      metadata: { appointmentId },
    });
    return campaign;
  });
}

/** Everything the campaign screen shows: the slot, ranked audience with reasons, and the exact message. */
export async function previewCampaign(db: Db, actor: Actor, campaignId: string, opts: LaunchOptions) {
  const now = opts.now ?? new Date();
  const campaign = await loadCampaign(db, actor, campaignId);
  const [location, service, resource, candidates] = await Promise.all([
    loadLocation(db, actor.locationId),
    db.service.findUniqueOrThrow({ where: { id: campaign.serviceId } }),
    db.resource.findUniqueOrThrow({ where: { id: campaign.resourceId } }),
    loadCandidates(db, slotOf(campaign), campaign.id, now),
  ]);
  const rules = campaign.rulesSnapshot as unknown as RulesSnapshot;
  const evaluated = evaluateCandidates(slotOf(campaign), rules.timezone, candidates);
  const sendAt = nextSendTime(now, rules);
  const expiresAt = offerExpiry(sendAt, rules, campaign.expiresAt!);
  const sample = evaluated.find((e) => e.eligible);
  const message = offerMessage({
    customerName: sample?.candidate.name ?? "there",
    businessName: location.organization.name,
    serviceName: service.name,
    staffName: resource.name,
    startAt: campaign.startAt,
    expiresAt,
    timezone: rules.timezone,
    link: `${opts.baseUrl}/c/…`,
  });
  return { campaign, service, resource, location, rules, evaluated, message, sendAt, quiet: sendAt > now };
}

function offerExpiry(sendAt: Date, rules: RulesSnapshot, campaignExpiresAt: Date) {
  return new Date(Math.min(sendAt.getTime() + rules.offerTtlMinutes * 60_000, campaignExpiresAt.getTime()));
}

/**
 * Sends the next round of offers: the top-ranked eligible customers who haven't been offered
 * this slot yet. Offers and their outbox messages are written in one transaction, so a saved
 * campaign and its notifications can never diverge.
 */
export async function sendRound(db: Db, actor: Actor, campaignId: string, opts: LaunchOptions) {
  const now = opts.now ?? new Date();
  return withTx(db, async (tx) => {
    const campaign = await loadCampaign(tx, actor, campaignId);
    if (campaign.status !== "DRAFT" && campaign.status !== "ACTIVE") {
      throw new DomainError("invalid_transition", "This campaign is no longer running.");
    }
    const rules = campaign.rulesSnapshot as unknown as RulesSnapshot;
    const sendAt = nextSendTime(now, rules);
    if (!campaign.expiresAt || sendAt >= campaign.expiresAt) {
      throw new DomainError(
        "invalid",
        sendAt > now
          ? "Quiet hours end too close to the appointment to offer it. Handle this slot manually."
          : "It's too close to the appointment to offer it to the waitlist.",
      );
    }

    // Lock the campaign row so two staff pressing "launch" can't send duplicate rounds.
    await tx.$queryRaw`SELECT id FROM recovery_campaigns WHERE id = ${campaign.id} FOR UPDATE`;

    const [location, service, resource, candidates] = await Promise.all([
      loadLocation(tx, actor.locationId),
      tx.service.findUniqueOrThrow({ where: { id: campaign.serviceId } }),
      tx.resource.findUniqueOrThrow({ where: { id: campaign.resourceId } }),
      loadCandidates(tx, slotOf(campaign), campaign.id, now),
    ]);
    const chosen = evaluateCandidates(slotOf(campaign), rules.timezone, candidates)
      .filter((e): e is Extract<Evaluated, { eligible: true }> => e.eligible)
      .slice(0, rules.offerBatchSize);
    if (chosen.length === 0) {
      throw new DomainError("conflict", "No matching customers are available right now. Add to the waitlist or handle this slot manually.");
    }

    const provider = providerFor({ isDemo: location.organization.isDemo, configured: opts.messageProvider });
    const expiresAt = offerExpiry(sendAt, rules, campaign.expiresAt);
    const priorOffers = await tx.offer.count({ where: { campaignId: campaign.id } });

    for (const [i, e] of chosen.entries()) {
      const { token, hash } = generateClaimToken();
      const offer = await tx.offer.create({
        data: {
          campaignId: campaign.id,
          customerId: e.candidate.customerId,
          waitlistEntryId: e.candidate.waitlistEntryId,
          channel: e.channel,
          rank: priorOffers + i + 1,
          tokenHash: hash,
          expiresAt,
        },
      });
      await tx.outboxMessage.create({
        data: {
          locationId: actor.locationId,
          offerId: offer.id,
          channel: e.channel,
          provider: provider.name,
          toAddress: e.address,
          body: offerMessage({
            customerName: e.candidate.name,
            businessName: location.organization.name,
            serviceName: service.name,
            staffName: resource.name,
            startAt: campaign.startAt,
            expiresAt,
            timezone: rules.timezone,
            link: `${opts.baseUrl}/c/${token}`,
          }),
          nextAttemptAt: sendAt,
          idempotencyKey: `offer:${offer.id}`,
        },
      });
    }

    const launching = campaign.status === "DRAFT";
    await tx.recoveryCampaign.update({
      where: { id: campaign.id },
      data: { status: "ACTIVE", launchedAt: launching ? now : undefined },
    });
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "campaign",
      entityId: campaign.id,
      action: launching ? "campaign.launched" : "campaign.round_sent",
      metadata: { offers: chosen.length, delayedForQuietHours: sendAt > now },
    });
    return { offers: chosen.length, sendAt, expiresAt };
  });
}

/** Staff stops offering an opening. Outstanding links stop working immediately. */
export async function stopCampaign(db: Db, actor: Actor, campaignId: string) {
  return withTx(db, async (tx) => {
    const campaign = await loadCampaign(tx, actor, campaignId);
    const { count } = await tx.recoveryCampaign.updateMany({
      where: { id: campaign.id, status: { in: ["DRAFT", "ACTIVE"] } },
      data: { status: "CANCELLED" },
    });
    if (count === 0) throw new DomainError("invalid_transition", "This campaign has already finished.");
    await expireOpenOffers(tx, campaign.id);
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "campaign",
      entityId: campaign.id,
      action: "campaign.stopped",
    });
  });
}

const OPEN_OFFER = ["QUEUED", "SENT", "DELIVERED", "OPENED"] as const;

async function expireOpenOffers(db: Db, campaignId: string, status: "EXPIRED" | "LOST" = "EXPIRED") {
  await db.offer.updateMany({ where: { campaignId, status: { in: [...OPEN_OFFER] } }, data: { status } });
  // Messages not yet sent are pointless now.
  await db.outboxMessage.updateMany({
    where: { offer: { campaignId }, status: "QUEUED" },
    data: { status: "FAILED", errorCode: "campaign_closed" },
  });
}

/**
 * Called when staff book a resource directly: any running campaign for an overlapping time
 * on that resource is closed, so customers can't claim a slot that was filled by hand.
 */
export async function closeCampaignsForBookedTime(db: Db, actor: Actor, resourceId: string, startAt: Date, endAt: Date) {
  const overlapping = await db.recoveryCampaign.findMany({
    where: {
      locationId: actor.locationId,
      resourceId,
      status: { in: ["DRAFT", "ACTIVE"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });
  for (const { id } of overlapping) {
    await db.recoveryCampaign.update({ where: { id }, data: { status: "CANCELLED" } });
    await expireOpenOffers(db, id);
    await recordAudit(db, {
      organizationId: actor.organizationId,
      actorType: "SYSTEM",
      entityType: "campaign",
      entityId: id,
      action: "campaign.closed_slot_booked_manually",
    });
  }
}

// ─── Customer side ───────────────────────────────────────────────────────────

export type OfferView =
  | { state: "invalid" }
  | {
      state: "available" | "claimed_by_you" | "taken" | "expired";
      businessName: string;
      locationName: string;
      address: string | null;
      phone: string | null;
      serviceName: string;
      staffName: string;
      customerFirstName: string;
      startAt: Date;
      endAt: Date;
      expiresAt: Date;
      timezone: string;
    };

async function findOffer(db: Db, token: string) {
  if (!looksLikeClaimToken(token)) return null;
  return db.offer.findUnique({
    where: { tokenHash: hashClaimToken(token) },
    include: {
      customer: { select: { name: true } },
      campaign: {
        include: {
          service: { select: { name: true } },
          resource: { select: { name: true } },
          location: { include: { organization: { select: { name: true, isDemo: true } } } },
        },
      },
    },
  });
}

/** What the claim page shows. Also records that the offer was opened. */
export async function viewOffer(db: Db, token: string, now = new Date()): Promise<OfferView> {
  const offer = await findOffer(db, token);
  if (!offer) return { state: "invalid" };
  const c = offer.campaign;

  let state: Exclude<OfferView["state"], "invalid">;
  if (offer.status === "CLAIMED") state = "claimed_by_you";
  else if (c.status === "CLAIMED" || offer.status === "LOST") state = "taken";
  else if (c.status !== "ACTIVE" || offer.expiresAt <= now || offer.status === "EXPIRED" || offer.status === "FAILED") state = "expired";
  else state = "available";

  if (state === "available" && !offer.openedAt) {
    await db.offer.update({ where: { id: offer.id }, data: { openedAt: now, status: "OPENED" } });
  }

  return {
    state,
    businessName: c.location.organization.name,
    locationName: c.location.name,
    address: c.location.address,
    phone: c.location.phone,
    serviceName: c.service.name,
    staffName: c.resource.name,
    customerFirstName: offer.customer.name.split(" ")[0],
    startAt: c.startAt,
    endAt: c.endAt,
    expiresAt: offer.expiresAt,
    timezone: c.location.timezone,
  };
}

export type ClaimResult = "claimed" | "claimed_by_you" | "taken" | "expired" | "invalid";

/**
 * Atomically claims the slot for the offer holder. Exactly one claim can succeed per campaign:
 * the campaign moves ACTIVE → CLAIMED with a conditional update, the claim row is unique per
 * campaign, and the new appointment is guarded by the no-overlap constraint. Idempotent for
 * the winner (a double tap returns "claimed_by_you").
 */
export async function claimOffer(db: Db, token: string, opts: { now?: Date } = {}): Promise<ClaimResult> {
  const now = opts.now ?? new Date();
  const offer = await findOffer(db, token);
  if (!offer) return "invalid";
  if (offer.status === "CLAIMED") return "claimed_by_you";

  try {
    return await withTx(db, async (tx) => {
      const fresh = await tx.offer.findUniqueOrThrow({ where: { id: offer.id } });
      if (fresh.status === "CLAIMED") return "claimed_by_you";
      if (!OPEN_OFFER.includes(fresh.status as (typeof OPEN_OFFER)[number])) return fresh.status === "LOST" ? "taken" : "expired";
      if (fresh.expiresAt <= now) return "expired";

      const { count } = await tx.recoveryCampaign.updateMany({
        where: { id: offer.campaignId, status: "ACTIVE", expiresAt: { gt: now } },
        data: { status: "CLAIMED", claimedAt: now },
      });
      if (count === 0) {
        const c = await tx.recoveryCampaign.findUniqueOrThrow({ where: { id: offer.campaignId } });
        return c.status === "CLAIMED" ? "taken" : "expired";
      }

      const c = offer.campaign;
      const appointment = await tx.appointment.create({
        data: {
          locationId: c.locationId,
          customerId: offer.customerId,
          serviceId: c.serviceId,
          resourceId: c.resourceId,
          startAt: c.startAt,
          endAt: c.endAt,
          valuePaise: c.valuePaise,
          source: "RECOVERY",
        },
      });
      await tx.claim.create({ data: { campaignId: c.id, offerId: offer.id, appointmentId: appointment.id, claimedAt: now } });
      await tx.offer.update({ where: { id: offer.id }, data: { status: "CLAIMED", respondedAt: now } });
      await expireOpenOffers(tx, c.id, "LOST");
      if (offer.waitlistEntryId) {
        await tx.waitlistEntry.update({ where: { id: offer.waitlistEntryId }, data: { status: "FULFILLED" } });
      }

      // Confirmation goes out right away on the channel the offer used (the customer just acted).
      const provider = providerFor({ isDemo: c.location.organization.isDemo });
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: offer.customerId } });
      const to = offer.channel === "EMAIL" ? customer.email : customer.phone;
      if (to) {
        await tx.outboxMessage.create({
          data: {
            locationId: c.locationId,
            offerId: null,
            channel: offer.channel,
            provider: provider.name,
            toAddress: to,
            body: confirmationMessage({
              customerName: customer.name,
              businessName: c.location.organization.name,
              serviceName: c.service.name,
              staffName: c.resource.name,
              startAt: c.startAt,
              timezone: c.location.timezone,
              address: c.location.address,
            }),
            idempotencyKey: `claim-confirmation:${offer.id}`,
          },
        });
      }

      await recordAudit(tx, {
        organizationId: c.location.organizationId,
        actorType: "CUSTOMER",
        actorId: offer.customerId,
        entityType: "campaign",
        entityId: c.id,
        action: "campaign.claimed",
        metadata: { offerId: offer.id, appointmentId: appointment.id, channel: offer.channel },
      });
      await recordAudit(tx, {
        organizationId: c.location.organizationId,
        actorType: "CUSTOMER",
        actorId: offer.customerId,
        entityType: "appointment",
        entityId: appointment.id,
        action: "appointment.created",
        metadata: { source: "RECOVERY", campaignId: c.id },
      });
      return "claimed";
    });
  } catch (err) {
    // Lost a race at the database level: another claim committed first, or staff booked the time by hand.
    if (violatesConstraint(err, "claims_campaign_id_key") || violatesConstraint(err, "appointments_no_resource_overlap")) {
      return "taken";
    }
    if (err && typeof err === "object" && (err as { code?: string }).code === "P2002") return "taken";
    throw err;
  }
}

// ─── Housekeeping ────────────────────────────────────────────────────────────

/** Expires offers and campaigns whose time has passed. Run on a schedule. */
export async function expireDue(db: Db, now = new Date()) {
  const offers = await db.offer.updateMany({
    where: { status: { in: [...OPEN_OFFER] }, expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  const due = await db.recoveryCampaign.findMany({
    where: { status: { in: ["DRAFT", "ACTIVE"] }, expiresAt: { lte: now } },
    select: { id: true, location: { select: { organizationId: true } } },
  });
  for (const c of due) {
    const { count } = await db.recoveryCampaign.updateMany({
      where: { id: c.id, status: { in: ["DRAFT", "ACTIVE"] } },
      data: { status: "EXPIRED" },
    });
    if (count === 0) continue;
    await expireOpenOffers(db, c.id);
    await recordAudit(db, {
      organizationId: c.location.organizationId,
      actorType: "SYSTEM",
      entityType: "campaign",
      entityId: c.id,
      action: "campaign.expired",
    });
  }
  return { offersExpired: offers.count, campaignsExpired: due.length };
}
