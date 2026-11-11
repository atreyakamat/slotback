import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBusiness } from "@/server/domain/accounts";
import { completePairing, createPairing, listDevices, resolveDevice, revokeDevice } from "@/server/domain/devices";
import { acceptInvites, createInvite, listTeam, removeMember } from "@/server/domain/team";
import type { Actor } from "@/server/domain/types";
import { hasTestDb, testDb } from "../support/db";

describe.skipIf(!hasTestDb)("phone app pairing", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const tag = randomUUID().slice(0, 8);
  let owner: Actor;

  beforeAll(async () => {
    const s = await createBusiness(db, { email: `dev-owner-${tag}@example.com`, ownerName: "Olivia", businessName: "Phone Studio", city: "", vertical: "salon" });
    owner = { ...s, timezone: "Asia/Kolkata" };
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: owner.organizationId } });
    await db.user.deleteMany({ where: { email: { contains: tag } } });
  });

  it("swaps a one-time code for a device token that signs in as the member", async () => {
    const { code } = await createPairing(db, owner);
    const { token } = await completePairing(db, code, "Olivia's Pixel");
    await expect(completePairing(db, code, "Thief")).rejects.toMatchObject({ code: "invalid" });
    expect(await resolveDevice(db, token)).toMatchObject({ userId: owner.userId, organizationId: owner.organizationId, locationId: owner.locationId });
    expect(await resolveDevice(db, "x".repeat(43))).toBeNull();

    const [device] = await listDevices(db, owner);
    expect(device.deviceName).toBe("Olivia's Pixel");
    await revokeDevice(db, owner, device.id);
    expect(await resolveDevice(db, token)).toBeNull();
  });

  it("refuses expired codes", async () => {
    const { code } = await createPairing(db, owner, new Date(Date.now() - 11 * 60_000));
    await expect(completePairing(db, code, null)).rejects.toMatchObject({ code: "invalid" });
  });

  it("signs out a removed team member's phone", async () => {
    await createInvite(db, { ...owner, role: "OWNER" }, { email: `dev-staff-${tag}@example.com`, name: "Sam", role: "STAFF" });
    await acceptInvites(db, `dev-staff-${tag}@example.com`);
    const { members } = await listTeam(db, owner);
    const sam = members.find((m) => m.user.name === "Sam")!;
    const { code } = await createPairing(db, { ...owner, userId: sam.user.id });
    const { token } = await completePairing(db, code, "Sam's phone");
    expect(await resolveDevice(db, token)).not.toBeNull();
    await removeMember(db, { ...owner, role: "OWNER" }, sam.id);
    expect(await resolveDevice(db, token)).toBeNull();
  });
});
