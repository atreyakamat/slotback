"use server";

import { redirect } from "next/navigation";
import { requireRole } from "../auth/dal";
import { createSession } from "../auth/session";
import { db } from "../db";
import { seedDemo } from "../demo/seed";

/** Restores the demo workspace to a fresh state anchored to the current time. Demo org owners only. */
export async function resetDemo() {
  const member = await requireRole("OWNER");
  if (!member.organization.isDemo) redirect("/app/settings?error=not-demo");

  const seeded = await seedDemo(db);
  await createSession({ userId: seeded.userId, organizationId: seeded.organizationId, locationId: seeded.locationId });
  redirect("/app?reset=1");
}
