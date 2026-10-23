"use server";

import { redirect } from "next/navigation";
import { db } from "../db";
import { env } from "../env";
import { createSession, destroySession } from "../auth/session";
import { DEMO_USER_EMAIL, seedDemo } from "../demo/seed";

/** One-click login into the fictional demo workspace. Creates it on first use. */
export async function demoLogin() {
  if (!env().DEMO_MODE) redirect("/login?error=demo-disabled");

  const membership = await db.membership.findFirst({
    where: { user: { email: DEMO_USER_EMAIL }, organization: { isDemo: true } },
    select: { userId: true, organizationId: true, organization: { select: { locations: { select: { id: true }, take: 1 } } } },
  });

  let session;
  if (membership && membership.organization.locations[0]) {
    session = {
      userId: membership.userId,
      organizationId: membership.organizationId,
      locationId: membership.organization.locations[0].id,
    };
  } else {
    const seeded = await seedDemo(db);
    session = { userId: seeded.userId, organizationId: seeded.organizationId, locationId: seeded.locationId };
  }

  await createSession(session);
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
