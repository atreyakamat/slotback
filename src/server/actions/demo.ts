"use server";

import { redirect } from "next/navigation";
import { requireRole } from "../auth/dal";
import { createSession } from "../auth/session";
import { db } from "../db";
import { DEMO_CLINIC_NAME } from "../demo/clinic";
import { seedDemo } from "../demo/seed";

/** Restores the demo workspace to a fresh state anchored to the current time. Demo org owners only. */
export async function resetDemo() {
  const member = await requireRole("OWNER");
  if (!member.organization.isDemo) redirect("/app/settings?error=not-demo");

  const seeded = await seedDemo(db);
  const target = member.organization.name === DEMO_CLINIC_NAME ? seeded.clinic : seeded;
  await createSession({ userId: target.userId, organizationId: target.organizationId, locationId: target.locationId });
  redirect("/app?reset=1");
}
