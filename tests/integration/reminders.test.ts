import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bookOnline,
  cancelAppointment,
  confirmAppointment,
  hashToken,
  MAX_OPEN_ONLINE_BOOKINGS,
  repeatNoShows,
  stopWhatsAppReminders,
} from "@/server/appointments/core";
import { changeAppointmentStatus, rescheduleAppointment } from "@/server/domain/appointments";
import type { Actor } from "@/server/domain/types";
import { processOutbox } from "@/server/messaging/outbox";
import { ProviderError } from "@/server/messaging/provider";
import { registerProvider } from "@/server/messaging/registry";
import { setConsent } from "@/server/domain/waitlist";
import { zonedToUtc } from "@/lib/time";
import { hasTestDb, testDb } from "../support/db";

const IST = "Asia/Kolkata";
const ORG = "Reminder Test Clinic";
const SLUG = "reminder-test-clinic";
const BASE = "https://slotback.test";
const at = (date: string, hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return zonedToUtc(date, h * 60 + m, IST);
};
// Monday 9 Nov 2026, 10:00 in Goa.
const NOW = at("2026-11-09", "10:00");

describe.skipIf(!hasTestDb)("online booking and reminders", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let locationId: string;
  let serviceId: string;
  let resourceId: string;
  let staff: Actor;
  let phoneSeq = 0;
  const phone = () => `98000 ${String(10000 + ++phoneSeq).slice(-5)}`;

  const book = (startAt: Date, overrides: Partial<Parameters<typeof bookOnline>[1]> = {}, now = NOW) =>
    bookOnline(db, { slug: SLUG, serviceId, startAt, name: "Test Patient", phone: phone(), whatsappConsent: true, ...overrides }, { now, baseUrl: BASE });

  beforeAll(async () => {
    await db.organization.deleteMany({ where: { name: ORG } });
    const hours = Object.fromEntries([1, 2, 3, 4, 5, 6].map((d) => [String(d), [{ open: "10:00", close: "20:00" }]]));
    const org = await db.organization.create({
      data: {
        name: ORG,
        locations: {
          create: { name: "Test Dental", businessHours: hours, bookingSlug: SLUG, bookingEnabled: true, minLeadMinutes: 60 },
        },
      },
      include: { locations: true },
    });
    locationId = org.locations[0].id;
    staff = { userId: "test-staff", organizationId: org.id, locationId, timezone: IST };
    const service = await db.service.create({ data: { locationId, name: "Check-up", durationMinutes: 30, pricePaise: 50000 } });
    serviceId = service.id;
    resourceId = (await db.resource.create({ data: { locationId, name: "Dr. Test", services: { connect: { id: serviceId } } } })).id;
  });

  beforeEach(async () => {
    await db.recoveryCampaign.deleteMany({ where: { locationId } });
    await db.appointment.deleteMany({ where: { locationId } });
    await db.outboxMessage.deleteMany({ where: { locationId } });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { name: ORG } });
    await db.$disconnect();
  });

  it("books a free slot and queues a confirmation plus 24h and 2h reminders", async () => {
    const result = await book(at("2026-11-11", "15:00"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const appt = await db.appointment.findUniqueOrThrow({ where: { id: result.appointmentId } });
    expect(appt).toMatchObject({ status: "BOOKED", source: "ONLINE", manageTokenHash: hashToken(result.token) });

    const messages = await db.outboxMessage.findMany({ where: { appointmentId: appt.id }, orderBy: { nextAttemptAt: "asc" } });
    expect(messages.map((m) => [m.purpose, m.nextAttemptAt.toISOString()])).toEqual([
      ["BOOKING_CONFIRMATION", NOW.toISOString()],
      ["APPOINTMENT_REMINDER", at("2026-11-10", "15:00").toISOString()],
      ["APPOINTMENT_REMINDER", at("2026-11-11", "13:00").toISOString()],
    ]);
    expect(messages[0].body).toContain(`${BASE}/a/${result.token}`);
    expect(messages[1].body).toContain("tomorrow at 3:00 pm");
    expect(messages[2].body).toContain("today at 3:00 pm");
    // The WhatsApp template carries the same details, and its button opens the manage link.
    expect(messages[1]).toMatchObject({ provider: "demo", channel: "WHATSAPP" });
    expect(messages[1].template).toEqual({
      name: "appointment_reminder",
      body: ["Test", "Check-up", "Test Dental", "tomorrow at 3:00 pm"],
      urlSuffix: result.token,
    });
  });

  it("reuses the customer record for the same number typed differently", async () => {
    const a = await book(at("2026-11-11", "11:00"), { phone: "9800012345" });
    const b = await book(at("2026-11-12", "11:00"), { phone: "+91 98000-12345" });
    expect(a.ok && b.ok).toBe(true);
    const customers = await db.customer.findMany({ where: { locationId, phone: "+91 98000 12345" } });
    expect(customers).toHaveLength(1);
  });

  it("rejects a slot that is taken, outside hours, or too soon", async () => {
    expect((await book(at("2026-11-11", "15:00"))).ok).toBe(true);
    expect(await book(at("2026-11-11", "15:15"))).toEqual({ ok: false, error: "slot-unavailable" });
    expect(await book(at("2026-11-11", "21:00"))).toEqual({ ok: false, error: "slot-unavailable" });
    expect(await book(at("2026-11-09", "10:30"))).toEqual({ ok: false, error: "slot-unavailable" });
    expect(await book(at("2026-11-15", "11:00"))).toEqual({ ok: false, error: "slot-unavailable" }); // Sunday
  });

  it("lets exactly one of two simultaneous bookings for the same slot win", async () => {
    const results = await Promise.all([book(at("2026-11-13", "12:00")), book(at("2026-11-13", "12:00"))]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toEqual({ ok: false, error: "slot-unavailable" });
  });

  it("validates name and phone, and unknown links", async () => {
    expect(await book(at("2026-11-11", "15:00"), { phone: "12345" })).toEqual({ ok: false, error: "invalid-phone" });
    expect(await book(at("2026-11-11", "15:00"), { name: " " })).toEqual({ ok: false, error: "invalid-name" });
    expect(await book(at("2026-11-11", "15:00"), { slug: "nope" })).toEqual({ ok: false, error: "not-found" });
  });

  it("queues nothing without WhatsApp consent", async () => {
    const r = await book(at("2026-11-11", "16:00"), { whatsappConsent: false });
    expect(r.ok).toBe(true);
    expect(await db.outboxMessage.count({ where: { locationId } })).toBe(0);
  });

  it("limits open online bookings per phone number", async () => {
    for (let i = 0; i < MAX_OPEN_ONLINE_BOOKINGS; i++) {
      expect((await book(at("2026-11-1" + (i + 1), "17:00"), { phone: "9811111111" })).ok).toBe(true);
    }
    expect(await book(at("2026-11-14", "17:00"), { phone: "9811111111" })).toEqual({ ok: false, error: "too-many-bookings" });
  });

  it("cancelling withdraws reminders and drafts a refill campaign", async () => {
    const r = await book(at("2026-11-11", "15:00"));
    if (!r.ok) throw new Error("booking failed");
    const result = await cancelAppointment(db, { tokenHash: hashToken(r.token) }, { type: "CUSTOMER", id: null }, NOW, "Travel");
    expect(result).toMatchObject({ ok: true });

    const appt = await db.appointment.findUniqueOrThrow({ where: { id: r.appointmentId }, include: { recoveryCampaign: true } });
    expect(appt.status).toBe("CANCELLED");
    expect(appt.recoveryCampaign).toMatchObject({ status: "DRAFT", startAt: appt.startAt, resourceId: appt.resourceId });
    const statuses = await db.outboxMessage.findMany({ where: { appointmentId: appt.id }, select: { status: true } });
    expect(statuses.every((m) => m.status === "CANCELLED")).toBe(true);

    // A second cancel is refused, and the freed slot can be booked again.
    expect(await cancelAppointment(db, { tokenHash: hashToken(r.token) }, { type: "CUSTOMER", id: null }, NOW)).toEqual({ ok: false, error: "not-allowed" });
    expect((await book(at("2026-11-11", "15:00"))).ok).toBe(true);
  });

  it("does not draft a refill when the slot is too close to fill", async () => {
    const r = await book(at("2026-11-09", "12:00"));
    if (!r.ok) throw new Error("booking failed");
    const result = await cancelAppointment(db, { tokenHash: hashToken(r.token) }, { type: "CUSTOMER", id: null }, at("2026-11-09", "11:30"));
    expect(result).toEqual({ ok: true, campaignId: null });
  });

  it("confirms idempotently, and recording an outcome withdraws pending reminders", async () => {
    const r = await book(at("2026-11-10", "11:00"));
    if (!r.ok) throw new Error("booking failed");
    const ref = { id: r.appointmentId, locationId };
    const actor = { type: "USER" as const, id: null };

    expect(await confirmAppointment(db, { tokenHash: hashToken(r.token) }, { type: "CUSTOMER", id: null }, NOW)).toEqual({ ok: true });
    expect(await confirmAppointment(db, ref, actor, NOW)).toEqual({ ok: true });

    await changeAppointmentStatus(db, staff, { appointmentId: r.appointmentId, to: "NO_SHOW" });
    const appt = await db.appointment.findUniqueOrThrow({ where: { id: r.appointmentId } });
    expect(appt.status).toBe("NO_SHOW");
    expect(appt.noShowAt).not.toBeNull();
    expect(await db.outboxMessage.count({ where: { appointmentId: appt.id, status: "QUEUED" } })).toBe(0);

    // Staff can correct a mistaken no-show.
    await changeAppointmentStatus(db, staff, { appointmentId: r.appointmentId, to: "COMPLETED" });
    expect(await db.appointment.findUniqueOrThrow({ where: { id: r.appointmentId } })).toMatchObject({ status: "COMPLETED", noShowAt: null });
  });

  it("moving an appointment withdraws reminders that name the old time", async () => {
    const r = await book(at("2026-11-11", "15:00"));
    if (!r.ok) throw new Error("booking failed");
    await confirmAppointment(db, { tokenHash: hashToken(r.token) }, { type: "CUSTOMER", id: null }, NOW);
    await rescheduleAppointment(db, staff, { appointmentId: r.appointmentId, resourceId, startAt: at("2026-11-12", "15:00") });
    const reminders = await db.outboxMessage.findMany({ where: { appointmentId: r.appointmentId, purpose: "APPOINTMENT_REMINDER" } });
    expect(reminders.every((m) => m.status === "CANCELLED" && m.errorCode === "appointment_moved")).toBe(true);
    expect((await db.appointment.findUniqueOrThrow({ where: { id: r.appointmentId } })).confirmedAt).toBeNull();
  });

  it("scopes staff actions to their own location", async () => {
    const r = await book(at("2026-11-10", "12:00"));
    if (!r.ok) throw new Error("booking failed");
    const other = { id: r.appointmentId, locationId: "some-other-location" };
    expect(await cancelAppointment(db, other, { type: "USER", id: null }, NOW)).toEqual({ ok: false, error: "not-found" });
  });

  it("flags repeat no-shows", async () => {
    const phoneNo = "9822222222";
    const ids: string[] = [];
    for (const day of ["2026-11-10", "2026-11-11"]) {
      const r = await book(at(day, "18:00"), { phone: phoneNo });
      if (!r.ok) throw new Error("booking failed");
      ids.push(r.appointmentId);
    }
    for (const id of ids) await changeAppointmentStatus(db, staff, { appointmentId: id, to: "NO_SHOW" });
    const customer = await db.customer.findFirstOrThrow({ where: { locationId, phone: "+91 98222 22222" } });
    const flagged = await repeatNoShows(db, locationId, at("2026-11-12", "10:00"));
    expect(flagged.get(customer.id)).toBe(2);
  });

  describe("delivery", () => {
    it("sends due messages once, and leaves future reminders queued", async () => {
      const r = await book(at("2026-11-11", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      const [first, second] = await Promise.all([
        processOutbox(db, NOW, 25, { locationId }),
        processOutbox(db, NOW, 25, { locationId }),
      ]);
      expect(first.sent + second.sent).toBe(1);

      const sent = await db.outboxMessage.findFirstOrThrow({ where: { appointmentId: r.appointmentId, purpose: "BOOKING_CONFIRMATION" } });
      expect(sent).toMatchObject({ status: "DELIVERED", provider: "demo", attempts: 1 });
      expect(await db.outboxMessage.count({ where: { appointmentId: r.appointmentId, status: "QUEUED" } })).toBe(2);

      // The 24h reminder goes out when it is due.
      const report = await processOutbox(db, at("2026-11-10", "15:01"), 25, { locationId });
      expect(report.sent).toBe(1);
    });

    it("suppresses messages after the patient opts out", async () => {
      const r = await book(at("2026-11-11", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      await stopWhatsAppReminders(db, hashToken(r.token), NOW);
      const report = await processOutbox(db, at("2026-11-11", "14:00"), 25, { locationId });
      expect(report.sent).toBe(0);
      const statuses = await db.outboxMessage.findMany({ where: { appointmentId: r.appointmentId }, select: { status: true } });
      expect(statuses.every((m) => m.status === "SUPPRESSED")).toBe(true);
    });

    it("re-checks consent at send time", async () => {
      const r = await book(at("2026-11-11", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      const appt = await db.appointment.findUniqueOrThrow({ where: { id: r.appointmentId } });
      await db.channelConsent.update({
        where: { customerId_channel: { customerId: appt.customerId!, channel: "WHATSAPP" } },
        data: { status: "REVOKED" },
      });
      const report = await processOutbox(db, NOW, 25, { locationId });
      expect(report).toMatchObject({ sent: 0, skipped: 1 });
    });

    it("holds messages during quiet hours until the morning", async () => {
      const r = await book(at("2026-11-12", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      const night = at("2026-11-09", "22:30");
      const report = await processOutbox(db, night, 25, { locationId });
      expect(report).toMatchObject({ sent: 0, deferred: 1 });
      const m = await db.outboxMessage.findFirstOrThrow({ where: { appointmentId: r.appointmentId, purpose: "BOOKING_CONFIRMATION" } });
      // Waiting out quiet hours does not use up a delivery attempt.
      expect(m).toMatchObject({ status: "QUEUED", nextAttemptAt: at("2026-11-10", "09:00"), attempts: 0 });
    });

    it("drops reminders that are no longer useful", async () => {
      const r = await book(at("2026-11-11", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      // The worker was down until 10 minutes before the appointment.
      const report = await processOutbox(db, at("2026-11-11", "14:50"), 25, { locationId });
      expect(report.sent).toBe(0);
      expect(await db.outboxMessage.count({ where: { appointmentId: r.appointmentId, errorCode: "stale" } })).toBe(3);
    });

    it("suppresses queued reminders when the patient replies STOP", async () => {
      const r = await book(at("2026-11-11", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      const appt = await db.appointment.findUniqueOrThrow({ where: { id: r.appointmentId } });
      await setConsent(db, { ...staff, userId: null }, { customerId: appt.customerId!, channel: "WHATSAPP", granted: false, source: "test" });
      expect(await db.outboxMessage.count({ where: { appointmentId: appt.id, status: "SUPPRESSED" } })).toBe(3);
    });

    it("retries failures with backoff, then gives up", async () => {
      registerProvider({ name: "flaky", keepsBodies: false, channels: ["WHATSAPP"], send: async () => Promise.reject(new ProviderError("timeout", true)) });
      registerProvider({ name: "fatal", keepsBodies: false, channels: ["WHATSAPP"], send: async () => Promise.reject(new ProviderError("invalid_number", false)) });
      const r = await book(at("2026-11-11", "15:00"));
      if (!r.ok) throw new Error("booking failed");
      await db.outboxMessage.updateMany({ where: { appointmentId: r.appointmentId }, data: { provider: "flaky" } });
      await processOutbox(db, NOW, 25, { locationId });
      const m = await db.outboxMessage.findFirstOrThrow({ where: { appointmentId: r.appointmentId, purpose: "BOOKING_CONFIRMATION" } });
      expect(m).toMatchObject({ status: "QUEUED", attempts: 1, errorCode: "timeout" });
      expect(m.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);

      await db.outboxMessage.update({ where: { id: m.id }, data: { provider: "fatal" } });
      await processOutbox(db, at("2026-11-09", "10:05"), 25, { locationId });
      expect(await db.outboxMessage.findUniqueOrThrow({ where: { id: m.id } })).toMatchObject({ status: "FAILED", errorCode: "invalid_number" });
    });
  });
});
