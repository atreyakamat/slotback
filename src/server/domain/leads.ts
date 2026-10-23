import { createHmac } from "node:crypto";
import { normalizeIndianPhone } from "./customers";
import { DomainError } from "./errors";
import type { Db } from "./types";

export const VERTICALS = ["Salon", "Spa", "Dental clinic", "Physiotherapy", "Skin clinic", "Other"] as const;

export type LeadInput = {
  name: string;
  business: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  vertical?: string | null;
  message?: string | null;
};

const PER_HOUR = 5;

/** Keyed hash so the same IP can be rate limited without the IP itself ever being stored. */
export function hashIp(ip: string, secret: string) {
  return createHmac("sha256", secret).update(ip).digest("hex");
}

/** Stores a "book a demo" request. Requires a reachable contact and limits repeat submissions per IP. */
export async function createLead(db: Db, input: LeadInput, ctx: { ipHash: string | null; now?: Date }) {
  const now = ctx.now ?? new Date();
  const phone = input.phone ? normalizeIndianPhone(input.phone) : null;
  if (input.phone && !phone) throw new DomainError("invalid", "Enter a 10-digit Indian mobile number.");
  const email = input.email?.trim().toLowerCase() || null;
  if (!phone && !email) throw new DomainError("invalid", "Add a phone number or an email so we can reach you.");

  if (ctx.ipHash) {
    const recent = await db.lead.count({
      where: { ipHash: ctx.ipHash, createdAt: { gte: new Date(now.getTime() - 3600_000) } },
    });
    if (recent >= PER_HOUR) {
      throw new DomainError("rate_limited", "We've already received a few requests from you. We'll be in touch soon.");
    }
  }

  return db.lead.create({
    data: {
      name: input.name.trim(),
      business: input.business.trim(),
      phone,
      email,
      city: input.city?.trim() || null,
      vertical: input.vertical || null,
      message: input.message?.trim() || null,
      ipHash: ctx.ipHash,
    },
  });
}
