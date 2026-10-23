import type { LookupAddress } from "node:dns";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { zonedToUtc } from "@/lib/time";
import { createIntegration, resolveIntegrationKey, syncBooking, updateIntegration } from "@/server/domain/integrations";
import { guardedLookup, isPrivateAddress, safePost, UnsafeUrlError, webhookUrlProblem } from "@/server/integrations/safe-fetch";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

/** Attack: point a webhook at SlotBack's own network (server-side request forgery). */
describe("attack: SSRF through webhook URLs", () => {
  it.each([
    "http://hooks.example.com/x",
    "https://user:pass@hooks.example.com/x",
    "https://hooks.example.com:8443/x",
    "https://localhost/x",
    "https://127.0.0.1/x",
    "https://2130706433/x", // 127.0.0.1 written as a number
    "https://0x7f.0.0.1/x",
    "https://10.0.0.5/x",
    "https://172.16.0.1/x",
    "https://192.168.1.1/x",
    "https://169.254.169.254/latest/meta-data/", // cloud metadata
    "https://[::1]/x",
    "https://[::ffff:127.0.0.1]/x",
    "https://[fd00::1]/x",
    "https://metadata.google.internal/x",
    "https://printer.local/x",
    "file:///etc/passwd",
    "gopher://127.0.0.1:6379/_FLUSHALL",
    "javascript:alert(1)",
  ])("refuses %s", (url) => {
    expect(webhookUrlProblem(url)).not.toBeNull();
  });

  it("accepts an ordinary public https URL", () => {
    expect(webhookUrlProblem("https://hooks.zapier.com/hooks/catch/123/abc/")).toBeNull();
  });

  it("classifies addresses", () => {
    for (const a of ["127.0.0.1", "10.1.2.3", "100.64.0.1", "169.254.1.1", "172.31.255.255", "192.168.0.1", "0.0.0.0", "224.0.0.1", "::1", "fe80::1", "fc00::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateAddress(a), a).toBe(true);
    }
    for (const a of ["8.8.8.8", "1.1.1.1", "203.0.114.1", "2606:4700:4700::1111"]) expect(isPrivateAddress(a), a).toBe(false);
  });

  it("refuses a public-looking name that resolves to a private address (DNS rebinding)", async () => {
    const evilDns = ((_host: string, _opts: unknown, cb: (e: Error | null, a: LookupAddress[]) => void) =>
      cb(null, [{ address: "169.254.169.254", family: 4 }])) as unknown as typeof import("node:dns").lookup;
    const lookup = guardedLookup(evilDns);
    await expect(
      new Promise((resolve, reject) => lookup("rebind.example.com", { all: true }, (err, addr) => (err ? reject(err) : resolve(addr)))),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(safePost("https://rebind.example.com/hook", "{}", {}, { lookup: evilDns, timeoutMs: 2000 })).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("refuses when any one of several resolved addresses is private", async () => {
    const mixed = ((_h: string, _o: unknown, cb: (e: Error | null, a: LookupAddress[]) => void) =>
      cb(null, [
        { address: "8.8.8.8", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ])) as unknown as typeof import("node:dns").lookup;
    await expect(safePost("https://mixed.example.com/hook", "{}", {}, { lookup: mixed, timeoutMs: 2000 })).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

/** Attack: abuse the booking API with someone else's key, or guess keys. */
describe.skipIf(!hasTestDb)("attack: the booking API", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let a: Awaited<ReturnType<typeof createFixture>>;
  let b: Awaited<ReturnType<typeof createFixture>>;

  beforeAll(async () => {
    a = await createFixture(db, "api-victim");
    b = await createFixture(db, "api-attacker");
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  it("one business's key can't see or change another business's bookings", async () => {
    const victim = await createIntegration(db, a.actor, { name: "Victim tool", webhookUrl: null, autoRefill: false });
    const attacker = await createIntegration(db, b.actor, { name: "Attacker tool", webhookUrl: null, autoRefill: false });
    const v = (await resolveIntegrationKey(db, victim.key))!;
    const x = (await resolveIntegrationKey(db, attacker.key))!;
    const startAt = zonedToUtc("2027-04-01", 15 * 60, "Asia/Kolkata");
    const booked = await syncBooking(db, v, { externalId: "shared-id", status: "booked", startAt, service: "Cut" }, { baseUrl: "https://x" });

    // Same external id from the attacker's key: a separate booking in the attacker's own business.
    await expect(syncBooking(db, x, { externalId: "shared-id", status: "cancelled", startAt, service: "Cut" }, { baseUrl: "https://x" })).rejects.toMatchObject({
      code: "not_found",
    });
    const mine = await syncBooking(db, x, { externalId: "shared-id", status: "booked", startAt, service: "Cut" }, { baseUrl: "https://x" });
    expect(mine.appointmentId).not.toBe(booked.appointmentId);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: mine.appointmentId } })).locationId).toBe(b.actor.locationId);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: booked.appointmentId } })).status).toBe("BOOKED");

    // And can't edit the victim's connection.
    await expect(updateIntegration(db, b.actor, victim.integration.id, { name: "pwned", webhookUrl: "https://evil.example.com", autoRefill: true })).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("malformed and guessed keys are rejected without a database hit for the key itself", async () => {
    for (const key of ["", "sbk_", "sbk_short", `sbk_${"a".repeat(43)}`, `sk_${"a".repeat(44)}`, `sbk_${"'".repeat(43)}`, "Bearer x"]) {
      expect(await resolveIntegrationKey(db, key)).toBeNull();
    }
  });

  it("webhook URLs are checked when saved, not just when used", async () => {
    await expect(createIntegration(db, a.actor, { name: "SSRF", webhookUrl: "https://169.254.169.254/latest", autoRefill: false })).rejects.toMatchObject({
      code: "invalid",
    });
  });
});
