import type { Channel } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import { DomainError } from "./errors";
import { withTx, type Actor, type Db } from "./types";

export type CustomerInput = {
  name: string;
  phone: string | null;
  email: string | null;
  preferredChannel: Channel;
  /** Channels the customer has agreed to be contacted on. */
  consentChannels: Channel[];
  consentSource: string;
};

/** Normalises an Indian mobile number to "+91 XXXXX XXXXX". Returns null if it isn't one. */
export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export async function createCustomer(db: Db, actor: Actor, input: CustomerInput) {
  if (!input.phone && !input.email) throw new DomainError("invalid", "Add a phone number or an email address.");
  return withTx(db, async (tx) => {
    if (input.phone) {
      const existing = await tx.customer.findFirst({
        where: { locationId: actor.locationId, phone: input.phone, deletedAt: null },
        select: { id: true, name: true },
      });
      if (existing) throw new DomainError("conflict", `${existing.name} already uses this phone number.`);
    }
    const customer = await tx.customer.create({
      data: {
        locationId: actor.locationId,
        name: input.name.trim(),
        phone: input.phone,
        email: input.email,
        preferredChannel: input.preferredChannel,
        // No row means no consent; only channels the customer agreed to are recorded.
        consents: {
          create: [...new Set(input.consentChannels)].map((channel) => ({
            channel,
            status: "GRANTED" as const,
            source: input.consentSource,
          })),
        },
      },
    });
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "customer",
      entityId: customer.id,
      action: "customer.created",
      metadata: { consentChannels: input.consentChannels },
    });
    return customer;
  });
}
