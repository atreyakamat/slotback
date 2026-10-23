import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createLead, hashIp } from "@/server/domain/leads";
import { hasTestDb, testDb } from "../support/db";

describe("hashIp", () => {
  it("is stable per secret and never contains the IP", () => {
    const a = hashIp("203.0.113.9", "secret-one-secret-one-secret-one");
    expect(a).toBe(hashIp("203.0.113.9", "secret-one-secret-one-secret-one"));
    expect(a).not.toBe(hashIp("203.0.113.9", "secret-two-secret-two-secret-two"));
    expect(a).not.toContain("203.0.113.9");
  });
});

describe.skipIf(!hasTestDb)("book a demo leads", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const ipHash = `test-${randomUUID()}`;

  afterAll(async () => {
    await db.lead.deleteMany({ where: { ipHash: { startsWith: "test-" } } });
  });

  it("stores a normalized lead", async () => {
    const lead = await createLead(
      db,
      { name: " Asha ", business: "Asha's Studio", phone: "98765 43210", email: "Asha@Example.com", vertical: "Salon" },
      { ipHash },
    );
    expect(lead).toMatchObject({ name: "Asha", phone: "+91 98765 43210", email: "asha@example.com", vertical: "Salon" });
  });

  it("needs a way to reach the person", async () => {
    await expect(createLead(db, { name: "No Contact", business: "Somewhere" }, { ipHash })).rejects.toThrow(/phone number or an email/);
  });

  it("rejects numbers that aren't Indian mobiles", async () => {
    await expect(createLead(db, { name: "Bad Phone", business: "X", phone: "12345" }, { ipHash })).rejects.toThrow(/10-digit/);
  });

  it("limits repeat submissions from one address per hour", async () => {
    const burst = `test-${randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      await createLead(db, { name: `Lead ${i}`, business: "Burst", email: `b${i}@example.com` }, { ipHash: burst });
    }
    await expect(
      createLead(db, { name: "Sixth", business: "Burst", email: "b6@example.com" }, { ipHash: burst }),
    ).rejects.toMatchObject({ code: "rate_limited" });
    // An hour later the window has moved on.
    const later = new Date(Date.now() + 61 * 60_000);
    await expect(
      createLead(db, { name: "Later", business: "Burst", email: "later@example.com" }, { ipHash: burst, now: later }),
    ).resolves.toBeTruthy();
  });
});
