import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import { DomainError } from "./errors";
import { withTx, type Actor, type Db } from "./types";

export type ServiceInput = { name: string; durationMinutes: number; pricePaise: number; resourceIds: string[] };

async function assertResourcesInLocation(db: Db, actor: Actor, ids: string[]) {
  if (ids.length === 0) return;
  const count = await db.resource.count({ where: { id: { in: ids }, locationId: actor.locationId } });
  if (count !== new Set(ids).size) throw new DomainError("not_found", "One of the selected staff members was not found.");
}

async function assertServicesInLocation(db: Db, actor: Actor, ids: string[]) {
  if (ids.length === 0) return;
  const count = await db.service.count({ where: { id: { in: ids }, locationId: actor.locationId } });
  if (count !== new Set(ids).size) throw new DomainError("not_found", "One of the selected services was not found.");
}

export async function saveService(db: Db, actor: Actor, input: ServiceInput & { id?: string }) {
  return withTx(db, async (tx) => {
    await assertResourcesInLocation(tx, actor, input.resourceIds);
    const data = {
      name: input.name.trim(),
      durationMinutes: input.durationMinutes,
      pricePaise: input.pricePaise,
      resources: { set: input.resourceIds.map((id) => ({ id })) },
    };
    let service;
    if (input.id) {
      const existing = await tx.service.findFirst({ where: { id: input.id, locationId: actor.locationId } });
      if (!existing) throw new DomainError("not_found", "That service was not found.");
      service = await tx.service.update({ where: { id: existing.id }, data });
    } else {
      service = await tx.service.create({
        data: { ...data, locationId: actor.locationId, resources: { connect: input.resourceIds.map((id) => ({ id })) } },
      });
    }
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "service",
      entityId: service.id,
      action: input.id ? "service.updated" : "service.created",
    });
    return service;
  });
}

export async function setServiceActive(db: Db, actor: Actor, id: string, active: boolean) {
  const { count } = await db.service.updateMany({ where: { id, locationId: actor.locationId }, data: { active } });
  if (count === 0) throw new DomainError("not_found", "That service was not found.");
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "service",
    entityId: id,
    action: active ? "service.restored" : "service.archived",
  });
}

export type ResourceInput = { name: string; serviceIds: string[] };

export async function saveResource(db: Db, actor: Actor, input: ResourceInput & { id?: string }) {
  return withTx(db, async (tx) => {
    await assertServicesInLocation(tx, actor, input.serviceIds);
    let resource;
    if (input.id) {
      const existing = await tx.resource.findFirst({ where: { id: input.id, locationId: actor.locationId } });
      if (!existing) throw new DomainError("not_found", "That staff member was not found.");
      resource = await tx.resource.update({
        where: { id: existing.id },
        data: { name: input.name.trim(), services: { set: input.serviceIds.map((id) => ({ id })) } },
      });
    } else {
      resource = await tx.resource.create({
        data: {
          locationId: actor.locationId,
          name: input.name.trim(),
          kind: "STAFF",
          services: { connect: input.serviceIds.map((id) => ({ id })) },
        },
      });
    }
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "resource",
      entityId: resource.id,
      action: input.id ? "resource.updated" : "resource.created",
    });
    return resource;
  });
}

export async function setResourceActive(db: Db, actor: Actor, id: string, active: boolean) {
  if (!active) {
    const upcoming = await db.appointment.count({
      where: { resourceId: id, locationId: actor.locationId, status: "BOOKED", startAt: { gt: new Date() } },
    });
    if (upcoming > 0) {
      throw new DomainError(
        "conflict",
        `This staff member has ${upcoming} upcoming appointment${upcoming === 1 ? "" : "s"}. Move or cancel them first.`,
      );
    }
  }
  const { count } = await db.resource.updateMany({ where: { id, locationId: actor.locationId }, data: { active } });
  if (count === 0) throw new DomainError("not_found", "That staff member was not found.");
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "resource",
    entityId: id,
    action: active ? "resource.restored" : "resource.archived",
  });
}

export type DayHours = { open: string; close: string }[];
export type BusinessHours = Record<string, DayHours>;

export type LocationSettingsInput = {
  name: string;
  address: string | null;
  phone: string | null;
  businessHours: BusinessHours;
  minLeadMinutes: number;
  offerTtlMinutes: number;
  offerBatchSize: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  autoNextRound: boolean;
  maxRounds: number;
};

export async function updateLocationSettings(db: Db, actor: Actor, input: LocationSettingsInput) {
  for (const [day, ranges] of Object.entries(input.businessHours)) {
    for (const r of ranges) {
      if (r.open >= r.close) throw new DomainError("invalid", `Opening time must be before closing time (day ${day}).`);
    }
  }
  await db.location.update({
    where: { id: actor.locationId },
    data: { ...input, businessHours: input.businessHours as Prisma.InputJsonValue },
  });
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "location",
    entityId: actor.locationId,
    action: "location.settings_updated",
  });
}
