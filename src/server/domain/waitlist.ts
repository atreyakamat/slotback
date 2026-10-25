import type { Channel } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import { createCustomer, type CustomerInput } from "./customers";
import { DomainError } from "./errors";
import { withTx, type Actor, type Db } from "./types";

export type WaitlistInput = {
  customerId?: string;
  newCustomer?: CustomerInput;
  serviceId: string | null;
  preferredDays: number[];
  earliestMinute: number;
  latestMinute: number;
  notes: string | null;
  expiresAt: Date | null;
};

export async function addToWaitlist(db: Db, actor: Actor, input: WaitlistInput) {
  if (input.earliestMinute >= input.latestMinute) throw new DomainError("invalid", "The earliest time must be before the latest time.");
  if (input.preferredDays.some((d) => d < 0 || d > 6)) throw new DomainError("invalid", "Invalid day selected.");

  return withTx(db, async (tx) => {
    let customerId = input.customerId;
    if (!customerId) {
      if (!input.newCustomer) throw new DomainError("invalid", "Choose a customer or add a new one.");
      customerId = (await createCustomer(tx, actor, input.newCustomer)).id;
    } else {
      const customer = await tx.customer.findFirst({ where: { id: customerId, locationId: actor.locationId, deletedAt: null } });
      if (!customer) throw new DomainError("not_found", "That customer was not found.");
    }
    if (input.serviceId) {
      const service = await tx.service.findFirst({ where: { id: input.serviceId, locationId: actor.locationId } });
      if (!service) throw new DomainError("not_found", "That service was not found.");
    }
    const existing = await tx.waitlistEntry.findFirst({
      where: { locationId: actor.locationId, customerId, status: "ACTIVE", serviceId: input.serviceId },
    });
    if (existing) throw new DomainError("conflict", "This customer is already waiting for that service.");

    const entry = await tx.waitlistEntry.create({
      data: {
        locationId: actor.locationId,
        customerId,
        serviceId: input.serviceId,
        preferredDays: [...new Set(input.preferredDays)].sort(),
        earliestMinute: input.earliestMinute,
        latestMinute: input.latestMinute,
        notes: input.notes,
        expiresAt: input.expiresAt,
      },
    });
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "waitlist_entry",
      entityId: entry.id,
      action: "waitlist.added",
    });
    return entry;
  });
}

export async function removeFromWaitlist(db: Db, actor: Actor, entryId: string) {
  const { count } = await db.waitlistEntry.updateMany({
    where: { id: entryId, locationId: actor.locationId, status: "ACTIVE" },
    data: { status: "REMOVED" },
  });
  if (count === 0) throw new DomainError("not_found", "That waitlist entry was not found.");
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "waitlist_entry",
    entityId: entryId,
    action: "waitlist.removed",
  });
}

/**
 * Grants or revokes consent for one channel. A revocation takes effect immediately:
 * queued messages on that channel are dropped and open offers sent on it are suppressed.
 */
export async function setConsent(
  db: Db,
  actor: Pick<Actor, "organizationId" | "locationId"> & { userId: string | null },
  input: { customerId: string; channel: Channel; granted: boolean; source: string },
) {
  return withTx(db, async (tx) => {
    const customer = await tx.customer.findFirst({ where: { id: input.customerId, locationId: actor.locationId } });
    if (!customer) throw new DomainError("not_found", "That customer was not found.");
    const status = input.granted ? "GRANTED" : "REVOKED";
    await tx.channelConsent.upsert({
      where: { customerId_channel: { customerId: customer.id, channel: input.channel } },
      update: { status, source: input.source },
      create: { customerId: customer.id, channel: input.channel, status, source: input.source },
    });
    if (!input.granted) {
      await tx.outboxMessage.updateMany({
        where: { status: "QUEUED", channel: input.channel, offer: { customerId: customer.id } },
        data: { status: "FAILED", errorCode: "opted_out" },
      });
      await tx.offer.updateMany({
        where: { customerId: customer.id, channel: input.channel, status: { in: ["QUEUED", "SENT", "DELIVERED", "OPENED"] } },
        data: { status: "SUPPRESSED" },
      });
    }
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: actor.userId ? "USER" : "CUSTOMER",
      actorId: actor.userId ?? customer.id,
      entityType: "customer",
      entityId: customer.id,
      action: input.granted ? "consent.granted" : "consent.revoked",
      metadata: { channel: input.channel, source: input.source },
    });
  });
}
