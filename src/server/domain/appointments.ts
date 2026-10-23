import type { AppointmentStatus } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import { DomainError, violatesConstraint } from "./errors";
import { withTx, type Actor, type Db } from "./types";

const OVERLAP_CONSTRAINT = "appointments_no_resource_overlap";

/** Allowed status changes. CANCELLED is terminal; COMPLETED and NO_SHOW can be corrected. */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ["CANCELLED", "COMPLETED", "NO_SHOW"],
  COMPLETED: ["NO_SHOW"],
  NO_SHOW: ["COMPLETED"],
  CANCELLED: [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus) {
  return TRANSITIONS[from].includes(to);
}

async function loadServiceAndResource(db: Db, actor: Actor, serviceId: string, resourceId: string) {
  const [service, resource] = await Promise.all([
    db.service.findFirst({ where: { id: serviceId, locationId: actor.locationId, active: true } }),
    db.resource.findFirst({
      where: { id: resourceId, locationId: actor.locationId, active: true },
      include: { services: { select: { id: true } } },
    }),
  ]);
  if (!service) throw new DomainError("not_found", "That service is not available at this location.");
  if (!resource) throw new DomainError("not_found", "That staff member is not available at this location.");
  if (!resource.services.some((s) => s.id === service.id)) {
    throw new DomainError("invalid", `${resource.name} doesn't offer ${service.name}.`);
  }
  return { service, resource };
}

async function assertFree(db: Db, resourceId: string, startAt: Date, endAt: Date, ignoreId?: string) {
  const clash = await db.appointment.findFirst({
    where: {
      resourceId,
      status: { not: "CANCELLED" },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw new DomainError("conflict", "That time overlaps another appointment for this staff member.");
}

function rethrowOverlap(err: unknown): never {
  if (violatesConstraint(err, OVERLAP_CONSTRAINT)) {
    throw new DomainError("conflict", "That time overlaps another appointment for this staff member.");
  }
  throw err;
}

export type CreateAppointmentInput = {
  customerId: string | null;
  serviceId: string;
  resourceId: string;
  startAt: Date;
};

export async function createAppointment(db: Db, actor: Actor, input: CreateAppointmentInput) {
  try {
    return await withTx(db, async (tx) => {
      const { service } = await loadServiceAndResource(tx, actor, input.serviceId, input.resourceId);
      if (input.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: input.customerId, locationId: actor.locationId, deletedAt: null },
          select: { id: true },
        });
        if (!customer) throw new DomainError("not_found", "That customer was not found.");
      }
      const endAt = new Date(input.startAt.getTime() + service.durationMinutes * 60_000);
      await assertFree(tx, input.resourceId, input.startAt, endAt);

      const appointment = await tx.appointment.create({
        data: {
          locationId: actor.locationId,
          customerId: input.customerId,
          serviceId: service.id,
          resourceId: input.resourceId,
          startAt: input.startAt,
          endAt,
          valuePaise: service.pricePaise,
        },
      });
      await recordAudit(tx, {
        organizationId: actor.organizationId,
        actorType: "USER",
        actorId: actor.userId,
        entityType: "appointment",
        entityId: appointment.id,
        action: "appointment.created",
        metadata: { serviceId: service.id, resourceId: input.resourceId },
      });
      return appointment;
    });
  } catch (err) {
    rethrowOverlap(err);
  }
}

async function loadAppointment(db: Db, actor: Actor, id: string) {
  const appointment = await db.appointment.findFirst({ where: { id, locationId: actor.locationId } });
  if (!appointment) throw new DomainError("not_found", "That appointment was not found.");
  return appointment;
}

export type RescheduleInput = { appointmentId: string; resourceId: string; startAt: Date };

/** Moves a booked appointment to a new time and/or staff member, keeping its service. */
export async function rescheduleAppointment(db: Db, actor: Actor, input: RescheduleInput) {
  try {
    return await withTx(db, async (tx) => {
      const current = await loadAppointment(tx, actor, input.appointmentId);
      if (current.status !== "BOOKED") throw new DomainError("invalid_transition", "Only booked appointments can be moved.");
      const { service } = await loadServiceAndResource(tx, actor, current.serviceId, input.resourceId);
      const endAt = new Date(input.startAt.getTime() + service.durationMinutes * 60_000);
      await assertFree(tx, input.resourceId, input.startAt, endAt, current.id);

      const updated = await tx.appointment.update({
        where: { id: current.id },
        data: { resourceId: input.resourceId, startAt: input.startAt, endAt },
      });
      await recordAudit(tx, {
        organizationId: actor.organizationId,
        actorType: "USER",
        actorId: actor.userId,
        entityType: "appointment",
        entityId: current.id,
        action: "appointment.rescheduled",
        metadata: {
          from: { resourceId: current.resourceId, startAt: current.startAt.toISOString() },
          to: { resourceId: input.resourceId, startAt: input.startAt.toISOString() },
        },
      });
      return updated;
    });
  } catch (err) {
    rethrowOverlap(err);
  }
}

/**
 * Changes an appointment's status. The update is conditional on the status we read, so two
 * staff acting on the same appointment at once cannot both succeed.
 */
export async function changeAppointmentStatus(
  db: Db,
  actor: Actor,
  input: { appointmentId: string; to: Exclude<AppointmentStatus, "BOOKED">; reason?: string | null },
) {
  return withTx(db, async (tx) => {
    const current = await loadAppointment(tx, actor, input.appointmentId);
    if (!canTransition(current.status, input.to)) {
      throw new DomainError(
        "invalid_transition",
        current.status === "CANCELLED"
          ? "This appointment is already cancelled."
          : `A ${current.status.toLowerCase().replace("_", "-")} appointment can't be marked ${input.to.toLowerCase().replace("_", "-")}.`,
      );
    }
    const now = new Date();
    const { count } = await tx.appointment.updateMany({
      where: { id: current.id, status: current.status },
      data: {
        status: input.to,
        cancelledAt: input.to === "CANCELLED" ? now : undefined,
        cancelReason: input.to === "CANCELLED" ? (input.reason?.trim() || null) : undefined,
        completedAt: input.to === "COMPLETED" ? now : input.to === "NO_SHOW" ? null : undefined,
      },
    });
    if (count === 0) throw new DomainError("conflict", "This appointment was just changed by someone else. Refresh and try again.");

    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "appointment",
      entityId: current.id,
      action: `appointment.${input.to.toLowerCase()}`,
      metadata: { from: current.status, to: input.to },
    });
    return tx.appointment.findUniqueOrThrow({ where: { id: current.id } });
  });
}
