import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import { type BusinessHours, saveResource, saveService } from "./catalogue";
import { DomainError } from "./errors";
import { type Actor, type Db, withTx } from "./types";

export type StarterService = { name: string; durationMinutes: number; pricePaise: number };
export type OfferRules = { offerBatchSize: number; offerTtlMinutes: number; minLeadMinutes: number; quietHoursStart: string; quietHoursEnd: string };

export async function setBusinessHours(db: Db, actor: Actor, hours: BusinessHours) {
  const openDays = Object.values(hours).filter((r) => r.length > 0).length;
  if (openDays === 0) throw new DomainError("invalid", "Open at least one day a week.");
  for (const ranges of Object.values(hours)) {
    for (const r of ranges) if (r.open >= r.close) throw new DomainError("invalid", "Each day must open before it closes.");
  }
  await db.location.update({ where: { id: actor.locationId }, data: { businessHours: hours as Prisma.InputJsonValue } });
}

const key = (name: string) => name.trim().toLowerCase();

/** Adds services, skipping names that already exist, so going back a step never duplicates them. */
export async function addStarterServices(db: Db, actor: Actor, services: StarterService[]) {
  return withTx(db, async (tx) => {
    const existing = await tx.service.findMany({ where: { locationId: actor.locationId }, select: { name: true } });
    const have = new Set(existing.map((s) => key(s.name)));
    const fresh = services.filter((s) => {
      if (have.has(key(s.name))) return false;
      have.add(key(s.name));
      return true;
    });
    if (have.size === 0) throw new DomainError("invalid", "Add at least one service.");
    for (const s of fresh) await saveService(tx, actor, { ...s, resourceIds: [] });
    return fresh.length;
  });
}

/** Adds staff who can do every active service; the owner can narrow that later in Settings. */
export async function addStarterStaff(db: Db, actor: Actor, names: string[]) {
  return withTx(db, async (tx) => {
    const [existing, services] = await Promise.all([
      tx.resource.findMany({ where: { locationId: actor.locationId }, select: { name: true } }),
      tx.service.findMany({ where: { locationId: actor.locationId, active: true }, select: { id: true } }),
    ]);
    const have = new Set(existing.map((r) => key(r.name)));
    const fresh: string[] = [];
    for (const name of names.map((n) => n.trim()).filter(Boolean)) {
      if (have.has(key(name))) continue;
      have.add(key(name));
      fresh.push(name);
    }
    if (have.size === 0) throw new DomainError("invalid", "Add at least one staff member or room.");
    for (const name of fresh) await saveResource(tx, actor, { name, serviceIds: services.map((s) => s.id) });
    return fresh.length;
  });
}

export async function finishOnboarding(db: Db, actor: Actor, rules: OfferRules, now = new Date()) {
  await withTx(db, async (tx) => {
    await tx.location.update({ where: { id: actor.locationId }, data: rules });
    await tx.organization.update({ where: { id: actor.organizationId }, data: { onboardedAt: now } });
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "organization",
      entityId: actor.organizationId,
      action: "organization.onboarded",
    });
  });
}
