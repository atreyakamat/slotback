import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBusiness } from "@/server/domain/accounts";
import { ensureJoinCode, getJoinPage, importWaitlist, JOIN_LIMIT_PER_HOUR, mapImportRows, rotateJoinCode, selfJoin } from "@/server/domain/waitlist-growth";
import type { Actor } from "@/server/domain/types";
import { hasTestDb, testDb } from "../support/db";

describe.skipIf(!hasTestDb)("growing the waitlist", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const tag = randomUUID().slice(0, 8);
  let actor: Actor;
  let serviceId: string;

  beforeAll(async () => {
    const s = await createBusiness(db, { email: `grow-${tag}@example.com`, ownerName: "Asha", businessName: "Grow Studio", city: "Panaji", vertical: "salon" });
    actor = { ...s, timezone: "Asia/Kolkata" };
    serviceId = (await db.service.create({ data: { locationId: actor.locationId, name: "Facial", durationMinutes: 60, pricePaise: 150000 } })).id;
  });

  afterAll(async () => {
    await db.rateLimitHit.deleteMany({ where: { key: { contains: tag } } });
    await db.organization.deleteMany({ where: { id: actor.organizationId } });
    await db.user.deleteMany({ where: { email: `grow-${tag}@example.com` } });
  });

  it("creates a stable join code and retires it when reset", async () => {
    const code = await ensureJoinCode(db, actor);
    expect(await ensureJoinCode(db, actor)).toBe(code);
    expect(await getJoinPage(db, code)).toMatchObject({ organization: { name: "Grow Studio" }, services: [{ name: "Facial" }] });
    const next = await rotateJoinCode(db, actor);
    expect(next).not.toBe(code);
    expect(await getJoinPage(db, code)).toBeNull();
  });

  it("lets a client join with only the consent they ticked, and joining again updates instead of duplicating", async () => {
    const code = await ensureJoinCode(db, actor);
    const input = { name: "Fatima", phone: "98765 11111", serviceId, days: [6, 6, 0], window: "morning" as const, channels: ["WHATSAPP" as const] };
    await selfJoin(db, code, input, { ipHash: null });
    await selfJoin(db, code, { ...input, window: "evening" }, { ipHash: null });

    const customers = await db.customer.findMany({ where: { locationId: actor.locationId, phone: "+91 98765 11111" }, include: { consents: true, waitlistEntries: true } });
    expect(customers).toHaveLength(1);
    expect(customers[0].consents.map((c) => [c.channel, c.status, c.source])).toEqual([["WHATSAPP", "GRANTED", "self_join"]]);
    expect(customers[0].waitlistEntries).toHaveLength(1);
    expect(customers[0].waitlistEntries[0]).toMatchObject({ preferredDays: [0, 6], earliestMinute: 17 * 60, latestMinute: 1440 });
  });

  it("refuses bad numbers, foreign services and floods from one connection", async () => {
    const code = await ensureJoinCode(db, actor);
    const base = { name: "X", phone: "12345", serviceId: null, days: [], window: "any" as const, channels: ["SMS" as const] };
    await expect(selfJoin(db, code, base, { ipHash: null })).rejects.toThrow(/10-digit/);
    await expect(selfJoin(db, code, { ...base, phone: "9876522222", serviceId: "nope" }, { ipHash: null })).rejects.toThrow(/service/);
    const ipHash = `flood-${tag}`;
    for (let i = 0; i < JOIN_LIMIT_PER_HOUR; i++) await selfJoin(db, code, { ...base, phone: `98765333${String(i).padStart(2, "0")}` }, { ipHash });
    await expect(selfJoin(db, code, { ...base, phone: "9876533399" }, { ipHash })).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("imports a list, matching by phone and never overriding an opt-out", async () => {
    const optedOut = await db.customer.create({
      data: { locationId: actor.locationId, name: "Quiet Person", phone: "+91 90000 44444", consents: { create: { channel: "WHATSAPP", status: "REVOKED", source: "reply_stop" } } },
    });
    const rows = mapImportRows([
      ["Name", "Phone", "Service"],
      ["Neha", "9000011111", "facial"],
      ["Neha Again", "+91 90000 11111", ""],
      ["Quiet Person", "9000044444", ""],
      ["", "9000055555", ""],
      ["Bad", "555", ""],
    ]);
    const result = await importWaitlist(db, actor, rows, { attested: true });
    expect(result).toMatchObject({ added: 1, updated: 1 });
    expect(result.skipped.map((s) => s.line)).toEqual([3, 5, 6]);

    const neha = await db.customer.findFirstOrThrow({ where: { locationId: actor.locationId, phone: "+91 90000 11111" }, include: { consents: true, waitlistEntries: true } });
    expect(neha.consents.map((c) => c.status)).toEqual(["GRANTED", "GRANTED"]);
    expect(neha.waitlistEntries[0].serviceId).toBe(serviceId);

    const quiet = await db.channelConsent.findMany({ where: { customerId: optedOut.id }, orderBy: { channel: "asc" } });
    expect(Object.fromEntries(quiet.map((c) => [c.channel, c.status]))).toEqual({ WHATSAPP: "REVOKED", SMS: "GRANTED" });
  });
});
