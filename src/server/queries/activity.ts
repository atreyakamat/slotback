import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Member } from "../auth/dal";
import { db } from "../db";

export const ACTIVITY_FILTERS = {
  all: { label: "All", entityTypes: null },
  recovery: { label: "Recovery", entityTypes: ["campaign"] },
  appointments: { label: "Appointments", entityTypes: ["appointment"] },
  waitlist: { label: "Waitlist & consent", entityTypes: ["waitlist_entry", "customer"] },
  settings: { label: "Settings", entityTypes: ["service", "resource", "location", "organization"] },
} as const;

export type ActivityFilter = keyof typeof ACTIVITY_FILTERS;

export function parseActivityFilter(value: string | string[] | undefined): ActivityFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v in ACTIVITY_FILTERS ? (v as ActivityFilter) : "all";
}

const PAGE = 40;

/**
 * The organization's audit trail, newest first, with the names needed to read it.
 * Paginates with an opaque cursor (the last event id) so new events never shift pages.
 */
export async function getActivity(member: Member, filter: ActivityFilter, cursor?: string) {
  const types = ACTIVITY_FILTERS[filter].entityTypes;
  const where: Prisma.AuditEventWhereInput = {
    organizationId: member.organization.id,
    ...(types ? { entityType: { in: [...types] } } : {}),
  };
  const rows = await db.auditEvent.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, PAGE);
  const nextCursor = rows.length > PAGE ? page[page.length - 1].id : null;

  const ids = (type: string) => [...new Set(page.filter((e) => e.entityType === type).map((e) => e.entityId))];
  const actorIds = (type: "USER" | "CUSTOMER") => [
    ...new Set(page.filter((e) => e.actorType === type && e.actorId).map((e) => e.actorId!)),
  ];
  const locationId = member.location.id;

  // Every lookup is scoped to the member's tenant, so a stray id can never leak another business's names.
  const [users, customers, campaigns, appointments, services, resources, waitlist] = await Promise.all([
    db.user.findMany({
      where: { id: { in: actorIds("USER") }, memberships: { some: { organizationId: member.organization.id } } },
      select: { id: true, name: true },
    }),
    db.customer.findMany({
      where: { id: { in: [...actorIds("CUSTOMER"), ...ids("customer")] }, locationId },
      select: { id: true, name: true },
    }),
    db.recoveryCampaign.findMany({
      where: { id: { in: ids("campaign") }, locationId },
      select: { id: true, startAt: true, service: { select: { name: true } } },
    }),
    db.appointment.findMany({
      where: { id: { in: ids("appointment") }, locationId },
      select: { id: true, startAt: true, customer: { select: { name: true } }, service: { select: { name: true } } },
    }),
    db.service.findMany({ where: { id: { in: ids("service") }, locationId }, select: { id: true, name: true } }),
    db.resource.findMany({ where: { id: { in: ids("resource") }, locationId }, select: { id: true, name: true } }),
    db.waitlistEntry.findMany({
      where: { id: { in: ids("waitlist_entry") }, locationId },
      select: { id: true, customer: { select: { name: true } } },
    }),
  ]);

  const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  return {
    events: page,
    nextCursor,
    lookup: {
      users: byId(users),
      customers: byId(customers),
      campaigns: byId(campaigns),
      appointments: byId(appointments),
      services: byId(services),
      resources: byId(resources),
      waitlist: byId(waitlist),
    },
  };
}

export type Activity = Awaited<ReturnType<typeof getActivity>>;
