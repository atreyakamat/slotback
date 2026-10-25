import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedDemo } from "@/server/demo/seed";
import { hasTestDb, testDb } from "../support/db";

describe.skipIf(!hasTestDb)("database integrity", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let ids: { locationId: string; serviceId: string; resourceId: string };

  beforeAll(async () => {
    const org = await db.organization.create({
      data: {
        name: "Integrity Test Clinic",
        locations: { create: { name: "Main", businessHours: {} } },
      },
      include: { locations: true },
    });
    const locationId = org.locations[0].id;
    const service = await db.service.create({ data: { locationId, name: "Cleaning", durationMinutes: 60, pricePaise: 150000 } });
    const resource = await db.resource.create({ data: { locationId, name: "Chair 1" } });
    ids = { locationId, serviceId: service.id, resourceId: resource.id };
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { name: "Integrity Test Clinic" } });
    await db.$disconnect();
  });

  const booking = (start: string, end: string, status: "BOOKED" | "CANCELLED" = "BOOKED") => ({
    ...ids,
    startAt: new Date(start),
    endAt: new Date(end),
    status,
    valuePaise: 150000,
  });

  it("rejects overlapping bookings for the same resource", async () => {
    await db.appointment.create({ data: booking("2026-11-02T05:00:00Z", "2026-11-02T06:00:00Z") });
    await expect(
      db.appointment.create({ data: booking("2026-11-02T05:30:00Z", "2026-11-02T06:30:00Z") }),
    ).rejects.toThrow(/appointments_no_resource_overlap|exclusion/i);
  });

  it("allows back-to-back bookings", async () => {
    await expect(
      db.appointment.create({ data: booking("2026-11-02T06:00:00Z", "2026-11-02T07:00:00Z") }),
    ).resolves.toBeTruthy();
  });

  it("frees the slot once an appointment is cancelled", async () => {
    const a = await db.appointment.create({ data: booking("2026-11-03T05:00:00Z", "2026-11-03T06:00:00Z") });
    await db.appointment.update({ where: { id: a.id }, data: { status: "CANCELLED" } });
    await expect(
      db.appointment.create({ data: booking("2026-11-03T05:00:00Z", "2026-11-03T06:00:00Z") }),
    ).resolves.toBeTruthy();
  });

  it("rejects an appointment that ends before it starts", async () => {
    await expect(
      db.appointment.create({ data: booking("2026-11-04T06:00:00Z", "2026-11-04T05:00:00Z") }),
    ).rejects.toThrow(/appointments_end_after_start|check/i);
  });
});

describe.skipIf(!hasTestDb)("demo seed", () => {
  const db = hasTestDb ? testDb() : (null as never);

  afterAll(async () => {
    await db.organization.deleteMany({ where: { isDemo: true } });
    await db.organization.deleteMany({ where: { name: "Real Customer Salon" } });
    await db.$disconnect();
  });

  it("is repeatable and never touches real organizations", async () => {
    const real = await db.organization.create({ data: { name: "Real Customer Salon" } });
    const first = await seedDemo(db, new Date("2026-10-23T04:00:00Z"));
    const second = await seedDemo(db, new Date("2026-10-23T04:00:00Z"));

    expect(second.organizationId).not.toBe(first.organizationId);
    expect(await db.organization.count({ where: { isDemo: true } })).toBe(1);
    expect(await db.organization.findUnique({ where: { id: real.id } })).not.toBeNull();

    const waitlist = await db.waitlistEntry.count({ where: { locationId: second.locationId } });
    expect(waitlist).toBe(18);
  });

  it("only uses the reserved fake phone range", async () => {
    const customers = await db.customer.findMany({ where: { location: { organization: { isDemo: true } } } });
    expect(customers.length).toBeGreaterThan(0);
    for (const c of customers) expect(c.phone).toMatch(/^\+91 90000 000\d{2}$/);
  });
});
