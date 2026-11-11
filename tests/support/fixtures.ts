import type { PrismaClient } from "@/generated/prisma/client";
import type { Actor } from "@/server/domain/types";

/** Creates an isolated organization with one location, two services, two staff and a customer. */
export async function createFixture(db: PrismaClient, label: string) {
  const user = await db.user.create({ data: { email: `${label}-${Date.now()}-${Math.random()}@test.local`, name: `${label} owner` } });
  const org = await db.organization.create({
    data: {
      name: `fixture:${label}`,
      memberships: { create: { userId: user.id, role: "OWNER" } },
      locations: {
        create: { name: `${label} location`, businessHours: { "1": [{ open: "10:00", close: "20:00" }] } },
      },
    },
    include: { locations: true },
  });
  const locationId = org.locations[0].id;
  const cut = await db.service.create({ data: { locationId, name: "Cut", durationMinutes: 60, pricePaise: 100000 } });
  const nails = await db.service.create({ data: { locationId, name: "Nails", durationMinutes: 45, pricePaise: 80000 } });
  const stylist = await db.resource.create({
    data: { locationId, name: "Stylist", services: { connect: [{ id: cut.id }] } },
  });
  const nailTech = await db.resource.create({
    data: { locationId, name: "Nail tech", services: { connect: [{ id: nails.id }] } },
  });
  const customer = await db.customer.create({ data: { locationId, name: "Test Customer", phone: "+91 90000 00099" } });
  const actor: Actor = { userId: user.id, organizationId: org.id, locationId, timezone: "Asia/Kolkata" };
  return { actor, org, cut, nails, stylist, nailTech, customer };
}

export async function cleanupFixtures(db: PrismaClient) {
  const orgs = await db.organization.findMany({ where: { name: { startsWith: "fixture:" } }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  await db.claim.deleteMany({ where: { campaign: { location: { organizationId: { in: ids } } } } });
  await db.recoveryCampaign.deleteMany({ where: { location: { organizationId: { in: ids } } } });
  await db.appointment.deleteMany({ where: { location: { organizationId: { in: ids } } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
  await db.user.deleteMany({ where: { email: { endsWith: "@test.local" } } });
}
