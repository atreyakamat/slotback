import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_USER_EMAIL, seedDemo } from "./seed";

/** The demo owner's session ids. Creates the demo workspace on first use. */
export async function demoSessionTarget(db: PrismaClient) {
  const membership = await db.membership.findFirst({
    where: { user: { email: DEMO_USER_EMAIL }, organization: { isDemo: true } },
    select: { userId: true, organizationId: true, organization: { select: { locations: { select: { id: true }, take: 1 } } } },
  });
  if (membership && membership.organization.locations[0]) {
    return { userId: membership.userId, organizationId: membership.organizationId, locationId: membership.organization.locations[0].id };
  }
  const seeded = await seedDemo(db);
  return { userId: seeded.userId, organizationId: seeded.organizationId, locationId: seeded.locationId };
}
