import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

/** Attack: keep using a session or phone after the owner revoked it. */
describe.skipIf(!hasTestDb)("attack: replaying revoked access", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let f: Awaited<ReturnType<typeof createFixture>>;

  beforeAll(async () => {
    f = await createFixture(db, "revocation");
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  it("a web session stops working once the user signs out everywhere", async () => {
    const { loadMember } = await import("@/server/auth/dal");
    const ids = { userId: f.actor.userId, organizationId: f.org.id, locationId: f.actor.locationId };
    expect(await loadMember({ ...ids, sessionVersion: 0 }, db)).not.toBeNull();
    await db.user.update({ where: { id: f.actor.userId }, data: { sessionVersion: { increment: 1 } } });
    expect(await loadMember({ ...ids, sessionVersion: 0 }, db)).toBeNull();
    expect(await loadMember({ ...ids, sessionVersion: 1 }, db)).not.toBeNull();
  });

  it("a removed member's session and phone stop working at once", async () => {
    const { loadMember } = await import("@/server/auth/dal");
    const { completePairing, createPairing, resolveDevice } = await import("@/server/domain/devices");
    const staff = await db.user.create({ data: { email: `revoked-${Date.now()}@test.local`, name: "Leaver" } });
    const membership = await db.membership.create({ data: { userId: staff.id, organizationId: f.org.id, role: "STAFF" } });
    const actor = { ...f.actor, userId: staff.id };
    const { code } = await createPairing(db, actor);
    const { token } = await completePairing(db, code, "Leaver's phone");
    const ids = { userId: staff.id, organizationId: f.org.id, locationId: f.actor.locationId };
    expect(await loadMember({ ...ids, sessionVersion: 0 }, db)).not.toBeNull();
    expect(await resolveDevice(db, token)).not.toBeNull();

    await db.membership.delete({ where: { id: membership.id } });
    expect(await loadMember({ ...ids, sessionVersion: 0 }, db)).toBeNull();
    const device = await resolveDevice(db, token);
    expect(device === null || (await loadMember(device, db)) === null).toBe(true);
  });

  it("a pairing code works once, and a revoked phone is refused", async () => {
    const { completePairing, createPairing, resolveDevice, revokeDevice } = await import("@/server/domain/devices");
    const { code } = await createPairing(db, f.actor);
    const { token } = await completePairing(db, code, null);
    await expect(completePairing(db, code, null)).rejects.toMatchObject({ code: "invalid" });
    const device = await resolveDevice(db, token);
    await revokeDevice(db, { userId: f.actor.userId, organizationId: f.org.id }, device!.deviceId);
    expect(await resolveDevice(db, token)).toBeNull();
  });

  it("an expired pairing code is refused", async () => {
    const { completePairing, createPairing } = await import("@/server/domain/devices");
    const { code } = await createPairing(db, f.actor, new Date(Date.now() - 11 * 60_000));
    await expect(completePairing(db, code, null)).rejects.toMatchObject({ code: "invalid" });
  });
});
