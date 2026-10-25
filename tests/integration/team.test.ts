import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBusiness, findSignIn } from "@/server/domain/accounts";
import { acceptInvites, changeRole, createInvite, listTeam, removeMember, revokeInvite, viewInvite } from "@/server/domain/team";
import type { Actor } from "@/server/domain/types";
import { hasTestDb, testDb } from "../support/db";

describe.skipIf(!hasTestDb)("team invites", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const tag = randomUUID().slice(0, 8);
  const email = (who: string) => `team-${who}-${tag}@example.com`;
  let owner: Actor & { role: "OWNER" };

  beforeAll(async () => {
    const s = await createBusiness(db, { email: email("owner"), ownerName: "Olivia", businessName: "Team Studio", city: "Panaji", vertical: "salon" });
    owner = { ...s, timezone: "Asia/Kolkata", role: "OWNER" };
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: owner.organizationId } });
    await db.user.deleteMany({ where: { email: { contains: tag } } });
  });

  it("joins a business only after the invited email signs in, and lands in it", async () => {
    const { token } = await createInvite(db, owner, { email: email("riya").toUpperCase(), name: "Riya Naik", role: "STAFF" });
    expect(await viewInvite(db, token)).toMatchObject({ state: "valid", businessName: "Team Studio", email: email("riya"), role: "STAFF" });
    expect(await findSignIn(db, email("riya"))).toBeNull();

    const [joined] = await acceptInvites(db, email("riya"));
    expect(joined).toBe(owner.organizationId);
    expect(await findSignIn(db, email("riya"), joined)).toMatchObject({ session: { organizationId: owner.organizationId } });
    expect(await viewInvite(db, token)).toMatchObject({ state: "used" });
    expect(await acceptInvites(db, email("riya"))).toEqual([]);

    const { members } = await listTeam(db, owner);
    expect(members.map((m) => [m.user.name, m.role])).toEqual([
      ["Olivia", "OWNER"],
      ["Riya Naik", "STAFF"],
    ]);
  });

  it("replaces an older link when someone is invited again, and honours cancel and expiry", async () => {
    const first = await createInvite(db, owner, { email: email("dev"), name: "Dev", role: "ADMIN" });
    const second = await createInvite(db, owner, { email: email("dev"), name: "Dev", role: "ADMIN" });
    expect(await viewInvite(db, first.token)).toEqual({ state: "invalid" });
    await revokeInvite(db, owner, second.invite.id);
    expect(await viewInvite(db, second.token)).toEqual({ state: "invalid" });
    expect(await acceptInvites(db, email("dev"))).toEqual([]);

    const old = await createInvite(db, owner, { email: email("late"), name: "Late", role: "STAFF" }, new Date(Date.now() - 8 * 86_400_000));
    expect(await viewInvite(db, old.token)).toMatchObject({ state: "expired" });
    expect(await acceptInvites(db, email("late"))).toEqual([]);
  });

  it("keeps roles in bounds", async () => {
    await expect(createInvite(db, owner, { email: email("riya"), name: "Riya", role: "STAFF" })).rejects.toMatchObject({ code: "conflict" });
    await expect(createInvite(db, owner, { email: email("x"), name: "X", role: "OWNER" })).rejects.toMatchObject({ code: "forbidden" });

    const { invite } = await createInvite(db, owner, { email: email("ana"), name: "Ana", role: "ADMIN" });
    await acceptInvites(db, email("ana"));
    const { members } = await listTeam(db, owner);
    const ana = members.find((m) => m.user.email === email("ana"))!;
    const riya = members.find((m) => m.user.email === email("riya"))!;
    const ownerRow = members.find((m) => m.role === "OWNER")!;
    const asAdmin = { ...owner, userId: ana.user.id, role: "ADMIN" as const };

    await expect(createInvite(db, asAdmin, { email: email("y"), name: "Y", role: "ADMIN" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(changeRole(db, asAdmin, riya.id, "ADMIN")).rejects.toMatchObject({ code: "forbidden" });
    await expect(removeMember(db, asAdmin, ownerRow.id)).rejects.toMatchObject({ code: "forbidden" });
    await expect(removeMember(db, owner, ownerRow.id)).rejects.toMatchObject({ code: "forbidden" });

    await changeRole(db, owner, riya.id, "ADMIN");
    await removeMember(db, owner, riya.id);
    expect(await findSignIn(db, email("riya"))).toBeNull();
    expect(invite.id).toBeTruthy();
    expect(await db.auditEvent.count({ where: { organizationId: owner.organizationId, action: { startsWith: "member." } } })).toBeGreaterThanOrEqual(8);
  });
});
