import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { zonedToUtc } from "@/lib/time";
import { claimOffer } from "@/server/domain/campaigns";
import { createIntegration, resolveIntegrationKey, revokeIntegration, syncBooking } from "@/server/domain/integrations";
import { processWebhooks, signingSecret, verifyDelivery } from "@/server/integrations/webhooks";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

const BASE = "https://slotback.test";
const SECRET = "server-secret-server-secret-server-secret";
const ist = (date: string, hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return zonedToUtc(date, h * 60 + m, "Asia/Kolkata");
};

describe.skipIf(!hasTestDb)("booking tool connections", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let f: Awaited<ReturnType<typeof createFixture>>;

  beforeAll(async () => {
    f = await createFixture(db, "integration");
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  async function connect(webhookUrl: string | null = null) {
    const { integration, key } = await createIntegration(db, f.actor, { name: "Zapier", webhookUrl, autoRefill: true });
    return { integration, key, resolved: (await resolveIntegrationKey(db, key))! };
  }

  it("stores only a hash of the key and resolves it", async () => {
    const { integration, key, resolved } = await connect();
    expect(key).toMatch(/^sbk_[A-Za-z0-9_-]{43}$/);
    expect(integration.keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(integration.keyHash).not.toContain(key.slice(4));
    expect(resolved.id).toBe(integration.id);
    expect(await resolveIntegrationKey(db, key.slice(0, -1) + (key.endsWith("A") ? "B" : "A"))).toBeNull();
  });

  it("creates, moves and cancels a booking, matched by the tool's own id", async () => {
    const { resolved } = await connect();
    const now = ist("2027-03-01", "09:00");
    const input = {
      externalId: "fresha-123",
      status: "booked" as const,
      startAt: ist("2027-03-01", "15:00"),
      service: "cut",
      customer: { name: "Riya Naik", phone: "98765 43210" },
    };
    const created = await syncBooking(db, resolved, input, { baseUrl: BASE, now });
    expect(created).toMatchObject({ status: "BOOKED", created: true });

    // The same event again changes nothing.
    expect(await syncBooking(db, resolved, input, { baseUrl: BASE, now })).toMatchObject({ appointmentId: created.appointmentId, created: false });
    expect(await db.appointment.count({ where: { integrationId: resolved.id, externalId: "fresha-123" } })).toBe(1);

    // Moved an hour later in the tool.
    await syncBooking(db, resolved, { ...input, startAt: ist("2027-03-01", "16:00") }, { baseUrl: BASE, now });
    const moved = await db.appointment.findUniqueOrThrow({ where: { id: created.appointmentId }, include: { customer: true } });
    expect(moved.startAt.toISOString()).toBe(ist("2027-03-01", "16:00").toISOString());
    expect(moved.customer?.phone).toBe("+91 98765 43210");

    // A booking elsewhere is not consent to be messaged.
    expect(await db.channelConsent.count({ where: { customerId: moved.customerId! } })).toBe(0);

    // Someone on the waitlist who fits.
    const waiting = await db.customer.create({
      data: {
        locationId: f.actor.locationId,
        name: "Waiting Wasim",
        phone: "+91 91111 22222",
        consents: { create: { channel: "WHATSAPP", status: "GRANTED", source: "test" } },
      },
    });
    await db.waitlistEntry.create({ data: { locationId: f.actor.locationId, customerId: waiting.id, serviceId: f.cut.id } });

    const cancelled = await syncBooking(db, resolved, { ...input, status: "cancelled", startAt: ist("2027-03-01", "16:00") }, { baseUrl: BASE, now });
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.campaignId).toBeTruthy();
    const campaign = await db.recoveryCampaign.findUniqueOrThrow({ where: { id: cancelled.campaignId! }, include: { offers: true } });
    expect(campaign.status).toBe("ACTIVE");
    expect(campaign.offers.map((o) => o.customerId)).toEqual([waiting.id]);
  });

  it("explains unknown services and staff instead of guessing", async () => {
    const { resolved } = await connect();
    const base = { externalId: "x-1", status: "booked" as const, startAt: ist("2027-03-02", "15:00") };
    await expect(syncBooking(db, resolved, { ...base, service: "Botox" }, { baseUrl: BASE })).rejects.toThrow(/Unknown service "Botox". Use one of: Cut, Nails/);
    await expect(syncBooking(db, resolved, { ...base, service: "Cut", staff: "Nail tech" }, { baseUrl: BASE })).rejects.toThrow(/doesn't offer Cut/);
    await expect(syncBooking(db, resolved, { ...base, status: "cancelled", service: "Cut" }, { baseUrl: BASE })).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses a booking when the staff member is already busy", async () => {
    const { resolved } = await connect();
    const startAt = ist("2027-03-03", "11:00");
    await syncBooking(db, resolved, { externalId: "busy-1", status: "booked", startAt, service: "Cut" }, { baseUrl: BASE });
    await expect(syncBooking(db, resolved, { externalId: "busy-2", status: "booked", startAt, service: "Cut" }, { baseUrl: BASE })).rejects.toMatchObject({
      code: "conflict",
    });
  });

  it("a revoked key stops working at once", async () => {
    const { integration, key } = await connect();
    await revokeIntegration(db, f.actor, integration.id);
    expect(await resolveIntegrationKey(db, key)).toBeNull();
  });

  it("sends a signed webhook when a slot is refilled, and retries failures", async () => {
    const { resolved, integration } = await connect("https://hooks.example.com/slotback");
    const now = ist("2027-03-04", "09:00");
    const input = { externalId: "hook-1", status: "booked" as const, startAt: ist("2027-03-04", "15:00"), service: "Cut" };
    await syncBooking(db, resolved, input, { baseUrl: BASE, now });
    const fan = await db.customer.create({
      data: { locationId: f.actor.locationId, name: "Hook Fan", phone: "+91 93333 44444", consents: { create: { channel: "SMS", status: "GRANTED", source: "test" } } },
    });
    await db.waitlistEntry.updateMany({ where: { locationId: f.actor.locationId, status: "ACTIVE" }, data: { status: "REMOVED" } });
    await db.waitlistEntry.create({ data: { locationId: f.actor.locationId, customerId: fan.id, serviceId: null } });
    const { campaignId } = await syncBooking(db, resolved, { ...input, status: "cancelled" }, { baseUrl: BASE, now });

    const msg = await db.outboxMessage.findFirstOrThrow({ where: { offer: { campaignId } } });
    const token = msg.body.match(/\/c\/([A-Za-z0-9_-]{43})/)![1];
    expect(await claimOffer(db, token, { now: new Date(now.getTime() + 60_000) })).toBe("claimed");

    const sent: { url: string; body: string; headers: Record<string, string> }[] = [];
    let fail = true;
    const post = async (url: string, body: string, headers: Record<string, string>) => {
      sent.push({ url, body, headers });
      return { status: fail ? 500 : 200, body: "" };
    };
    const t1 = new Date(now.getTime() + 2 * 60_000);
    expect(await processWebhooks(db, SECRET, t1, 25, post)).toMatchObject({ attempted: 1, delivered: 0 });
    const queued = await db.webhookDelivery.findFirstOrThrow({ where: { integrationId: integration.id } });
    expect(queued).toMatchObject({ status: "QUEUED", attempts: 1, lastError: "HTTP 500" });

    fail = false;
    expect(await processWebhooks(db, SECRET, new Date(t1.getTime() + 2 * 60_000), 25, post)).toMatchObject({ delivered: 1 });
    const last = sent.at(-1)!;
    expect(last.url).toBe("https://hooks.example.com/slotback");
    const body = JSON.parse(last.body);
    expect(body).toMatchObject({ event: "slot.claimed", data: { appointment: { service: "Cut", customer: { name: "Hook Fan" } }, replaces: { externalId: "hook-1" } } });
    const secret = signingSecret(integration.id, SECRET);
    const ts = last.headers["x-slotback-timestamp"];
    const at = Number(ts) * 1000;
    expect(verifyDelivery(secret, ts, last.body, last.headers["x-slotback-signature"], at)).toBe(true);
    // Tampered body, wrong secret, or a replay ten minutes later all fail.
    expect(verifyDelivery(secret, ts, last.body.replace("Hook Fan", "Evil"), last.headers["x-slotback-signature"], at)).toBe(false);
    expect(verifyDelivery(signingSecret("other", SECRET), ts, last.body, last.headers["x-slotback-signature"], at)).toBe(false);
    expect(verifyDelivery(secret, ts, last.body, last.headers["x-slotback-signature"], at + 10 * 60_000)).toBe(false);
  });
});
