import "server-only";
import type { Member } from "../auth/dal";
import { db } from "../db";
import { addDays, localWeekday, zonedToUtc } from "@/lib/time";
import type { BusinessHours } from "../domain/catalogue";

/** Appointments for `days` local days starting at `startDate`, plus what the booking form needs. */
export async function getSchedule(member: Member, startDate: string, days: number) {
  const { id: locationId, timezone } = member.location;
  const from = zonedToUtc(startDate, 0, timezone);
  const to = zonedToUtc(addDays(startDate, days), 0, timezone);

  const [location, resources, appointments, services, customers] = await Promise.all([
    db.location.findUniqueOrThrow({ where: { id: locationId }, select: { businessHours: true } }),
    db.resource.findMany({
      where: { locationId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, services: { where: { active: true }, select: { id: true } } },
    }),
    db.appointment.findMany({
      where: { locationId, startAt: { gte: from, lt: to } },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        source: true,
        resourceId: true,
        customer: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
    db.service.findMany({
      where: { locationId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true, pricePaise: true },
    }),
    db.customer.findMany({
      where: { locationId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
  ]);

  const hours = location.businessHours as BusinessHours;
  const dayList = Array.from({ length: days }, (_, i) => {
    const date = addDays(startDate, i);
    const weekday = localWeekday(zonedToUtc(date, 12 * 60, timezone), timezone);
    return { date, weekday, hours: hours[String(weekday)] ?? [] };
  });

  return {
    days: dayList,
    resources: resources.map((r) => ({ id: r.id, name: r.name, serviceIds: r.services.map((s) => s.id) })),
    appointments,
    services,
    customers,
  };
}

export async function getAppointmentDetail(member: Member, id: string) {
  const appointment = await db.appointment.findFirst({
    where: { id, locationId: member.location.id },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      service: { select: { id: true, name: true, durationMinutes: true } },
      resource: { select: { id: true, name: true } },
    },
  });
  if (!appointment) return null;

  const [history, resources] = await Promise.all([
    db.auditEvent.findMany({
      where: { organizationId: member.organization.id, entityType: "appointment", entityId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, action: true, actorType: true, actorId: true, createdAt: true },
    }),
    db.resource.findMany({
      where: { locationId: member.location.id, active: true, services: { some: { id: appointment.serviceId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const actorIds = [...new Set(history.map((h) => h.actorId).filter((x): x is string => Boolean(x)))];
  const users = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
  const names = new Map(users.map((u) => [u.id, u.name]));

  return {
    appointment,
    resources,
    history: history.map((h) => ({
      ...h,
      actorName: h.actorType === "USER" ? (names.get(h.actorId ?? "") ?? "Staff") : h.actorType === "CUSTOMER" ? "Customer" : "SlotBack",
    })),
  };
}

export async function getSettingsData(member: Member) {
  const locationId = member.location.id;
  const [location, services, resources] = await Promise.all([
    db.location.findUniqueOrThrow({ where: { id: locationId } }),
    db.service.findMany({
      where: { locationId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { resources: { select: { id: true } } },
    }),
    db.resource.findMany({
      where: { locationId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { services: { select: { id: true } } },
    }),
  ]);
  return { location, services, resources };
}
