/**
 * Demo workspace: a fictional Goa salon with a realistic week of bookings and a consented
 * waitlist. All people, phone numbers and emails are invented. Phone numbers use the
 * +91 90000 000xx range so they can never reach a real person.
 *
 * Kept free of `server-only` so both `prisma db seed` and the in-app "reset demo" action can use it.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { addDays, localDateKey, zonedToUtc } from "@/lib/time";

export const DEMO_USER_EMAIL = "demo@slotback.app";
const TZ = "Asia/Kolkata";
const OPEN = 10 * 60;
const CLOSE = 20 * 60;

const SERVICES = [
  { key: "womens-cut", name: "Women's haircut & style", durationMinutes: 60, pricePaise: 120000 },
  { key: "mens-cut", name: "Men's haircut & beard", durationMinutes: 45, pricePaise: 60000 },
  { key: "colour", name: "Global hair colour", durationMinutes: 120, pricePaise: 350000 },
  { key: "keratin", name: "Keratin treatment", durationMinutes: 150, pricePaise: 550000 },
  { key: "manicure", name: "Gel manicure", durationMinutes: 45, pricePaise: 90000 },
  { key: "pedicure", name: "Spa pedicure", durationMinutes: 60, pricePaise: 110000 },
  { key: "facial", name: "Hydrating facial", durationMinutes: 60, pricePaise: 180000 },
] as const;

type ServiceKey = (typeof SERVICES)[number]["key"];

const STAFF: { name: string; services: ServiceKey[] }[] = [
  { name: "Sneha Naik", services: ["womens-cut", "colour", "keratin"] },
  { name: "Ryan Fernandes", services: ["mens-cut", "womens-cut"] },
  { name: "Aisha D'Souza", services: ["manicure", "pedicure", "facial"] },
  { name: "Tanvi Gaonkar", services: ["facial", "colour", "womens-cut"] },
];

const CUSTOMER_NAMES = [
  "Ananya Prabhu", "Rahul Desai", "Fatima Sheikh", "Joel Pereira", "Kavita Shetty", "Arjun Menon",
  "Neha Sawant", "Leon Rodrigues", "Pooja Kulkarni", "Siddharth Rao", "Ishita Verma", "Cyrus Mascarenhas",
  "Divya Parab", "Karan Malhotra", "Sara Colaco", "Vikram Bhat", "Riya Chodankar", "Aditya Joshi",
  "Melissa Dias", "Nikhil Kamath", "Shreya Gawas", "Imran Khan", "Tara Noronha", "Rohan Salgaonkar",
  "Alisha Fonseca", "Manish Agarwal", "Priyanka Naik", "Dylan Gomes", "Zoya Mirza", "Harsh Patil",
];

/** Deterministic PRNG so every reset produces the same demo. */
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

export type SeedResult = { organizationId: string; locationId: string; userId: string };

/**
 * Deletes any existing demo organization and recreates it, anchored to `now`.
 * Real (non-demo) organizations are never touched.
 */
export async function seedDemo(db: PrismaClient, now: Date = new Date()): Promise<SeedResult> {
  const rand = mulberry32(20261023);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

  await db.organization.deleteMany({ where: { isDemo: true } });

  const user = await db.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { name: "Maya Fernandes" },
    create: { email: DEMO_USER_EMAIL, name: "Maya Fernandes" },
  });

  const hours = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), [{ open: "10:00", close: "20:00" }]]));

  const org = await db.organization.create({
    data: {
      name: "Casa Verde Salon",
      isDemo: true,
      memberships: { create: { userId: user.id, role: "OWNER" } },
      locations: {
        create: {
          name: "Casa Verde · Panaji",
          address: "Fontainhas, Panaji, Goa 403001",
          phone: "+91 90000 00000",
          timezone: TZ,
          currency: "INR",
          businessHours: hours,
        },
      },
    },
    include: { locations: true },
  });
  const location = org.locations[0];

  const services = new Map<ServiceKey, { id: string; durationMinutes: number; pricePaise: number }>();
  for (const s of SERVICES) {
    const row = await db.service.create({
      data: { locationId: location.id, name: s.name, durationMinutes: s.durationMinutes, pricePaise: s.pricePaise },
    });
    services.set(s.key, row);
  }

  const staff: { id: string; services: ServiceKey[] }[] = [];
  for (const s of STAFF) {
    const row = await db.resource.create({
      data: {
        locationId: location.id,
        name: s.name,
        kind: "STAFF",
        services: { connect: s.services.map((k) => ({ id: services.get(k)!.id })) },
      },
    });
    staff.push({ id: row.id, services: s.services });
  }

  const customers: { id: string }[] = [];
  for (const [i, name] of CUSTOMER_NAMES.entries()) {
    const n = String(i + 1).padStart(2, "0");
    const prefersSms = i % 9 === 4;
    const customer = await db.customer.create({
      data: {
        locationId: location.id,
        name,
        phone: `+91 90000 000${n}`,
        email: i % 3 === 0 ? `${name.split(" ")[0].toLowerCase()}@example.com` : null,
        preferredChannel: prefersSms ? "SMS" : "WHATSAPP",
        consents: {
          create: [
            // Two customers have opted out of WhatsApp; one has opted out of everything.
            { channel: "WHATSAPP", status: i === 7 || i === 13 || i === 21 ? "REVOKED" : "GRANTED", source: "in-salon form" },
            { channel: "SMS", status: i === 21 ? "REVOKED" : "GRANTED", source: "in-salon form" },
          ],
        },
      },
    });
    customers.push(customer);
  }

  // Appointments: 14 days of history plus 7 days ahead, packed per staff member without overlaps.
  const today = localDateKey(now, TZ);
  const appointments: Prisma.AppointmentCreateManyInput[] = [];
  for (let offset = -14; offset <= 6; offset++) {
    const day = addDays(today, offset);
    for (const member of staff) {
      let cursor = OPEN + [0, 0, 15, 30][Math.floor(rand() * 4)];
      while (cursor < CLOSE) {
        if (rand() < 0.3) {
          cursor += pick([15, 30, 45, 60]);
          continue;
        }
        const key = pick(member.services);
        const service = services.get(key)!;
        if (cursor + service.durationMinutes > CLOSE) break;
        const startAt = zonedToUtc(day, cursor, TZ);
        const endAt = zonedToUtc(day, cursor + service.durationMinutes, TZ);
        const inPast = endAt <= now;
        let status: "BOOKED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" = "BOOKED";
        if (inPast) {
          const r = rand();
          status = r < 0.08 ? "CANCELLED" : r < 0.13 ? "NO_SHOW" : "COMPLETED";
        }
        appointments.push({
          locationId: location.id,
          customerId: pick(customers).id,
          serviceId: service.id,
          resourceId: member.id,
          startAt,
          endAt,
          status,
          valuePaise: service.pricePaise,
          cancelledAt: status === "CANCELLED" ? new Date(startAt.getTime() - 3 * 3600_000) : null,
          cancelReason: status === "CANCELLED" ? pick(["Feeling unwell", "Work came up", "Travel", null]) : null,
          completedAt: status === "COMPLETED" ? endAt : null,
        });
        cursor += service.durationMinutes;
      }
    }
  }
  await db.appointment.createMany({ data: appointments });

  // Waitlist: 18 customers who want an earlier or more convenient slot.
  const windows = [
    { earliestMinute: OPEN, latestMinute: 13 * 60 }, // mornings
    { earliestMinute: 12 * 60, latestMinute: 17 * 60 }, // afternoons
    { earliestMinute: 16 * 60, latestMinute: CLOSE }, // evenings
    { earliestMinute: 0, latestMinute: 1440 }, // any time
  ];
  const serviceKeys = SERVICES.map((s) => s.key);
  for (let i = 0; i < 18; i++) {
    const wantsAny = i % 6 === 5;
    const days = rand() < 0.4 ? [] : [0, 1, 2, 3, 4, 5, 6].filter(() => rand() < 0.6);
    await db.waitlistEntry.create({
      data: {
        locationId: location.id,
        customerId: customers[i].id,
        serviceId: wantsAny ? null : services.get(pick(serviceKeys))!.id,
        preferredDays: days,
        ...pick(windows),
        expiresAt: zonedToUtc(addDays(today, 21), 0, TZ),
        notes: i === 2 ? "Happy to come in at short notice" : null,
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
      metadata: { appointments: appointments.length },
    },
  });

  return { organizationId: org.id, locationId: location.id, userId: user.id };
}
