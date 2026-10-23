/**
 * Demo workspace: a fictional Goa salon with a realistic week of bookings and a consented
 * waitlist. All people, phone numbers and emails are invented. Phone numbers use the
 * +91 90000 000xx range so they can never reach a real person.
 *
 * Kept free of `server-only` so both `prisma db seed` and the in-app "reset demo" action can use it.
 */
import { createHash, randomBytes } from "node:crypto";
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
          // Wider than the default (21:00–09:00) so evening demos can show live offers.
          quietHoursStart: "23:00",
          quietHoursEnd: "07:00",
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

  const customers: { id: string; whatsapp: boolean; reachable: boolean }[] = [];
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
    customers.push({ id: customer.id, whatsapp: i !== 7 && i !== 13 && i !== 21, reachable: i !== 21 });
  }

  // The two flexible waitlisters (see below) have no upcoming bookings, so they are always free.
  const bookable = customers.filter((_, i) => i !== 2 && i !== 10);

  // Appointments: 30 days of history plus 7 days ahead, packed per staff member without overlaps.
  const today = localDateKey(now, TZ);
  const appointments: Prisma.AppointmentCreateManyInput[] = [];
  for (let offset = -30; offset <= 6; offset++) {
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
          customerId: pick(inPast ? customers : bookable).id,
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
    // Two flexible regulars (any service, any day, any time) make sure a live demo always has
    // someone to offer an opening to.
    const flexible = i === 2 || i === 10;
    const wantsAny = flexible || i % 6 === 5;
    const days = flexible || rand() < 0.4 ? [] : [0, 1, 2, 3, 4, 5, 6].filter(() => rand() < 0.6);
    await db.waitlistEntry.create({
      data: {
        locationId: location.id,
        customerId: customers[i].id,
        serviceId: wantsAny ? null : services.get(pick(serviceKeys))!.id,
        preferredDays: days,
        ...(flexible ? { earliestMinute: 0, latestMinute: 1440 } : pick(windows)),
        expiresAt: zonedToUtc(addDays(today, 21), 0, TZ),
        notes: flexible ? "Happy to come in at short notice" : null,
        // Stagger join dates so ranking by "joined earliest" is visible.
        createdAt: new Date(now.getTime() - (30 - i) * 24 * 3600_000),
      },
    });
  }

  const history = await seedRecoveryHistory(db, {
    rand,
    organizationId: org.id,
    location,
    userId: user.id,
    customers,
    now,
  });

  await db.auditEvent.create({
    data: {
      organizationId: org.id,
      actorType: "SYSTEM",
      entityType: "organization",
      entityId: org.id,
      action: "demo.seeded",
      metadata: { appointments: appointments.length, campaigns: history.campaigns },
    },
  });

  return { organizationId: org.id, locationId: location.id, userId: user.id };
}

type HistoryInput = {
  rand: () => number;
  organizationId: string;
  location: {
    id: string;
    minLeadMinutes: number;
    offerTtlMinutes: number;
    offerBatchSize: number;
    quietHoursStart: string;
    quietHoursEnd: string;
    timezone: string;
  };
  userId: string;
  customers: { id: string; whatsapp: boolean; reachable: boolean }[];
  now: Date;
};

const MINUTE = 60_000;

/**
 * A month of past recovery campaigns for the cancellations above, so the dashboard and
 * analytics open with a believable track record: most openings refilled within minutes,
 * a few expired, and some cancellations that were never offered.
 */
async function seedRecoveryHistory(db: PrismaClient, input: HistoryInput) {
  const { rand, location, now } = input;
  const cancelled = await db.appointment.findMany({
    where: { locationId: location.id, status: "CANCELLED", endAt: { lte: now } },
    orderBy: { startAt: "asc" },
  });
  const rules = {
    minLeadMinutes: location.minLeadMinutes,
    offerTtlMinutes: location.offerTtlMinutes,
    offerBatchSize: location.offerBatchSize,
    quietHoursStart: location.quietHoursStart,
    quietHoursEnd: location.quietHoursEnd,
    timezone: location.timezone,
  };
  const reachable = input.customers.filter((c) => c.reachable);
  const audit: Prisma.AuditEventCreateManyInput[] = [];
  let campaigns = 0;

  for (const appt of cancelled) {
    const roll = rand();
    if (roll < 0.15) continue; // Cancelled before the salon started using SlotBack for every opening.
    const outcome = roll < 0.6 ? "EXPIRED" : "CLAIMED";

    const cancelledAt = appt.cancelledAt ?? new Date(appt.startAt.getTime() - 3 * 3600_000);
    const launchedAt = new Date(cancelledAt.getTime() + (2 + Math.floor(rand() * 5)) * MINUTE);
    const expiresAt = new Date(appt.startAt.getTime() - rules.minLeadMinutes * MINUTE);
    const claimedAt =
      outcome === "CLAIMED" ? new Date(launchedAt.getTime() + (3 + Math.floor(rand() * 35)) * MINUTE) : null;

    // Audience: a batch of reachable customers other than the one who cancelled.
    const pool = reachable.filter((c) => c.id !== appt.customerId);
    const audience: typeof pool = [];
    const size = 3 + Math.floor(rand() * 3);
    while (audience.length < size) {
      const c = pool[Math.floor(rand() * pool.length)];
      if (!audience.includes(c)) audience.push(c);
    }
    const winner = outcome === "CLAIMED" ? Math.floor(rand() * audience.length) : -1;

    const campaign = await db.recoveryCampaign.create({
      data: {
        locationId: location.id,
        appointmentId: appt.id,
        serviceId: appt.serviceId,
        resourceId: appt.resourceId,
        startAt: appt.startAt,
        endAt: appt.endAt,
        valuePaise: appt.valuePaise,
        status: outcome,
        rulesSnapshot: rules,
        expiresAt,
        launchedAt,
        claimedAt,
        createdById: input.userId,
        createdAt: new Date(cancelledAt.getTime() + MINUTE),
      },
    });
    campaigns++;

    const sentAt = new Date(launchedAt.getTime() + 20_000);
    const offers = await db.offer.createManyAndReturn({
      select: { id: true, customerId: true },
      data: audience.map((c, i) => {
        const isWinner = i === winner;
        const opened = isWinner || rand() < 0.55;
        return {
          campaignId: campaign.id,
          customerId: c.id,
          channel: c.whatsapp ? ("WHATSAPP" as const) : ("SMS" as const),
          rank: i + 1,
          // Historic offers never had a usable link: the hash is of random bytes nobody holds.
          tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"),
          status: isWinner ? ("CLAIMED" as const) : outcome === "CLAIMED" ? ("LOST" as const) : ("EXPIRED" as const),
          expiresAt: new Date(Math.min(launchedAt.getTime() + rules.offerTtlMinutes * MINUTE, expiresAt.getTime())),
          sentAt,
          openedAt: opened ? new Date(sentAt.getTime() + (1 + Math.floor(rand() * 20)) * MINUTE) : null,
          respondedAt: isWinner ? claimedAt : null,
          createdAt: launchedAt,
        };
      }),
    });
    const claimOfferId = winner >= 0 ? offers.find((o) => o.customerId === audience[winner].id)!.id : null;

    audit.push({
      organizationId: input.organizationId,
      actorType: "USER",
      actorId: input.userId,
      entityType: "campaign",
      entityId: campaign.id,
      action: "campaign.launched",
      metadata: { offers: audience.length },
      createdAt: launchedAt,
    });

    if (outcome === "CLAIMED" && claimedAt && claimOfferId) {
      const customerId = audience[winner].id;
      // A few recovered customers still didn't turn up, so "completed" trails "recovered".
      const noShow = rand() < 0.1;
      const replacement = await db.appointment.create({
        data: {
          locationId: location.id,
          customerId,
          serviceId: appt.serviceId,
          resourceId: appt.resourceId,
          startAt: appt.startAt,
          endAt: appt.endAt,
          valuePaise: appt.valuePaise,
          source: "RECOVERY",
          status: noShow ? "NO_SHOW" : "COMPLETED",
          completedAt: noShow ? null : appt.endAt,
          createdAt: claimedAt,
        },
      });
      await db.claim.create({
        data: { campaignId: campaign.id, offerId: claimOfferId, appointmentId: replacement.id, claimedAt },
      });
      audit.push({
        organizationId: input.organizationId,
        actorType: "CUSTOMER",
        actorId: customerId,
        entityType: "campaign",
        entityId: campaign.id,
        action: "campaign.claimed",
        metadata: { offerId: claimOfferId, appointmentId: replacement.id },
        createdAt: claimedAt,
      });
    } else {
      audit.push({
        organizationId: input.organizationId,
        actorType: "SYSTEM",
        entityType: "campaign",
        entityId: campaign.id,
        action: "campaign.expired",
        createdAt: expiresAt,
      });
    }
  }

  await db.auditEvent.createMany({ data: audit });
  return { campaigns };
}
