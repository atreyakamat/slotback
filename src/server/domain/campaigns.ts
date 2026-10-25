import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { addDays, localDateKey, parseHm, zonedToUtc } from "@/lib/time";
import { enqueueWebhooks } from "../integrations/webhooks";
import { providerFor } from "../messaging/registry";
import { confirmationMessage, confirmationTemplate, offerMessage, offerTemplate } from "../messaging/templates";
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

const OPEN_OFFER = ["QUEUED", "SENT", "DELIVERED", "OPENED"] as const;

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
    return createCampaign(tx, { organizationId: actor.organizationId, locationId: actor.locationId, userId: actor.userId }, appointment, now);
  });
}

async function createCampaign(
  tx: Prisma.TransactionClient,
  by: RoundBy,
  appointment: Awaited<ReturnType<Prisma.TransactionClient["appointment"]["findFirstOrThrow"]>>,
  now: Date,
) {
  if (appointment.status !== "CANCELLED") throw new DomainError("invalid", "Only a cancelled appointment can be refilled.");
  if (appointment.startAt <= now) throw new DomainError("invalid", "This opening has already started.");

  const existing = await tx.recoveryCampaign.findUnique({ where: { appointmentId: appointment.id } });
  if (existing) return existing;

  const location = await loadLocation(tx, by.locationId);
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
      locationId: by.locationId,
      appointmentId: appointment.id,
      serviceId: appointment.serviceId,
      resourceId: appointment.resourceId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      valuePaise: appointment.valuePaise,
      rulesSnapshot: rules as unknown as Prisma.InputJsonValue,
      expiresAt: new Date(appointment.startAt.getTime() - rules.minLeadMinutes * 60_000),
      createdById: by.userId,
    },
  });
  await recordAudit(tx, {
    organizationId: by.organizationId,
    actorType: by.userId ? "USER" : "SYSTEM",
    actorId: by.userId ?? undefined,
    entityType: "campaign",
    entityId: campaign.id,
    action: "campaign.created",
    metadata: { appointmentId: appointment.id },
  });
  return campaign;
}

/**
 * Opens a campaign for a cancellation reported by another booking tool and sends the first
 * round straight away. Returns null when the slot can't be offered (too close to start, quiet
 * hours, or nobody fits); the campaign then waits for staff.
 */
export async function startRecoveryForSystem(db: PrismaClient, by: Omit<RoundBy, "userId">, appointmentId: string, opts: LaunchOptions) {
  const now = opts.now ?? new Date();
  const campaign = await db.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirstOrThrow({ where: { id: appointmentId, locationId: by.locationId } });
    return createCampaign(tx, { ...by, userId: null }, appointment, now);
  });
  try {
    await db.$transaction(async (tx) => {
      const fresh = await tx.recoveryCampaign.findUniqueOrThrow({ where: { id: campaign.id }, include: { appointment: { select: { customerId: true } } } });
      if (fresh.status !== "DRAFT") return;
      await writeRound(tx, { ...by, userId: null }, fresh, opts);
    });
  } catch (err) {
    if (!(err instanceof DomainError)) throw err;
  }
  return campaign;
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
  const provider = providerFor({ isDemo: location.organization.isDemo, configured: opts.messageProvider });
  const evaluated = evaluateCandidates(slotOf(campaign), rules.timezone, candidates, provider.channels);
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

/** Who a round is sent on behalf of: a staff member, or SlotBack itself for automatic rounds. */
type RoundBy = { organizationId: string; locationId: string; userId: string | null };

type CampaignRow = Awaited<ReturnType<typeof loadCampaign>>;

/**
 * Sends the next round of offers: the top-ranked eligible customers who haven't been offered
 * this slot yet. Offers and their outbox messages are written in one transaction, so a saved
 * campaign and its notifications can never diverge.
 */
export async function sendRound(db: Db, actor: Actor, campaignId: string, opts: LaunchOptions) {
  return withTx(db, async (tx) => {
    const campaign = await loadCampaign(tx, actor, campaignId);
    return writeRound(tx, { organizationId: actor.organizationId, locationId: actor.locationId, userId: actor.userId }, campaign, opts);
  });
}

async function writeRound(tx: Prisma.TransactionClient, by: RoundBy, campaign: CampaignRow, opts: LaunchOptions) {
  const now = opts.now ?? new Date();
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
    loadLocation(tx, by.locationId),
    tx.service.findUniqueOrThrow({ where: { id: campaign.serviceId } }),
    tx.resource.findUniqueOrThrow({ where: { id: campaign.resourceId } }),
    loadCandidates(tx, slotOf(campaign), campaign.id, now),
  ]);
  const provider = providerFor({ isDemo: location.organization.isDemo, configured: opts.messageProvider });
  const chosen = evaluateCandidates(slotOf(campaign), rules.timezone, candidates, provider.channels)
    .filter((e): e is Extract<Evaluated, { eligible: true }> => e.eligible)
    .slice(0, rules.offerBatchSize);
  if (chosen.length === 0) {
    throw new DomainError("conflict", "No matching customers are available right now. Add to the waitlist or handle this slot manually.");
  }

  const expiresAt = offerExpiry(sendAt, rules, campaign.expiresAt);
  const priorOffers = await tx.offer.count({ where: { campaignId: campaign.id } });

  const offerVars = {
    businessName: location.organization.name,
    serviceName: service.name,
    staffName: resource.name,
    startAt: campaign.startAt,
    expiresAt,
    timezone: rules.timezone,
  };
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
        locationId: by.locationId,
        offerId: offer.id,
        channel: e.channel,
        provider: provider.name,
        toAddress: e.address,
        body: offerMessage({ ...offerVars, customerName: e.candidate.name, link: `${opts.baseUrl}/c/${token}` }),
        template: e.channel === "WHATSAPP" ? offerTemplate({ ...offerVars, customerName: e.candidate.name, token }) : undefined,
        nextAttemptAt: sendAt,
        idempotencyKey: `offer:${offer.id}`,
      },
    });
  }

  const launching = campaign.status === "DRAFT";
  await tx.recoveryCampaign.update({
    where: { id: campaign.id },
    data: { status: "ACTIVE", launchedAt: launching ? now : undefined, roundsSent: { increment: 1 } },
  });
  await recordAudit(tx, {
    organizationId: by.organizationId,
    actorType: by.userId ? "USER" : "SYSTEM",
    actorId: by.userId ?? undefined,
    entityType: "campaign",
    entityId: campaign.id,
    action: launching ? "campaign.launched" : by.userId ? "campaign.round_sent" : "campaign.auto_round_sent",
    metadata: { offers: chosen.length, round: campaign.roundsSent + 1, delayedForQuietHours: sendAt > now },
  });
  return { offers: chosen.length, sendAt, expiresAt };
}

/**
 * Sends the next round for running campaigns whose last round closed unclaimed, where the
 * business has automatic rounds on and the round cap isn't reached. Run on a schedule.
 * A campaign that can't send (nobody left who fits, or too close to the slot) is skipped
 * and waits for staff or expiry.
 */
export async function advanceRounds(db: PrismaClient, opts: LaunchOptions & { locationId?: string }) {
  const now = opts.now ?? new Date();
  const due = await db.recoveryCampaign.findMany({
    where: {
      locationId: opts.locationId,
      status: "ACTIVE",
      expiresAt: { gt: now },
      location: { autoNextRound: true },
      offers: { none: { status: { in: [...OPEN_OFFER] } } },
    },
    include: { appointment: { select: { customerId: true } }, location: { select: { organizationId: true, maxRounds: true } } },
    take: 50,
  });
  let sent = 0;
  let skipped = 0;
  for (const c of due) {
    if (c.roundsSent >= c.location.maxRounds) continue;
    try {
      const result = await db.$transaction(async (tx) => {
        // Re-check under the row lock: staff may have sent a round or stopped it since the scan.
        await tx.$queryRaw`SELECT id FROM recovery_campaigns WHERE id = ${c.id} FOR UPDATE`;
        const fresh = await tx.recoveryCampaign.findUniqueOrThrow({
          where: { id: c.id },
          include: { appointment: { select: { customerId: true } } },
        });
        const open = await tx.offer.count({ where: { campaignId: c.id, status: { in: [...OPEN_OFFER] } } });
        if (fresh.status !== "ACTIVE" || open > 0 || fresh.roundsSent >= c.location.maxRounds) return null;
        return writeRound(tx, { organizationId: c.location.organizationId, locationId: c.locationId, userId: null }, fresh, opts);
      });
      if (result) sent++;
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
      skipped++;
    }
  }
  return { roundsSent: sent, skipped };
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
export async function closeCampaignsForBookedTime(
  db: Db,
  actor: Pick<Actor, "organizationId" | "locationId">,
  resourceId: string,
  startAt: Date,
  endAt: Date,
) {
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

      // Confirmation goes out right away, on the channel and provider that delivered the offer.
      const sentWith = await tx.outboxMessage.findFirst({ where: { offerId: offer.id }, select: { provider: true } });
      const provider = providerFor({ isDemo: c.location.organization.isDemo, configured: sentWith?.provider });
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: offer.customerId } });
      const to = offer.channel === "EMAIL" ? customer.email : customer.phone;
      if (to) {
        const confirmVars = {
          customerName: customer.name,
          businessName: c.location.organization.name,
          serviceName: c.service.name,
          staffName: c.resource.name,
          startAt: c.startAt,
          timezone: c.location.timezone,
          address: c.location.address,
        };
        await tx.outboxMessage.create({
          data: {
            locationId: c.locationId,
            offerId: null,
            channel: offer.channel,
            provider: provider.name,
            toAddress: to,
            body: confirmationMessage(confirmVars),
            template: offer.channel === "WHATSAPP" ? confirmationTemplate(confirmVars) : undefined,
            idempotencyKey: `claim-confirmation:${offer.id}`,
          },
        });
      }

      // Tell connected booking tools, so the refilled slot shows up in their calendar too.
      const origin = await tx.appointment.findUniqueOrThrow({ where: { id: c.appointmentId }, select: { integrationId: true, externalId: true } });
      await enqueueWebhooks(tx, c.locationId, "slot.claimed", {
        appointment: {
          id: appointment.id,
          startAt: c.startAt.toISOString(),
          endAt: c.endAt.toISOString(),
          service: c.service.name,
          staff: c.resource.name,
          valuePaise: c.valuePaise,
          customer: { name: customer.name, phone: customer.phone, email: customer.email },
        },
        replaces: { appointmentId: c.appointmentId, integrationId: origin.integrationId, externalId: origin.externalId },
      });

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
