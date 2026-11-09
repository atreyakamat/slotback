"use server";

import { redirect } from "next/navigation";
import { db } from "../db";
import { env } from "../env";
import { createSession, destroySession } from "../auth/session";
import { DEMO_CLINIC_NAME } from "../demo/clinic";
import { DEMO_USER_EMAIL, seedDemo } from "../demo/seed";

/** One-click login into a fictional demo workspace (salon by default, or the dental clinic). Creates it on first use. */
export async function demoLogin(formData?: FormData) {
  if (!env().DEMO_MODE) redirect("/login?error=demo-disabled");
  const workspace = formData?.get("workspace") === "clinic" ? "clinic" : "salon";

  const membership = await db.membership.findFirst({
    where: {
      user: { email: DEMO_USER_EMAIL },
      organization: { isDemo: true, name: workspace === "clinic" ? DEMO_CLINIC_NAME : { not: DEMO_CLINIC_NAME } },
    },
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
    const target = workspace === "clinic" ? seeded.clinic : seeded;
    session = { userId: target.userId, organizationId: target.organizationId, locationId: target.locationId };
  }

  await createSession(session);
  redirect("/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
