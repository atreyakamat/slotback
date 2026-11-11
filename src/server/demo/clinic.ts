/**
 * Demo dental clinic: a fictional two-dentist practice in Margao with split opening hours,
 * online booking switched on, WhatsApp reminders already flowing (mock provider), a couple of
 * repeat no-show patients, and one cancellation with a drafted refill.
 *
 * All people and numbers are invented. Phone numbers use +91 90000 001xx, inside the
 * reserved range the salon demo also uses, so they can never reach a real person.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { addDays, localDateKey, localWeekday, zonedToUtc } from "@/lib/time";
import { buildAppointmentMessages, cancelAppointment, newManageToken } from "../appointments/core";

export const DEMO_CLINIC_NAME = "Smile Studio Dental";
export const DEMO_CLINIC_SLUG = "smile-studio-demo";
const TZ = "Asia/Kolkata";

/** Mon–Sat, 10:00–13:30 and 16:30–20:30. Closed Sunday. */
const SPANS = [
  { open: "10:00", close: "13:30" },
  { open: "16:30", close: "20:30" },
];
const SPAN_MINUTES: [number, number][] = [
  [10 * 60, 13 * 60 + 30],
  [16 * 60 + 30, 20 * 60 + 30],
];

const SERVICES = [
  { key: "consult", name: "Consultation", durationMinutes: 20, pricePaise: 50000 },
  { key: "scaling", name: "Scaling & polishing", durationMinutes: 45, pricePaise: 150000 },
  { key: "filling", name: "Tooth-coloured filling", durationMinutes: 45, pricePaise: 200000 },
  { key: "rct", name: "Root canal session", durationMinutes: 60, pricePaise: 600000 },
  { key: "whitening", name: "Teeth whitening", durationMinutes: 60, pricePaise: 800000 },
  { key: "braces", name: "Braces review", durationMinutes: 20, pricePaise: 80000 },
] as const;
type ServiceKey = (typeof SERVICES)[number]["key"];

const DENTISTS: { name: string; services: ServiceKey[] }[] = [
  { name: "Dr. Rhea Pai", services: ["consult", "scaling", "filling", "rct", "whitening"] },
  { name: "Dr. Kevin Sequeira", services: ["consult", "scaling", "filling", "braces"] },
];

const PATIENTS = [
  "Meera Naik", "Anil Borkar", "Glenda Pinto", "Suresh Kamat", "Farah Shaikh", "Ashwin Dessai",
  "Lavina D'Costa", "Prakash Gaude", "Nisha Raikar", "Brian Monteiro", "Sonali Vaigankar", "Omkar Parsekar",
  "Clara Vaz", "Deepak Lotlikar", "Rukhsar Bepari", "Vinay Shirodkar", "Jessica Almeida", "Gaurav Mhamal",
  "Pallavi Sardessai", "Russel Carvalho", "Kirti Volvoikar", "Sameer Naik", "Elaine Furtado", "Yash Kerkar",
];
/** Indexes of patients who keep missing appointments, and one who opted out of WhatsApp. */
const REPEAT_NO_SHOWS = new Set([3, 11]);
const NO_WHATSAPP = 7;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ClinicSeedResult = { organizationId: string; locationId: string; userId: string };

/** Creates the demo clinic. The caller has already removed previous demo organizations. */
export async function seedDemoClinic(
  db: PrismaClient,
  userId: string,
  now: Date,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
): Promise<ClinicSeedResult> {
  const rand = mulberry32(20261109);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

  const hours = Object.fromEntries([1, 2, 3, 4, 5, 6].map((d) => [String(d), SPANS]));
  const org = await db.organization.create({
    data: {
      name: DEMO_CLINIC_NAME,
      isDemo: true,
      onboardedAt: now,
      memberships: { create: { userId, role: "OWNER" } },
      locations: {
        create: {
          name: "Smile Studio Dental · Margao",
          address: "Station Road, Margao, Goa 403601",
          phone: "+91 90000 00100",
          timezone: TZ,
          currency: "INR",
          businessHours: hours,
          minLeadMinutes: 120,
          bookingSlug: DEMO_CLINIC_SLUG,
          bookingEnabled: true,
          bookingHorizonDays: 14,
          slotIntervalMinutes: 15,
          reminderOffsetsMinutes: [1440, 120],
        },
      },
    },
    include: { locations: true },
  });
  const location = org.locations[0];

  const services = new Map<ServiceKey, { id: string; name: string; durationMinutes: number; pricePaise: number }>();
  for (const s of SERVICES) {
    services.set(
      s.key,
      await db.service.create({ data: { locationId: location.id, name: s.name, durationMinutes: s.durationMinutes, pricePaise: s.pricePaise } }),
    );
  }
  const dentists: { id: string; services: ServiceKey[] }[] = [];
  for (const d of DENTISTS) {
    const row = await db.resource.create({
      data: { locationId: location.id, name: d.name, kind: "STAFF", services: { connect: d.services.map((k) => ({ id: services.get(k)!.id })) } },
    });
    dentists.push({ id: row.id, services: d.services });
  }

  const patients: { id: string; name: string; phone: string; whatsapp: boolean }[] = [];
  for (const [i, name] of PATIENTS.entries()) {
    const phone = `+91 90000 001${String(i + 1).padStart(2, "0")}`;
    const whatsapp = i !== NO_WHATSAPP;
    const row = await db.customer.create({
      data: {
        locationId: location.id,
        name,
        phone,
        preferredChannel: "WHATSAPP",
        consents: { create: [{ channel: "WHATSAPP", status: whatsapp ? "GRANTED" : "REVOKED", source: "clinic registration form" }] },
      },
    });
    patients.push({ id: row.id, name, phone, whatsapp });
  }

  // Appointments: 14 days back to 6 days ahead, on open days, packed per dentist.
  type Draft = Prisma.AppointmentCreateManyInput & { patient: (typeof patients)[number]; serviceName: string; token: string | null };
  const drafts: Draft[] = [];
  const today = localDateKey(now, TZ);
  for (let offset = -14; offset <= 6; offset++) {
    const day = addDays(today, offset);
    if (localWeekday(zonedToUtc(day, 12 * 60, TZ), TZ) === 0) continue;
    for (const dentist of dentists) {
      for (const [open, close] of SPAN_MINUTES) {
        let cursor = open + pick([0, 0, 15]);
        while (cursor < close) {
          if (rand() < 0.4) {
            cursor += pick([15, 30, 45]);
            continue;
          }
          const service = services.get(pick(dentist.services))!;
          if (cursor + service.durationMinutes > close) break;
          const startAt = zonedToUtc(day, cursor, TZ);
          const endAt = zonedToUtc(day, cursor + service.durationMinutes, TZ);
          const patientIndex = Math.floor(rand() * patients.length);
          const patient = patients[patientIndex];
          const hoursAgo = (now.getTime() - endAt.getTime()) / 3600_000;
          let status: "BOOKED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" = "BOOKED";
          if (endAt <= now && hoursAgo > 3) {
            const r = rand();
            status = REPEAT_NO_SHOWS.has(patientIndex) ? (r < 0.7 ? "NO_SHOW" : "COMPLETED") : r < 0.06 ? "CANCELLED" : r < 0.13 ? "NO_SHOW" : "COMPLETED";
          }
          // Appointments that ended in the last 3 hours stay BOOKED: staff still need to record the outcome.
          const online = rand() < 0.45;
          const token = status === "BOOKED" ? newManageToken() : null;
          const confirmed = status === "BOOKED" && startAt > now && startAt.getTime() - now.getTime() < 48 * 3600_000 && rand() < 0.45;
          drafts.push({
            locationId: location.id,
            customerId: patient.id,
            serviceId: service.id,
            resourceId: dentist.id,
            startAt,
            endAt,
            status,
            source: online ? "ONLINE" : "DIRECT",
            valuePaise: service.pricePaise,
            cancelledAt: status === "CANCELLED" ? new Date(startAt.getTime() - 5 * 3600_000) : null,
            cancelReason: status === "CANCELLED" ? pick(["Work came up", "Feeling unwell", null]) : null,
            completedAt: status === "COMPLETED" ? endAt : null,
            noShowAt: status === "NO_SHOW" ? new Date(startAt.getTime() + 20 * 60_000) : null,
            confirmedAt: confirmed ? new Date(now.getTime() - Math.floor(rand() * 6 + 1) * 3600_000) : null,
            manageTokenHash: token?.hash ?? null,
            patient,
            serviceName: service.name,
            token: token?.token ?? null,
          });
          cursor += service.durationMinutes + pick([0, 0, 15]);
        }
      }
    }
  }

  const created = await db.appointment.createManyAndReturn({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip seed-only fields
    data: drafts.map(({ patient, serviceName, token, ...row }) => row),
    select: { id: true, startAt: true, resourceId: true },
  });
  // Pair returned rows with their drafts by (resource, start), which the overlap constraint makes unique.
  const key = (r: { resourceId: string; startAt: Date | string }) => `${r.resourceId}|${new Date(r.startAt).toISOString()}`;
  const byKey = new Map(created.map((c) => [key(c), c]));
  const rows = drafts.map((d) => ({ draft: d, appt: byKey.get(key(d))! }));

  // Messages for upcoming and still-open appointments, as if each was booked 3 days before.
  // Anything that would already have gone out is recorded as sent by the mock provider.
  const messages: Prisma.OutboxMessageCreateManyInput[] = [];
  rows.forEach(({ draft: d, appt }) => {
    if (d.status !== "BOOKED" || !d.token || !d.patient.whatsapp) return;
    const bookedAt = new Date(Math.min(now.getTime() - 3600_000, appt.startAt.getTime() - 3 * 24 * 3600_000));
    for (const m of buildAppointmentMessages({
      appointment: { id: appt.id, startAt: appt.startAt, locationId: location.id },
      location,
      customer: { name: d.patient.name, phone: d.patient.phone },
      serviceName: d.serviceName,
      token: d.token,
      baseUrl,
      now: bookedAt,
      includeConfirmation: d.source === "ONLINE",
      provider: "demo",
    })) {
      const due = new Date(m.nextAttemptAt as Date) <= now;
      messages.push(
        due
          ? { ...m, status: "DELIVERED", provider: "demo", providerMessageId: `demo_${m.idempotencyKey}`, sentAt: m.nextAttemptAt, attempts: 1 }
          : m,
      );
    }
  });
  if (messages.length) await db.outboxMessage.createMany({ data: messages });

  // One patient cancels a slot two days out: the refill campaign is drafted automatically.
  const toCancel = rows.find(
    ({ draft: d, appt }) => d.status === "BOOKED" && appt.startAt.getTime() - now.getTime() > 40 * 3600_000 && d.patient.whatsapp,
  );
  if (toCancel) {
    await cancelAppointment(
      db,
      { id: toCancel.appt.id, locationId: location.id },
      { type: "CUSTOMER", id: toCancel.draft.customerId ?? null },
      now,
      "Travelling",
    );
  }

  // A small waitlist of patients happy to come in earlier.
  for (let i = 0; i < 10; i++) {
    await db.waitlistEntry.create({
      data: {
        locationId: location.id,
        customerId: patients[(i * 5 + 2) % patients.length].id,
        serviceId: i % 4 === 3 ? null : services.get(pick(["consult", "scaling", "filling"] as const))!.id,
        preferredDays: [],
        earliestMinute: i % 2 === 0 ? 10 * 60 : 16 * 60 + 30,
        latestMinute: i % 2 === 0 ? 13 * 60 + 30 : 20 * 60 + 30,
        expiresAt: zonedToUtc(addDays(today, 21), 0, TZ),
      },
    });
  }

  await db.auditEvent.create({
    data: {
      organizationId: org.id,
      actorType: "SYSTEM",
      entityType: "organization",
      entityId: org.id,
      action: "demo.seeded",
      metadata: { appointments: drafts.length, messages: messages.length },
    },
  });

  return { organizationId: org.id, locationId: location.id, userId };
}
