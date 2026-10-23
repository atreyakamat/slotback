import { afterAll, describe, expect, it } from "vitest";
import { clientIp } from "@/server/security/client-ip";
import { consume, pruneRateLimits } from "@/server/security/rate-limit";
import { hasTestDb, testDb } from "../support/db";

describe("attack: spoofing the client IP to dodge rate limits", () => {
  it("ignores X-Forwarded-For and other client-supplied headers", () => {
    const spoofed = new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8", forwarded: "for=9.9.9.9", "cf-connecting-ip": "8.8.8.8" });
    expect(clientIp(spoofed)).toBeNull();
  });

  it("uses the address Netlify's edge records, and rejects junk in it", () => {
    expect(clientIp(new Headers({ "x-nf-client-connection-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-nf-client-connection-ip": "x".repeat(500) }))).toBeNull();
  });
});

describe.skipIf(!hasTestDb)("attack: brute force and request floods", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const key = `test:flood:${Date.now()}`;

  afterAll(async () => {
    await db.rateLimitHit.deleteMany({ where: { key: { startsWith: "test:" } } });
    await db.$disconnect();
  });

  it("holds the limit under a parallel burst", async () => {
    const results = await Promise.all(Array.from({ length: 25 }, () => consume(db, key, { limit: 10, windowMs: 60_000 })));
    expect(results.filter(Boolean)).toHaveLength(10);
    expect(await consume(db, key, { limit: 10, windowMs: 60_000 })).toBe(false);
  });

  it("lets the budget refill after the window", async () => {
    const later = new Date(Date.now() + 61_000);
    expect(await consume(db, key, { limit: 10, windowMs: 60_000 }, later)).toBe(true);
  });

  it("prunes old hits so the table can't grow forever", async () => {
    const old = `test:old:${Date.now()}`;
    await db.rateLimitHit.create({ data: { key: old, createdAt: new Date(Date.now() - 2 * 86_400_000) } });
    expect(await pruneRateLimits(db)).toBeGreaterThanOrEqual(1);
    expect(await db.rateLimitHit.count({ where: { key: old } })).toBe(0);
  });
});

describe.skipIf(!hasTestDb)("attack: reading the database directly", () => {
  const db = hasTestDb ? testDb() : (null as never);
  afterAll(async () => {
    await db.$disconnect();
  });

  it("every table has row-level security on, so Supabase's public API exposes nothing", async () => {
    const open = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity ORDER BY tablename`;
    expect(open.map((t) => t.tablename), "add ENABLE ROW LEVEL SECURITY to the migration that creates these tables").toEqual([]);
  });

  it("secrets are stored only as hashes", async () => {
    // Claim links, device tokens, pairing codes and invites are 43-character random tokens.
    // Their columns must hold 64-character SHA-256 hex digests, never the tokens themselves.
    const rows = await db.$queryRaw<{ value: string }[]>`
      SELECT token_hash AS value FROM offers
      UNION ALL SELECT token_hash FROM invites
      UNION ALL SELECT token_hash FROM device_sessions WHERE token_hash IS NOT NULL
      UNION ALL SELECT pair_hash FROM device_sessions WHERE pair_hash IS NOT NULL`;
    const bad = rows.filter((r) => !/^[0-9a-f]{64}$/.test(r.value));
    expect(bad).toEqual([]);
  });
});

