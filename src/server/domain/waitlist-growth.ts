import { randomBytes } from "node:crypto";
import type { Channel } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import { normalizeIndianPhone } from "./customers";
import { DomainError } from "./errors";
import { type Actor, type Db, withTx } from "./types";

// ─── Join link ───────────────────────────────────────────────────────────────

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newCode() {
  return Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** The location's public self-join code, created on first use. */
export async function ensureJoinCode(db: Db, actor: Actor) {
  const location = await db.location.findUniqueOrThrow({ where: { id: actor.locationId }, select: { joinCode: true } });
  if (location.joinCode) return location.joinCode;
  return rotateJoinCode(db, actor);
}

/** Replaces the code, so links and printed QR codes made before stop working. */
export async function rotateJoinCode(db: Db, actor: Actor) {
  const joinCode = newCode();
  await db.location.update({ where: { id: actor.locationId }, data: { joinCode } });
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "location",
    entityId: actor.locationId,
    action: "waitlist.join_link_reset",
  });
  return joinCode;
}

/** What the public join page may show: the business name and its bookable services. Never customer data. */
export async function getJoinPage(db: Db, code: string) {
  if (!/^[a-z0-9]{6,20}$/.test(code)) return null;
  return db.location.findUnique({
    where: { joinCode: code },
    select: {
      name: true,
      organization: { select: { name: true, isDemo: true } },
      services: { where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}

export const TIME_WINDOWS = {
  any: { label: "Any time", earliest: 0, latest: 1440 },
  morning: { label: "Mornings", earliest: 0, latest: 12 * 60 },
  afternoon: { label: "Afternoons", earliest: 12 * 60, latest: 17 * 60 },
  evening: { label: "Evenings", earliest: 17 * 60, latest: 1440 },
} as const;
export type TimeWindow = keyof typeof TIME_WINDOWS;

export type SelfJoinInput = {
  name: string;
  phone: string;
  serviceId: string | null;
  days: number[];
  window: TimeWindow;
  channels: Channel[];
};

/** Per connection, per business. Clients at the counter often share the shop's Wi-Fi, so this stays roomy. */
export const JOIN_LIMIT_PER_HOUR = 20;

async function hitRateLimit(db: Db, key: string, limit: number, now: Date) {
  const recent = await db.rateLimitHit.count({ where: { key, createdAt: { gte: new Date(now.getTime() - 3600_000) } } });
  if (recent >= limit) throw new DomainError("rate_limited", "Too many sign-ups from this connection. Please ask at the front desk.");
  await db.rateLimitHit.create({ data: { key, createdAt: now } });
}

/**
 * A client adds themselves to a business's waitlist from the public join page.
 * Consent is recorded only for the channels they ticked. Joining twice with the same number
 * updates the existing client instead of creating a duplicate, and the reply is always the same.
 */
export async function selfJoin(db: Db, code: string, input: SelfJoinInput, ctx: { ipHash: string | null; now?: Date }) {
  const now = ctx.now ?? new Date();
  const phone = normalizeIndianPhone(input.phone);
  if (!phone) throw new DomainError("invalid", "Enter a 10-digit Indian mobile number.");
  if (input.days.some((d) => d < 0 || d > 6)) throw new DomainError("invalid", "Invalid day selected.");
  const window = TIME_WINDOWS[input.window];

  const location = await db.location.findUnique({
    where: { joinCode: code },
    select: { id: true, organizationId: true, services: { where: { active: true }, select: { id: true } } },
  });
  if (!location) throw new DomainError("not_found", "This join link is no longer active. Ask the business for a new one.");
  if (input.serviceId && !location.services.some((s) => s.id === input.serviceId)) {
    throw new DomainError("invalid", "Choose a service from the list.");
  }
  if (ctx.ipHash) await hitRateLimit(db, `join:${location.id}:${ctx.ipHash}`, JOIN_LIMIT_PER_HOUR, now);

  return withTx(db, async (tx) => {
    let customer = await tx.customer.findFirst({ where: { locationId: location.id, phone, deletedAt: null }, select: { id: true } });
    if (!customer) {
      customer = await tx.customer.create({
        data: { locationId: location.id, name: input.name.trim(), phone, preferredChannel: input.channels.includes("SMS") && !input.channels.includes("WHATSAPP") ? "SMS" : "WHATSAPP" },
        select: { id: true },
      });
    }
    for (const channel of new Set(input.channels)) {
      await tx.channelConsent.upsert({
        where: { customerId_channel: { customerId: customer.id, channel } },
        update: { status: "GRANTED", source: "self_join" },
        create: { customerId: customer.id, channel, status: "GRANTED", source: "self_join" },
      });
    }
    const existing = await tx.waitlistEntry.findFirst({
      where: { locationId: location.id, customerId: customer.id, status: "ACTIVE", serviceId: input.serviceId },
      select: { id: true },
    });
    const data = {
      preferredDays: [...new Set(input.days)].sort(),
      earliestMinute: window.earliest,
      latestMinute: window.latest,
    };
    const entry = existing
      ? await tx.waitlistEntry.update({ where: { id: existing.id }, data })
      : await tx.waitlistEntry.create({ data: { ...data, locationId: location.id, customerId: customer.id, serviceId: input.serviceId, notes: "Joined from the QR link" } });
    await recordAudit(tx, {
      organizationId: location.organizationId,
      actorType: "CUSTOMER",
      actorId: customer.id,
      entityType: "waitlist_entry",
      entityId: entry.id,
      action: existing ? "waitlist.self_updated" : "waitlist.self_joined",
      metadata: { channels: input.channels },
    });
    return entry;
  });
}

// ─── Import ──────────────────────────────────────────────────────────────────

export type ImportRow = { line: number; name: string; phone: string; email: string; service: string };
export type ImportResult = { added: number; updated: number; skipped: { line: number; reason: string }[] };

const HEADERS = {
  name: ["name", "full name", "client", "customer", "client name", "customer name"],
  phone: ["phone", "mobile", "whatsapp", "phone number", "mobile number", "contact", "number"],
  email: ["email", "e-mail", "email address"],
  service: ["service", "treatment", "wants"],
};

/** Maps spreadsheet rows to import rows. The first row must be a header naming at least a name and a phone column. */
export function mapImportRows(rows: string[][]): ImportRow[] {
  const [header, ...body] = rows;
  if (!header) throw new DomainError("invalid", "The file is empty.");
  const find = (names: string[]) => header.findIndex((h) => names.includes(h.trim().toLowerCase()));
  const col = { name: find(HEADERS.name), phone: find(HEADERS.phone), email: find(HEADERS.email), service: find(HEADERS.service) };
  if (col.name < 0 || col.phone < 0) throw new DomainError("invalid", "The first row needs a “Name” column and a “Phone” column.");
  if (body.length > 1000) throw new DomainError("invalid", "Import up to 1,000 clients at a time.");
  const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  return body.map((r, i) => ({ line: i + 2, name: at(r, col.name), phone: at(r, col.phone), email: at(r, col.email), service: at(r, col.service) }));
}

/**
 * Adds imported clients to the waitlist for any day and time. With `attested`, the owner confirms these
 * clients agreed to messages, and WhatsApp + SMS consent is recorded with that as the source; without it,
 * clients are added but can't be messaged until consent is given.
 */
export async function importWaitlist(db: Db, actor: Actor, rows: ImportRow[], opts: { attested: boolean }): Promise<ImportResult> {
  const services = await db.service.findMany({ where: { locationId: actor.locationId, active: true }, select: { id: true, name: true } });
  const serviceByName = new Map(services.map((s) => [s.name.toLowerCase(), s.id]));
  const result: ImportResult = { added: 0, updated: 0, skipped: [] };
  const seen = new Set<string>();

  for (const row of rows) {
    if (row.name.length < 2) {
      result.skipped.push({ line: row.line, reason: "Missing name" });
      continue;
    }
    const phone = normalizeIndianPhone(row.phone);
    if (!phone) {
      result.skipped.push({ line: row.line, reason: row.phone ? `“${row.phone}” isn’t an Indian mobile number` : "Missing phone" });
      continue;
    }
    if (seen.has(phone)) {
      result.skipped.push({ line: row.line, reason: "Same phone as an earlier row" });
      continue;
    }
    seen.add(phone);
    const serviceId = row.service ? (serviceByName.get(row.service.toLowerCase()) ?? null) : null;
    const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email) ? row.email.toLowerCase() : null;

    await withTx(db, async (tx) => {
      let customer = await tx.customer.findFirst({ where: { locationId: actor.locationId, phone, deletedAt: null }, select: { id: true } });
      const isNew = !customer;
      if (!customer) {
        customer = await tx.customer.create({ data: { locationId: actor.locationId, name: row.name.slice(0, 80), phone, email }, select: { id: true } });
      }
      if (opts.attested) {
        for (const channel of ["WHATSAPP", "SMS"] as const) {
          const current = await tx.channelConsent.findUnique({ where: { customerId_channel: { customerId: customer.id, channel } } });
          // Never override a client's own opt-out with an import.
          if (current?.status === "REVOKED") continue;
          await tx.channelConsent.upsert({
            where: { customerId_channel: { customerId: customer.id, channel } },
            update: { status: "GRANTED", source: "import:owner_attested" },
            create: { customerId: customer.id, channel, status: "GRANTED", source: "import:owner_attested" },
          });
        }
      }
      const existing = await tx.waitlistEntry.findFirst({ where: { locationId: actor.locationId, customerId: customer.id, status: "ACTIVE", serviceId } });
      if (!existing) {
        await tx.waitlistEntry.create({ data: { locationId: actor.locationId, customerId: customer.id, serviceId, preferredDays: [], notes: "Imported" } });
      }
      if (isNew) result.added++;
      else result.updated++;
    });
  }

  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "location",
    entityId: actor.locationId,
    action: "waitlist.imported",
    metadata: { added: result.added, updated: result.updated, skipped: result.skipped.length, attested: opts.attested },
  });
  return result;
}
