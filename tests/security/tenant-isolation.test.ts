import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { zonedToUtc } from "@/lib/time";
import { changeAppointmentStatus, createAppointment, rescheduleAppointment } from "@/server/domain/appointments";
import { openCampaign, previewCampaign, sendRound, stopCampaign } from "@/server/domain/campaigns";
import { saveResource, saveService, setResourceActive, setServiceActive } from "@/server/domain/catalogue";
import { createPairing, listDevices, revokeDevice } from "@/server/domain/devices";
import { changeRole, createInvite, removeMember, revokeInvite } from "@/server/domain/team";
import { addToWaitlist, removeFromWaitlist, setConsent } from "@/server/domain/waitlist";
import { retryMessage } from "@/server/messaging/outbox";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

const BASE = "https://slotback.test";

/**
 * Attack: a signed-in member of business B replays ids that belong to business A.
 * Every call must fail as "not found" (never "forbidden", which would confirm the id exists)
 * and A's data must be unchanged afterwards.
 */
describe.skipIf(!hasTestDb)("attack: cross-tenant id replay", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let a: Awaited<ReturnType<typeof createFixture>>;
  let b: Awaited<ReturnType<typeof createFixture>>;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    a = await createFixture(db, "victim");
    b = await createFixture(db, "attacker");
    const startAt = zonedToUtc("2027-06-01", 15 * 60, "Asia/Kolkata");
    const booked = await createAppointment(db, a.actor, { customerId: a.customer.id, serviceId: a.cut.id, resourceId: a.stylist.id, startAt });
    const cancelled = await createAppointment(db, a.actor, {
      customerId: a.customer.id,
      serviceId: a.cut.id,
      resourceId: a.stylist.id,
      startAt: zonedToUtc("2027-06-01", 17 * 60, "Asia/Kolkata"),
    });
    await changeAppointmentStatus(db, a.actor, { appointmentId: cancelled.id, to: "CANCELLED" });
    const campaign = await openCampaign(db, a.actor, cancelled.id, zonedToUtc("2027-06-01", 11 * 60, "Asia/Kolkata"));
    const entry = await addToWaitlist(db, a.actor, {
      customerId: a.customer.id,
      serviceId: null,
      preferredDays: [1],
      earliestMinute: 600,
      latestMinute: 1200,
      notes: null,
      expiresAt: null,
    });
    const staff = await db.user.create({ data: { email: `victim-staff-${Date.now()}@test.local`, name: "Victim staff" } });
    const membership = await db.membership.create({ data: { userId: staff.id, organizationId: a.org.id, role: "STAFF" } });
    const invite = await createInvite(db, { ...a.actor, role: "OWNER" }, { email: `victim-invite-${Date.now()}@test.local`, name: "Invitee", role: "STAFF" });
    await createPairing(db, a.actor);
    const device = await db.deviceSession.create({
      data: { userId: a.actor.userId, organizationId: a.org.id, locationId: a.actor.locationId, tokenHash: randomBytes(32).toString("hex"), pairedAt: new Date() },
    });
    const message = await db.outboxMessage.create({
      data: {
        locationId: a.actor.locationId,
        channel: "SMS",
        provider: "demo",
        toAddress: "+910000000000",
        body: "x",
        status: "FAILED",
        nextAttemptAt: new Date(),
        idempotencyKey: `victim-${Date.now()}`,
      },
    });
    Object.assign(ids, {
      booked: booked.id,
      cancelled: cancelled.id,
      campaign: campaign.id,
      entry: entry.id,
      membership: membership.id,
      invite: invite.invite.id,
      device: device.id,
      message: message.id,
    });
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  const notFound = { code: "not_found" };

  it("cannot read or change another business's appointments", async () => {
    const startAt = zonedToUtc("2027-06-02", 15 * 60, "Asia/Kolkata");
    await expect(changeAppointmentStatus(db, b.actor, { appointmentId: ids.booked, to: "CANCELLED" })).rejects.toMatchObject(notFound);
    await expect(rescheduleAppointment(db, b.actor, { appointmentId: ids.booked, resourceId: b.stylist.id, startAt })).rejects.toMatchObject(notFound);
    // Booking into A's calendar with A's service, staff or customer.
    await expect(createAppointment(db, b.actor, { customerId: null, serviceId: a.cut.id, resourceId: b.stylist.id, startAt })).rejects.toMatchObject(notFound);
    await expect(createAppointment(db, b.actor, { customerId: null, serviceId: b.cut.id, resourceId: a.stylist.id, startAt })).rejects.toMatchObject(notFound);
    await expect(createAppointment(db, b.actor, { customerId: a.customer.id, serviceId: b.cut.id, resourceId: b.stylist.id, startAt })).rejects.toMatchObject(notFound);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: ids.booked } })).status).toBe("BOOKED");
  });

  it("cannot open, preview, send or stop another business's refills", async () => {
    await expect(openCampaign(db, b.actor, ids.cancelled)).rejects.toMatchObject(notFound);
    await expect(previewCampaign(db, b.actor, ids.campaign, { baseUrl: BASE })).rejects.toMatchObject(notFound);
    await expect(sendRound(db, b.actor, ids.campaign, { baseUrl: BASE })).rejects.toMatchObject(notFound);
    await expect(stopCampaign(db, b.actor, ids.campaign)).rejects.toMatchObject(notFound);
    const c = await db.recoveryCampaign.findUniqueOrThrow({ where: { id: ids.campaign } });
    expect(c.status).toBe("DRAFT");
    expect(await db.offer.count({ where: { campaignId: ids.campaign } })).toBe(0);
  });

  it("cannot touch another business's catalogue", async () => {
    await expect(saveService(db, b.actor, { id: a.cut.id, name: "Hijacked", durationMinutes: 5, pricePaise: 1, resourceIds: [] })).rejects.toMatchObject(notFound);
    // Linking A's staff into B's own service would leak A's staff into B's booking screens.
    await expect(saveService(db, b.actor, { name: "Mine", durationMinutes: 30, pricePaise: 100, resourceIds: [a.stylist.id] })).rejects.toMatchObject(notFound);
    await expect(saveResource(db, b.actor, { id: a.stylist.id, name: "Hijacked", serviceIds: [] })).rejects.toMatchObject(notFound);
    await expect(saveResource(db, b.actor, { name: "Mine", serviceIds: [a.cut.id] })).rejects.toMatchObject(notFound);
    await expect(setServiceActive(db, b.actor, a.cut.id, false)).rejects.toMatchObject(notFound);
    await expect(setResourceActive(db, b.actor, a.nailTech.id, false)).rejects.toMatchObject(notFound);
    expect(await db.service.findUniqueOrThrow({ where: { id: a.cut.id } })).toMatchObject({ name: "Cut", active: true });
    expect(await db.resource.findUniqueOrThrow({ where: { id: a.nailTech.id } })).toMatchObject({ name: "Nail tech", active: true });
  });

  it("cannot read or change another business's clients, waitlist or consent", async () => {
    await expect(
      addToWaitlist(db, b.actor, { customerId: a.customer.id, serviceId: null, preferredDays: [1], earliestMinute: 600, latestMinute: 1200, notes: null, expiresAt: null }),
    ).rejects.toMatchObject(notFound);
    await expect(
      addToWaitlist(db, b.actor, { customerId: b.customer.id, serviceId: a.cut.id, preferredDays: [1], earliestMinute: 600, latestMinute: 1200, notes: null, expiresAt: null }),
    ).rejects.toMatchObject(notFound);
    await expect(removeFromWaitlist(db, b.actor, ids.entry)).rejects.toMatchObject(notFound);
    await expect(setConsent(db, b.actor, { customerId: a.customer.id, channel: "WHATSAPP", granted: true, source: "attack" })).rejects.toMatchObject(notFound);
    expect((await db.waitlistEntry.findUniqueOrThrow({ where: { id: ids.entry } })).status).toBe("ACTIVE");
    expect(await db.channelConsent.count({ where: { customerId: a.customer.id } })).toBe(0);
  });

  it("cannot manage another business's team, invites or phones", async () => {
    const owner = { ...b.actor, role: "OWNER" as const };
    await expect(changeRole(db, owner, ids.membership, "ADMIN")).rejects.toMatchObject(notFound);
    await expect(removeMember(db, owner, ids.membership)).rejects.toMatchObject(notFound);
    await expect(revokeInvite(db, owner, ids.invite)).rejects.toMatchObject(notFound);
    await expect(revokeDevice(db, { userId: b.actor.userId, organizationId: b.org.id }, ids.device)).rejects.toMatchObject(notFound);
    expect((await listDevices(db, b.actor)).map((d) => d.id)).not.toContain(ids.device);
    expect((await db.membership.findUniqueOrThrow({ where: { id: ids.membership } })).role).toBe("STAFF");
    expect((await db.deviceSession.findUniqueOrThrow({ where: { id: ids.device } })).revokedAt).toBeNull();
  });

  it("cannot retry another business's messages", async () => {
    expect(await retryMessage(db, b.actor.locationId, ids.message)).toBe(false);
    expect((await db.outboxMessage.findUniqueOrThrow({ where: { id: ids.message } })).status).toBe("FAILED");
  });
});

/** Attack: a staff member tries owner-only team operations, or to raise their own access. */
describe.skipIf(!hasTestDb)("attack: privilege escalation inside a business", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let f: Awaited<ReturnType<typeof createFixture>>;

  beforeAll(async () => {
    f = await createFixture(db, "escalation");
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  it("staff can't invite, promote themselves, or demote the owner", async () => {
    const staffUser = await db.user.create({ data: { email: `esc-staff-${Date.now()}@test.local`, name: "Staff" } });
    const admin = await db.user.create({ data: { email: `esc-admin-${Date.now()}@test.local`, name: "Admin" } });
    const staffM = await db.membership.create({ data: { userId: staffUser.id, organizationId: f.org.id, role: "STAFF" } });
    const adminM = await db.membership.create({ data: { userId: admin.id, organizationId: f.org.id, role: "ADMIN" } });
    const ownerM = await db.membership.findFirstOrThrow({ where: { organizationId: f.org.id, role: "OWNER" } });
    const asStaff = { ...f.actor, userId: staffUser.id, role: "STAFF" as const };
    const asAdmin = { ...f.actor, userId: admin.id, role: "ADMIN" as const };

    await expect(createInvite(db, asStaff, { email: "x@test.local", name: "X", role: "STAFF" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(changeRole(db, asStaff, staffM.id, "ADMIN")).rejects.toMatchObject({ code: "forbidden" });
    await expect(createInvite(db, asAdmin, { email: "y@test.local", name: "Y", role: "ADMIN" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(createInvite(db, asAdmin, { email: "z@test.local", name: "Z", role: "OWNER" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(changeRole(db, asAdmin, adminM.id, "OWNER")).rejects.toMatchObject({ code: "forbidden" });
    await expect(changeRole(db, asAdmin, ownerM.id, "STAFF")).rejects.toMatchObject({ code: "forbidden" });
    await expect(removeMember(db, asAdmin, ownerM.id)).rejects.toMatchObject({ code: "forbidden" });
    expect((await db.membership.findUniqueOrThrow({ where: { id: ownerM.id } })).role).toBe("OWNER");
    expect((await db.membership.findUniqueOrThrow({ where: { id: staffM.id } })).role).toBe("STAFF");
  });
});
