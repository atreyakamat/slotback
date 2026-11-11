import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { changeAppointmentStatus, createAppointment, rescheduleAppointment } from "@/server/domain/appointments";
import { DomainError } from "@/server/domain/errors";
import { hasTestDb, testDb } from "../support/db";
import { cleanupFixtures, createFixture } from "../support/fixtures";

describe.skipIf(!hasTestDb)("appointments domain", () => {
  const db = hasTestDb ? testDb() : (null as never);
  let f: Awaited<ReturnType<typeof createFixture>>;
  let other: Awaited<ReturnType<typeof createFixture>>;

  beforeAll(async () => {
    f = await createFixture(db, "appts");
    other = await createFixture(db, "appts-other");
  });
  afterAll(async () => {
    await cleanupFixtures(db);
    await db.$disconnect();
  });

  const at = (iso: string) => new Date(iso);

  it("books an appointment, derives end time and value from the service, and audits it", async () => {
    const a = await createAppointment(db, f.actor, {
      customerId: f.customer.id,
      serviceId: f.cut.id,
      resourceId: f.stylist.id,
      startAt: at("2026-12-01T05:00:00Z"),
    });
    expect(a.endAt.toISOString()).toBe("2026-12-01T06:00:00.000Z");
    expect(a.valuePaise).toBe(100000);
    const audit = await db.auditEvent.findFirst({ where: { entityId: a.id, action: "appointment.created" } });
    expect(audit?.actorId).toBe(f.actor.userId);
  });

  it("refuses an overlapping booking with a staff-friendly message", async () => {
    await expect(
      createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-01T05:30:00Z") }),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("refuses a service the staff member doesn't offer", async () => {
    await expect(
      createAppointment(db, f.actor, { customerId: null, serviceId: f.nails.id, resourceId: f.stylist.id, startAt: at("2026-12-02T05:00:00Z") }),
    ).rejects.toThrow(/doesn't offer/);
  });

  it("never lets one business book another business's staff, service or customer", async () => {
    await expect(
      createAppointment(db, f.actor, { customerId: null, serviceId: other.cut.id, resourceId: other.stylist.id, startAt: at("2026-12-03T05:00:00Z") }),
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(
      createAppointment(db, f.actor, { customerId: other.customer.id, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-03T05:00:00Z") }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("moves an appointment and refuses moving onto a clash", async () => {
    const a = await createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-04T05:00:00Z") });
    await createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-04T08:00:00Z") });

    const moved = await rescheduleAppointment(db, f.actor, { appointmentId: a.id, resourceId: f.stylist.id, startAt: at("2026-12-04T06:00:00Z") });
    expect(moved.endAt.toISOString()).toBe("2026-12-04T07:00:00.000Z");

    await expect(
      rescheduleAppointment(db, f.actor, { appointmentId: a.id, resourceId: f.stylist.id, startAt: at("2026-12-04T07:30:00Z") }),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("enforces status transitions", async () => {
    const a = await createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-05T05:00:00Z") });
    const done = await changeAppointmentStatus(db, f.actor, { appointmentId: a.id, to: "COMPLETED" });
    expect(done.completedAt).not.toBeNull();
    const corrected = await changeAppointmentStatus(db, f.actor, { appointmentId: a.id, to: "NO_SHOW" });
    expect(corrected.completedAt).toBeNull();
    await expect(changeAppointmentStatus(db, f.actor, { appointmentId: a.id, to: "CANCELLED" })).rejects.toBeInstanceOf(DomainError);
  });

  it("records the cancellation reason and frees the time", async () => {
    const a = await createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-06T05:00:00Z") });
    const c = await changeAppointmentStatus(db, f.actor, { appointmentId: a.id, to: "CANCELLED", reason: "  Unwell  " });
    expect(c.cancelReason).toBe("Unwell");
    expect(c.cancelledAt).not.toBeNull();
    await expect(
      createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-06T05:00:00Z") }),
    ).resolves.toBeTruthy();
  });

  it("lets only one of two simultaneous status changes win", async () => {
    const a = await createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-07T05:00:00Z") });
    const results = await Promise.allSettled([
      changeAppointmentStatus(db, f.actor, { appointmentId: a.id, to: "CANCELLED" }),
      changeAppointmentStatus(db, f.actor, { appointmentId: a.id, to: "COMPLETED" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("lets only one of two simultaneous bookings for the same slot win", async () => {
    const book = () =>
      createAppointment(db, f.actor, { customerId: null, serviceId: f.cut.id, resourceId: f.stylist.id, startAt: at("2026-12-08T05:00:00Z") });
    const results = await Promise.allSettled([book(), book(), book(), book(), book()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) if (r.status === "rejected") expect(r.reason).toMatchObject({ code: "conflict" });
  });
});
