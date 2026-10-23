import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAppointment } from "@/server/domain/appointments";
import { saveResource, saveService, setResourceActive, updateLocationSettings } from "@/server/domain/catalogue";
import { createCustomer, normalizeIndianPhone } from "@/server/domain/customers";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

describe("phone normalisation", () => {
  it("accepts common Indian mobile formats", () => {
    expect(normalizeIndianPhone("98765 43210")).toBe("+91 98765 43210");
    expect(normalizeIndianPhone("+91-98765-43210")).toBe("+91 98765 43210");
    expect(normalizeIndianPhone("09876543210")).toBe("+91 98765 43210");
  });
  it("rejects numbers that cannot be Indian mobiles", () => {
    expect(normalizeIndianPhone("51234 56789")).toBeNull();
    expect(normalizeIndianPhone("12345")).toBeNull();
  });
});

describe.skipIf(!hasTestDb)("catalogue and customers", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let f: Awaited<ReturnType<typeof createFixture>>;
  let other: Awaited<ReturnType<typeof createFixture>>;

  beforeAll(async () => {
    f = await createFixture(db, "catalogue");
    other = await createFixture(db, "catalogue-other");
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  it("creates a service assigned to staff", async () => {
    const s = await saveService(db, f.actor, { name: " Beard trim ", durationMinutes: 20, pricePaise: 30000, resourceIds: [f.stylist.id] });
    const withStaff = await db.service.findUniqueOrThrow({ where: { id: s.id }, include: { resources: true } });
    expect(withStaff.name).toBe("Beard trim");
    expect(withStaff.resources.map((r) => r.id)).toEqual([f.stylist.id]);
  });

  it("refuses to assign another business's staff", async () => {
    await expect(
      saveService(db, f.actor, { name: "Sneaky", durationMinutes: 20, pricePaise: 0, resourceIds: [other.stylist.id] }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(saveResource(db, f.actor, { id: other.stylist.id, name: "Hijack", serviceIds: [] })).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("won't archive staff who still have upcoming bookings", async () => {
    const future = new Date(Date.now() + 3 * 24 * 3600_000);
    await createAppointment(db, f.actor, { customerId: null, serviceId: f.nails.id, resourceId: f.nailTech.id, startAt: future });
    await expect(setResourceActive(db, f.actor, f.nailTech.id, false)).rejects.toThrow(/upcoming appointment/);
  });

  it("validates opening hours", async () => {
    await expect(
      updateLocationSettings(db, f.actor, {
        name: "X",
        address: null,
        phone: null,
        businessHours: { "1": [{ open: "18:00", close: "10:00" }] },
        minLeadMinutes: 60,
        offerTtlMinutes: 30,
        offerBatchSize: 5,
        quietHoursStart: "21:00",
        quietHoursEnd: "09:00",
        autoNextRound: true,
        maxRounds: 3,
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("records only granted consent and blocks duplicate phone numbers", async () => {
    const c = await createCustomer(db, f.actor, {
      name: "New Person",
      phone: "+91 90000 00077",
      email: null,
      preferredChannel: "WHATSAPP",
      consentChannels: ["WHATSAPP"],
      consentSource: "test",
    });
    const consents = await db.channelConsent.findMany({ where: { customerId: c.id } });
    expect(consents.map((x) => [x.channel, x.status])).toEqual([["WHATSAPP", "GRANTED"]]);

    await expect(
      createCustomer(db, f.actor, {
        name: "Dupe",
        phone: "+91 90000 00077",
        email: null,
        preferredChannel: "SMS",
        consentChannels: [],
        consentSource: "test",
      }),
    ).rejects.toMatchObject({ code: "conflict" });
  });
});
