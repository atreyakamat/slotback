import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Channel } from "@/generated/prisma/client";
import { zonedToUtc } from "@/lib/time";
import { changeAppointmentStatus, createAppointment } from "@/server/domain/appointments";
import { claimOffer, expireDue, openCampaign, previewCampaign, sendRound, stopCampaign, viewOffer } from "@/server/domain/campaigns";
import { setConsent } from "@/server/domain/waitlist";
import { processOutbox } from "@/server/messaging/outbox";
import { ProviderError } from "@/server/messaging/provider";
import { registerProvider } from "@/server/messaging/registry";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

const TZ = "Asia/Kolkata";
const BASE = "https://slotback.test";
const ist = (date: string, hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return zonedToUtc(date, h * 60 + m, TZ);
};

describe.skipIf(!hasTestDb)("cancellation recovery", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let f: Awaited<ReturnType<typeof createFixture>>;
  let day = 0;

  beforeAll(async () => {
    f = await createFixture(db, "recovery");
    await db.location.update({
      where: { id: f.actor.locationId },
      data: { minLeadMinutes: 60, offerTtlMinutes: 30, offerBatchSize: 5, quietHoursStart: "21:00", quietHoursEnd: "09:00" },
    });
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  /** A fresh date per test so slots never collide. */
  function nextDate() {
    day++;
    return new Date(Date.UTC(2027, 1, day)).toISOString().slice(0, 10);
  }

  let phoneSeq = 1000;
  async function waitlisted(name: string, opts: { channels?: Channel[]; serviceId?: string | null; email?: string } = {}) {
    phoneSeq++;
    const customer = await db.customer.create({
      data: {
        locationId: f.actor.locationId,
        name,
        phone: `+91 90000 ${String(phoneSeq).padStart(5, "0")}`,
        email: opts.email ?? null,
        consents: { create: (opts.channels ?? ["WHATSAPP"]).map((channel) => ({ channel, status: "GRANTED" as const, source: "test" })) },
      },
    });
    await db.waitlistEntry.create({
      data: {
        locationId: f.actor.locationId,
        customerId: customer.id,
        serviceId: opts.serviceId === undefined ? f.cut.id : opts.serviceId,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, phoneSeq)),
      },
    });
    return customer;
  }

  /** Books and cancels a 60-minute cut at `hm` on `date`, then opens a campaign. */
  async function cancelledSlot(date: string, hm: string, now: Date) {
    const appt = await createAppointment(db, f.actor, {
      customerId: f.customer.id,
      serviceId: f.cut.id,
      resourceId: f.stylist.id,
      startAt: ist(date, hm),
    });
    await changeAppointmentStatus(db, f.actor, { appointmentId: appt.id, to: "CANCELLED" });
    return openCampaign(db, f.actor, appt.id, now);
  }

  async function tokensFor(campaignId: string) {
    const msgs = await db.outboxMessage.findMany({ where: { offer: { campaignId } }, include: { offer: true } });
    return msgs.map((m) => ({ customerId: m.offer!.customerId, token: m.body.match(/\/c\/([A-Za-z0-9_-]{43})/)![1] }));
  }

  async function clearWaitlist() {
    await db.waitlistEntry.updateMany({ where: { locationId: f.actor.locationId, status: "ACTIVE" }, data: { status: "REMOVED" } });
  }

  it("ranks the audience, sends one round, and lets exactly one customer win under concurrent claims", async () => {
    await clearWaitlist();
    const date = nextDate();
    const now = ist(date, "12:00");
    const b = await waitlisted("Bina Exact");
    const c = await waitlisted("Chetan Any", { serviceId: null, channels: ["SMS"] });
    const d = await waitlisted("Dev NoConsent", { channels: [] });
    const e = await waitlisted("Esha Busy");
    await createAppointment(db, f.actor, { customerId: e.id, serviceId: f.nails.id, resourceId: f.nailTech.id, startAt: ist(date, "15:30") });

    const campaign = await cancelledSlot(date, "15:00", now);
    expect(campaign.expiresAt!.toISOString()).toBe(ist(date, "14:00").toISOString());

    const preview = await previewCampaign(db, f.actor, campaign.id, { baseUrl: BASE, now });
    const byId = new Map(preview.evaluated.map((x) => [x.candidate.customerId, x]));
    expect(byId.get(b.id)).toMatchObject({ eligible: true, rank: 1, channel: "WHATSAPP" });
    expect(byId.get(c.id)).toMatchObject({ eligible: true, rank: 2, channel: "SMS" });
    expect(byId.get(d.id)).toMatchObject({ eligible: false, reason: "no_consent" });
    expect(byId.get(e.id)).toMatchObject({ eligible: false, reason: "busy" });
    expect(byId.get(f.customer.id)).toBeUndefined(); // not on the waitlist
    expect(preview.message).toContain("Reply STOP to opt out");

    const round = await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now });
    expect(round.offers).toBe(2);
    expect(round.expiresAt.toISOString()).toBe(ist(date, "12:30").toISOString());

    const run = await processOutbox(db, now);
    expect(run.sent).toBeGreaterThanOrEqual(2);
    const offers = await db.offer.findMany({ where: { campaignId: campaign.id } });
    expect(offers.every((o) => o.status === "DELIVERED")).toBe(true);

    const tokens = await tokensFor(campaign.id);
    expect(await viewOffer(db, tokens[0].token, now)).toMatchObject({ state: "available", serviceName: "Cut" });

    // Both customers tap repeatedly at the same moment.
    const attempts = tokens.flatMap((t) => Array.from({ length: 6 }, () => claimOffer(db, t.token, { now })));
    const results = await Promise.all(attempts);
    expect(results.filter((r) => r === "claimed")).toHaveLength(1);
    expect(results.every((r) => ["claimed", "claimed_by_you", "taken"].includes(r))).toBe(true);

    const booked = await db.appointment.findMany({
      where: { resourceId: f.stylist.id, startAt: ist(date, "15:00"), status: { not: "CANCELLED" } },
    });
    expect(booked).toHaveLength(1);
    expect(booked[0].source).toBe("RECOVERY");
    expect(await db.claim.count({ where: { campaignId: campaign.id } })).toBe(1);

    const winner = await db.claim.findUniqueOrThrow({ where: { campaignId: campaign.id }, include: { offer: true } });
    const loser = tokens.find((t) => t.customerId !== winner.offer.customerId)!;
    const winnerToken = tokens.find((t) => t.customerId === winner.offer.customerId)!;
    expect(await claimOffer(db, winnerToken.token, { now })).toBe("claimed_by_you");
    expect(await claimOffer(db, loser.token, { now })).toBe("taken");
    expect((await viewOffer(db, loser.token, now)).state).toBe("taken");

    const campaignAfter = await db.recoveryCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(campaignAfter.status).toBe("CLAIMED");
    const entry = await db.waitlistEntry.findFirstOrThrow({ where: { customerId: winner.offer.customerId } });
    expect(entry.status).toBe("FULFILLED");
    // A confirmation is queued for the winner.
    expect(await db.outboxMessage.count({ where: { idempotencyKey: `claim-confirmation:${winner.offerId}` } })).toBe(1);
  });

  it("holds when twenty customers claim the same opening at once", async () => {
    await clearWaitlist();
    await db.location.update({ where: { id: f.actor.locationId }, data: { offerBatchSize: 20 } });
    const date = nextDate();
    const now = ist(date, "11:00");
    for (let i = 0; i < 20; i++) await waitlisted(`Crowd ${i}`);
    const campaign = await cancelledSlot(date, "16:00", now);
    const round = await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now });
    expect(round.offers).toBe(20);
    await processOutbox(db, now, 50);

    const tokens = await tokensFor(campaign.id);
    const results = await Promise.all(tokens.map((t) => claimOffer(db, t.token, { now })));
    expect(results.filter((r) => r === "claimed")).toHaveLength(1);
    expect(results.filter((r) => r === "taken")).toHaveLength(19);
    expect(await db.appointment.count({ where: { resourceId: f.stylist.id, startAt: ist(date, "16:00"), status: "BOOKED" } })).toBe(1);
    await db.location.update({ where: { id: f.actor.locationId }, data: { offerBatchSize: 5 } });
  });

  it("refuses expired offers and explains why", async () => {
    await clearWaitlist();
    const date = nextDate();
    const now = ist(date, "12:00");
    await waitlisted("Late Lata");
    const campaign = await cancelledSlot(date, "18:00", now);
    await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now });
    await processOutbox(db, now);
    const [t] = await tokensFor(campaign.id);

    const later = ist(date, "12:45"); // offer TTL is 30 minutes
    expect((await viewOffer(db, t.token, later)).state).toBe("expired");
    expect(await claimOffer(db, t.token, { now: later })).toBe("expired");

    const pastCutoff = ist(date, "17:01"); // campaign closes 60 minutes before the slot
    expect(await expireDue(db, pastCutoff)).toMatchObject({ campaignsExpired: 1 });
    expect((await db.recoveryCampaign.findUniqueOrThrow({ where: { id: campaign.id } })).status).toBe("EXPIRED");
  });

  it("closes the campaign when staff fill the slot by hand", async () => {
    await clearWaitlist();
    const date = nextDate();
    const now = ist(date, "12:00");
    await waitlisted("Manual Mina");
    const campaign = await cancelledSlot(date, "17:00", now);
    await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now });
    await processOutbox(db, now);
    const [t] = await tokensFor(campaign.id);

    await createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: ist(date, "17:00") });
    expect((await db.recoveryCampaign.findUniqueOrThrow({ where: { id: campaign.id } })).status).toBe("CANCELLED");
    expect(await claimOffer(db, t.token, { now })).toBe("expired");
  });

  it("honours opt-outs immediately", async () => {
    await clearWaitlist();
    const date = nextDate();
    const now = ist(date, "12:00");
    const optOut = await waitlisted("Opt Out Omar");
    await setConsent(db, { ...f.actor }, { customerId: optOut.id, channel: "WHATSAPP", granted: false, source: "replied STOP" });
    const campaign = await cancelledSlot(date, "15:00", now);
    const preview = await previewCampaign(db, f.actor, campaign.id, { baseUrl: BASE, now });
    expect(preview.evaluated.find((e) => e.candidate.customerId === optOut.id)).toMatchObject({ eligible: false, reason: "no_consent" });
    await expect(sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now })).rejects.toThrow(/No matching customers/);
  });

  it("suppresses an outstanding offer when the customer opts out after it was sent", async () => {
    await clearWaitlist();
    const date = nextDate();
    const now = ist(date, "12:00");
    const cust = await waitlisted("Change Mind");
    const campaign = await cancelledSlot(date, "15:00", now);
    await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now });
    await processOutbox(db, now);
    const [t] = await tokensFor(campaign.id);
    await setConsent(db, { ...f.actor }, { customerId: cust.id, channel: "WHATSAPP", granted: false, source: "replied STOP" });
    expect(await claimOffer(db, t.token, { now })).toBe("expired");
  });

  it("holds messages during quiet hours and refuses slots too close to start", async () => {
    await clearWaitlist();
    const date = nextDate();
    await waitlisted("Night Nisha");
    const late = ist(date, "22:00");
    const nextDay = new Date(Date.UTC(2027, 1, day + 1)).toISOString().slice(0, 10);
    day++;
    const campaign = await cancelledSlot(nextDay, "15:00", late);
    const round = await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now: late });
    expect(round.sendAt.toISOString()).toBe(ist(nextDay, "09:00").toISOString());
    const msg = await db.outboxMessage.findFirstOrThrow({ where: { offer: { campaignId: campaign.id } } });
    expect(msg.nextAttemptAt.toISOString()).toBe(ist(nextDay, "09:00").toISOString());

    const soonDate = nextDate();
    const noon = ist(soonDate, "12:30");
    const soon = await cancelledSlot(soonDate, "13:00", noon); // needs 60 minutes' notice
    await expect(sendRound(db, f.actor, soon.id, { baseUrl: BASE, now: noon })).rejects.toThrow(/too close/);
  });

  it("lets staff stop a campaign, which kills outstanding links", async () => {
    await clearWaitlist();
    const date = nextDate();
    const now = ist(date, "12:00");
    await waitlisted("Stopped Sana");
    const campaign = await cancelledSlot(date, "15:00", now);
    await sendRound(db, f.actor, campaign.id, { baseUrl: BASE, now });
    await processOutbox(db, now);
    const [t] = await tokensFor(campaign.id);
    await stopCampaign(db, f.actor, campaign.id);
    expect(await claimOffer(db, t.token, { now })).toBe("expired");
  });

  it("rejects malformed and unknown tokens without touching the database", async () => {
    expect(await claimOffer(db, "not-a-token")).toBe("invalid");
    expect((await viewOffer(db, "A".repeat(43))).state).toBe("invalid");
  });

  it("retries transient provider failures with backoff, then marks the message failed", async () => {
    let calls = 0;
    registerProvider({
      name: "flaky-test",
      keepsBodies: false,
      async send() {
        calls++;
        throw new ProviderError("provider_timeout", true);
      },
    });
    const now = new Date("2027-06-01T06:00:00Z");
    const msg = await db.outboxMessage.create({
      data: {
        locationId: f.actor.locationId,
        channel: "SMS",
        provider: "flaky-test",
        toAddress: "+91 90000 00001",
        body: "hello",
        nextAttemptAt: now,
        idempotencyKey: `flaky-${Date.now()}`,
      },
    });
    let t = now;
    for (let i = 1; i <= 5; i++) {
      await processOutbox(db, t);
      const row = await db.outboxMessage.findUniqueOrThrow({ where: { id: msg.id } });
      expect(row.attempts).toBe(i);
      if (i < 5) {
        expect(row.status).toBe("QUEUED");
        expect(row.nextAttemptAt.getTime() - t.getTime()).toBe(60_000 * 2 ** (i - 1));
        t = row.nextAttemptAt;
      } else {
        expect(row.status).toBe("FAILED");
        expect(row.errorCode).toBe("provider_timeout");
      }
    }
    expect(calls).toBe(5);
  });
});
