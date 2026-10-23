import { z } from "zod";
import { parseHm } from "@/lib/time";
import { toActor } from "@/server/auth/dal";
import { db } from "@/server/db";
import { normalizeIndianPhone } from "@/server/domain/customers";
import { DomainError } from "@/server/domain/errors";
import { addToWaitlist } from "@/server/domain/waitlist";
import { mobileRoute, readJson } from "@/server/mobile/route";
import { getWaitlist } from "@/server/queries/campaigns";

export const GET = mobileRoute(async ({ member }) => {
  const { entries, services } = await getWaitlist(member);
  return {
    services,
    entries: entries.map((e) => ({
      id: e.id,
      name: e.customer.name,
      phone: e.customer.phone,
      service: e.service?.name ?? null,
      days: e.preferredDays,
      earliestMinute: e.earliestMinute,
      latestMinute: e.latestMinute,
      channels: e.customer.consents.filter((c) => c.status === "GRANTED").map((c) => c.channel),
      joinedAt: e.createdAt,
    })),
  };
});

const addSchema = z.object({
  name: z.string().trim().min(2, "Add their name.").max(80),
  phone: z.string().trim().min(10, "Add a 10-digit mobile number.").max(20),
  serviceId: z.string().max(40).nullish(),
  days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  from: z.string().regex(/^\d{2}:\d{2}$/).default("00:00"),
  to: z.string().regex(/^\d{2}:\d{2}$/).default("23:59"),
  channels: z.array(z.enum(["WHATSAPP", "SMS"])).default([]),
});

/** Adds a client from the front desk. Consent is whatever the client agreed to out loud, recorded by this staff member. */
export const POST = mobileRoute(async ({ member, request }) => {
  const parsed = addSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new DomainError("invalid", parsed.error.issues[0]?.message ?? "Check the details and try again.");
  const v = parsed.data;
  const phone = normalizeIndianPhone(v.phone);
  if (!phone) throw new DomainError("invalid", "Enter a 10-digit Indian mobile number.");
  // A returning client is matched by phone; their recorded consent stays as it is.
  const existing = await db.customer.findFirst({ where: { locationId: member.location.id, phone, deletedAt: null }, select: { id: true } });
  const entry = await addToWaitlist(db, toActor(member), {
    customerId: existing?.id,
    newCustomer: existing ? undefined : {
      name: v.name,
      phone,
      email: null,
      preferredChannel: v.channels[0] ?? "WHATSAPP",
      consentChannels: v.channels,
      consentSource: `front desk app, recorded by ${member.user.name}`,
    },
    serviceId: v.serviceId || null,
    preferredDays: v.days,
    earliestMinute: parseHm(v.from),
    latestMinute: v.to === "23:59" ? 1440 : parseHm(v.to),
    notes: null,
    expiresAt: null,
  });
  return { id: entry.id };
});
