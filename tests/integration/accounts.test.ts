import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createBusiness, findSignIn } from "@/server/domain/accounts";
import { addStarterServices, addStarterStaff, finishOnboarding, setBusinessHours } from "@/server/domain/onboarding";
import type { Actor } from "@/server/domain/types";
import { hasTestDb, testDb } from "../support/db";

describe.skipIf(!hasTestDb)("business accounts and onboarding", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const tag = randomUUID().slice(0, 8);
  const email = `owner-${tag}@example.com`;
  const orgIds: string[] = [];

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: orgIds } } });
    await db.user.deleteMany({ where: { email: { endsWith: `${tag}@example.com` } } });
  });

  async function newBusiness(e = email) {
    const s = await createBusiness(db, { email: e, ownerName: "Asha Naik", businessName: "Asha Studio", city: "Mapusa", vertical: "salon" });
    orgIds.push(s.organizationId);
    const actor: Actor = { ...s, timezone: "Asia/Kolkata" };
    return { s, actor };
  }

  it("creates a business, its first location and its owner, not yet onboarded", async () => {
    const { s } = await newBusiness(email.toUpperCase());
    const org = await db.organization.findUniqueOrThrow({ where: { id: s.organizationId }, include: { locations: true, memberships: { include: { user: true } } } });
    expect(org).toMatchObject({ name: "Asha Studio", vertical: "salon", city: "Mapusa", onboardedAt: null, isDemo: false });
    expect(org.locations).toHaveLength(1);
    expect(org.memberships[0]).toMatchObject({ role: "OWNER", user: { email, name: "Asha Naik" } });
    expect(await findSignIn(db, email)).toMatchObject({ session: s, onboarded: false });
  });

  it("refuses a second business for an email that already has an account", async () => {
    await expect(newBusiness()).rejects.toMatchObject({ code: "conflict" });
  });

  it("finds no sign-in for an unknown email", async () => {
    expect(await findSignIn(db, `nobody-${tag}@example.com`)).toBeNull();
  });

  it("walks through onboarding without duplicating anything when a step is repeated", async () => {
    const { actor } = await newBusiness(`second-${tag}@example.com`);
    await expect(setBusinessHours(db, actor, { "1": [] })).rejects.toThrow(/at least one day/);
    await setBusinessHours(db, actor, { "1": [{ open: "09:00", close: "18:00" }] });

    const services = [
      { name: "Haircut", durationMinutes: 45, pricePaise: 80000 },
      { name: "Facial", durationMinutes: 60, pricePaise: 180000 },
    ];
    expect(await addStarterServices(db, actor, services)).toBe(2);
    expect(await addStarterServices(db, actor, [{ ...services[0], name: " haircut " }])).toBe(0);

    expect(await addStarterStaff(db, actor, ["Riya", "riya", "  ", "Room 1"])).toBe(2);
    const staff = await db.resource.findMany({ where: { locationId: actor.locationId }, include: { services: true } });
    expect(staff.map((r) => r.services.length)).toEqual([2, 2]);

    await finishOnboarding(db, actor, { offerBatchSize: 4, offerTtlMinutes: 20, minLeadMinutes: 90, quietHoursStart: "22:00", quietHoursEnd: "08:00" });
    const org = await db.organization.findUniqueOrThrow({ where: { id: actor.organizationId }, include: { locations: true } });
    expect(org.onboardedAt).not.toBeNull();
    expect(org.locations[0]).toMatchObject({ offerBatchSize: 4, offerTtlMinutes: 20, minLeadMinutes: 90 });
  });
});
