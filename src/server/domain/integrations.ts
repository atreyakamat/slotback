import type { PrismaClient } from "@/generated/prisma/client";
import { webhookUrlProblem } from "../integrations/safe-fetch";
import { recordAudit } from "./audit";
import { closeCampaignsForBookedTime, startRecoveryForSystem, type LaunchOptions } from "./campaigns";
import { normalizeIndianPhone } from "./customers";
import { DomainError, isUniqueViolation, violatesConstraint } from "./errors";
import { generateClaimToken, hashClaimToken } from "./tokens";
import { type Actor, type Db, withTx } from "./types";

const KEY_PREFIX = "sbk_";

// ─── Managing connections ────────────────────────────────────────────────────

export type IntegrationInput = { name: string; webhookUrl: string | null; autoRefill: boolean };

function checkInput(input: IntegrationInput) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) throw new DomainError("invalid", "Name the connection, like the booking tool it's for.");
  const webhookUrl = input.webhookUrl?.trim() || null;
  if (webhookUrl) {
    const problem = webhookUrlProblem(webhookUrl);
    if (problem) throw new DomainError("invalid", problem);
  }
  return { name, webhookUrl, autoRefill: input.autoRefill };
}

/** Creates a connection and returns its secret key. The key is shown once; only its hash is kept. */
export async function createIntegration(db: Db, actor: Actor, input: IntegrationInput) {
  const data = checkInput(input);
  const active = await db.integration.count({ where: { locationId: actor.locationId, revokedAt: null } });
  if (active >= 10) throw new DomainError("conflict", "A business can have up to 10 connections. Remove one you no longer use.");
  const { token } = generateClaimToken();
  const key = `${KEY_PREFIX}${token}`;
  const integration = await db.integration.create({
    data: { ...data, locationId: actor.locationId, keyHash: hashClaimToken(key), keyPrefix: key.slice(0, 12), createdById: actor.userId },
  });
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "integration",
    entityId: integration.id,
    action: "integration.created",
    metadata: { name: data.name },
  });
  return { integration, key };
}

export async function updateIntegration(db: Db, actor: Actor, id: string, input: IntegrationInput) {
  const data = checkInput(input);
  const { count } = await db.integration.updateMany({ where: { id, locationId: actor.locationId, revokedAt: null }, data });
  if (count === 0) throw new DomainError("not_found", "That connection was not found.");
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "integration",
    entityId: id,
    action: "integration.updated",
  });
}

/** Turns a key off for good. Calls with it fail at once and queued webhooks are dropped. */
export async function revokeIntegration(db: Db, actor: Actor, id: string, now = new Date()) {
  const { count } = await db.integration.updateMany({ where: { id, locationId: actor.locationId, revokedAt: null }, data: { revokedAt: now } });
  if (count === 0) throw new DomainError("not_found", "That connection was not found.");
  await db.webhookDelivery.updateMany({ where: { integrationId: id, status: "QUEUED" }, data: { status: "FAILED", lastError: "integration removed" } });
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "integration",
    entityId: id,
    action: "integration.revoked",
  });
}

export async function listIntegrations(db: Db, actor: Actor) {
  return db.integration.findMany({
    where: { locationId: actor.locationId, revokedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { appointments: true } },
      deliveries: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, lastError: true, createdAt: true } },
    },
  });
}

/** Finds the live connection for an API key, or null. Keys are compared by hash only. */
export async function resolveIntegrationKey(db: Db, key: string, now = new Date()) {
  if (!key.startsWith(KEY_PREFIX) || key.length !== KEY_PREFIX.length + 43 || !/^[A-Za-z0-9_-]+$/.test(key.slice(KEY_PREFIX.length))) return null;
  const integration = await db.integration.findUnique({
    where: { keyHash: hashClaimToken(key) },
    include: { location: { select: { id: true, organizationId: true, name: true, timezone: true, organization: { select: { name: true } } } } },
  });
  if (!integration || integration.revokedAt) return null;
  if (!integration.lastUsedAt || now.getTime() - integration.lastUsedAt.getTime() > 60_000) {
    await db.integration.update({ where: { id: integration.id }, data: { lastUsedAt: now } });
  }
  return integration;
}

export type ResolvedIntegration = NonNullable<Awaited<ReturnType<typeof resolveIntegrationKey>>>;

// ─── Syncing bookings in ─────────────────────────────────────────────────────

export type BookingSync = {
  externalId: string;
  status: "booked" | "cancelled" | "completed" | "no_show";
  startAt: Date;
  service: string;
  staff?: string | null;
  customer?: { name: string; phone?: string | null; email?: string | null } | null;
  cancelReason?: string | null;
};

export type SyncResult = { appointmentId: string; status: string; created: boolean; campaignId?: string };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Applies one booking from another scheduler. Bookings are matched by the tool's own id, so
 * sending the same event twice is harmless. A cancellation of a future booking starts recovery
 * straight away when the connection has auto-refill on.
 */
export async function syncBooking(db: PrismaClient, integration: ResolvedIntegration, input: BookingSync, opts: LaunchOptions): Promise<SyncResult> {
  const now = opts.now ?? new Date();
  const scope = { organizationId: integration.location.organizationId, locationId: integration.locationId };
  const existing = await db.appointment.findUnique({
    where: { integrationId_externalId: { integrationId: integration.id, externalId: input.externalId } },
  });

  if (input.status !== "booked") {
    if (!existing) throw new DomainError("not_found", `No booking with id "${input.externalId}" has been sent yet.`);
    const to = input.status === "cancelled" ? "CANCELLED" : input.status === "completed" ? "COMPLETED" : "NO_SHOW";
    if (existing.status === to) return { appointmentId: existing.id, status: to, created: false };
    if (existing.status !== "BOOKED") throw new DomainError("invalid_transition", `That booking is already ${existing.status.toLowerCase()}.`);
    await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: existing.id },
        data: {
          status: to,
          cancelledAt: to === "CANCELLED" ? now : undefined,
          cancelReason: to === "CANCELLED" ? input.cancelReason?.trim().slice(0, 200) || null : undefined,
          completedAt: to === "COMPLETED" ? now : undefined,
        },
      });
      await recordAudit(tx, {
        ...scope,
        actorType: "SYSTEM",
        entityType: "appointment",
        entityId: existing.id,
        action: `appointment.${to.toLowerCase()}`,
        metadata: { via: "integration", integrationId: integration.id },
      });
    });
    if (to === "CANCELLED" && integration.autoRefill && existing.startAt > now) {
      const campaign = await startRecoveryForSystem(db, scope, existing.id, opts).catch((err) => {
        if (err instanceof DomainError) return null;
        throw err;
      });
      return { appointmentId: existing.id, status: to, created: false, campaignId: campaign?.id };
    }
    return { appointmentId: existing.id, status: to, created: false };
  }

  // Booked (new, or moved in the other tool).
  const services = await db.service.findMany({
    where: { locationId: integration.locationId, active: true },
    include: { resources: { where: { active: true }, select: { id: true, name: true } } },
  });
  const service = services.find((s) => same(s.name, input.service));
  if (!service) {
    const names = services.map((s) => s.name).join(", ");
    throw new DomainError("invalid", `Unknown service "${input.service}". Use one of: ${names || "(add services in SlotBack first)"}.`);
  }
  const endAt = new Date(input.startAt.getTime() + service.durationMinutes * 60_000);
  let candidates = service.resources;
  if (input.staff) {
    candidates = candidates.filter((r) => same(r.name, input.staff!));
    if (candidates.length === 0) throw new DomainError("invalid", `"${input.staff}" doesn't offer ${service.name} in SlotBack.`);
  }

  try {
    return await withTx(db, async (tx) => {
      // The first listed staff member who is free at that time.
      let resourceId: string | null = null;
      for (const r of candidates) {
        const clash = await tx.appointment.findFirst({
          where: { resourceId: r.id, status: { not: "CANCELLED" }, startAt: { lt: endAt }, endAt: { gt: input.startAt }, ...(existing ? { id: { not: existing.id } } : {}) },
          select: { id: true },
        });
        if (!clash) {
          resourceId = r.id;
          break;
        }
      }
      if (!resourceId) throw new DomainError("conflict", "Nobody who offers that service is free at that time in SlotBack.");

      if (existing) {
        if (existing.status !== "BOOKED") throw new DomainError("invalid_transition", `That booking is already ${existing.status.toLowerCase()}.`);
        const moved = existing.startAt.getTime() !== input.startAt.getTime() || existing.resourceId !== resourceId || existing.serviceId !== service.id;
        if (moved) {
          await tx.appointment.update({
            where: { id: existing.id },
            data: { startAt: input.startAt, endAt, resourceId, serviceId: service.id, valuePaise: service.pricePaise },
          });
          await closeCampaignsForBookedTime(tx, scope, resourceId, input.startAt, endAt);
          await recordAudit(tx, { ...scope, actorType: "SYSTEM", entityType: "appointment", entityId: existing.id, action: "appointment.rescheduled", metadata: { via: "integration" } });
        }
        return { appointmentId: existing.id, status: "BOOKED", created: false };
      }

      const customerId = input.customer ? await upsertCustomer(tx, integration.locationId, input.customer) : null;
      const appointment = await tx.appointment.create({
        data: {
          locationId: integration.locationId,
          customerId,
          serviceId: service.id,
          resourceId,
          startAt: input.startAt,
          endAt,
          valuePaise: service.pricePaise,
          integrationId: integration.id,
          externalId: input.externalId,
        },
      });
      await closeCampaignsForBookedTime(tx, scope, resourceId, input.startAt, endAt);
      await recordAudit(tx, { ...scope, actorType: "SYSTEM", entityType: "appointment", entityId: appointment.id, action: "appointment.created", metadata: { via: "integration", integrationId: integration.id } });
      return { appointmentId: appointment.id, status: "BOOKED", created: true };
    });
  } catch (err) {
    if (violatesConstraint(err, "appointments_no_resource_overlap")) {
      throw new DomainError("conflict", "That time overlaps another booking for this staff member in SlotBack.");
    }
    // Two deliveries of the same new booking raced; the other one created it.
    if (isUniqueViolation(err) || violatesConstraint(err, "appointments_integration_id_external_id_key")) {
      const winner = await db.appointment.findUniqueOrThrow({
        where: { integrationId_externalId: { integrationId: integration.id, externalId: input.externalId } },
      });
      return { appointmentId: winner.id, status: winner.status, created: false };
    }
    throw err;
  }
}

/**
 * Matches the client by phone number, or creates them. No messaging consent is recorded:
 * having a booking elsewhere isn't consent to be offered other slots.
 */
async function upsertCustomer(db: Db, locationId: string, c: NonNullable<BookingSync["customer"]>) {
  const phone = c.phone ? normalizeIndianPhone(c.phone) : null;
  const email = c.email?.trim().toLowerCase().slice(0, 160) || null;
  if (phone) {
    const found = await db.customer.findFirst({ where: { locationId, phone, deletedAt: null }, select: { id: true } });
    if (found) return found.id;
  }
  const created = await db.customer.create({
    data: { locationId, name: c.name.trim().slice(0, 80) || "Client", phone, email },
  });
  return created.id;
}
