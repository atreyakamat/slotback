import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_CLINIC_NAME } from "./clinic";
import { DEMO_USER_EMAIL, seedDemo, type DemoWorkspace } from "./seed";

/** The demo owner's session ids for the salon (default) or the dental clinic. Creates the demos on first use. */
export async function demoSessionTarget(db: PrismaClient, workspace: DemoWorkspace = "salon") {
  const membership = await db.membership.findFirst({
    where: {
      user: { email: DEMO_USER_EMAIL },
      organization: { isDemo: true, name: workspace === "clinic" ? DEMO_CLINIC_NAME : { not: DEMO_CLINIC_NAME } },
    },
    select: { userId: true, organizationId: true, organization: { select: { locations: { select: { id: true }, take: 1 } } } },
  });
  if (membership && membership.organization.locations[0]) {
    return { userId: membership.userId, organizationId: membership.organizationId, locationId: membership.organization.locations[0].id };
  }
  const seeded = await seedDemo(db);
  const target = workspace === "clinic" ? seeded.clinic : seeded;
  return { userId: target.userId, organizationId: target.organizationId, locationId: target.locationId };
}
