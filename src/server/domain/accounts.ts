import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "./audit";
import type { BusinessHours } from "./catalogue";
import { DomainError } from "./errors";
import { type Db, withTx } from "./types";
import type { Vertical } from "./verticals";

/** Monday to Saturday, 10:00 to 20:00. The owner adjusts it in the first onboarding step. */
export const DEFAULT_HOURS: BusinessHours = Object.fromEntries(
  [0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), d === 0 ? [] : [{ open: "10:00", close: "20:00" }]]),
);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type NewBusiness = {
  email: string;
  ownerName: string;
  businessName: string;
  city: string;
  vertical: Vertical;
};

/**
 * Creates a business with one location and its owner. The email must already be verified by the caller.
 * An email that already owns or belongs to a business is refused, so sign-up can't be used to join someone else's.
 */
export async function createBusiness(db: Db, input: NewBusiness) {
  const email = normalizeEmail(input.email);
  return withTx(db, async (tx) => {
    const existing = await tx.user.findUnique({ where: { email }, select: { id: true, _count: { select: { memberships: true } } } });
    if (existing && existing._count.memberships > 0) {
      throw new DomainError("conflict", "That email already has a SlotBack account. Sign in instead.");
    }
    const user = existing
      ? await tx.user.update({ where: { id: existing.id }, data: { name: input.ownerName } })
      : await tx.user.create({ data: { email, name: input.ownerName } });

    const org = await tx.organization.create({
      data: {
        name: input.businessName,
        vertical: input.vertical,
        city: input.city,
        memberships: { create: { userId: user.id, role: "OWNER" } },
        locations: {
          create: {
            name: input.city ? `${input.businessName} · ${input.city}` : input.businessName,
            timezone: "Asia/Kolkata",
            currency: "INR",
            businessHours: DEFAULT_HOURS as Prisma.InputJsonValue,
          },
        },
      },
      select: { id: true, locations: { select: { id: true } } },
    });

    await recordAudit(tx, {
      organizationId: org.id,
      actorType: "USER",
      actorId: user.id,
      entityType: "organization",
      entityId: org.id,
      action: "organization.created",
      metadata: { vertical: input.vertical },
    });

    return { userId: user.id, organizationId: org.id, locationId: org.locations[0].id };
  });
}

/**
 * The workspace an email signs into: the business it just joined if given, otherwise its oldest
 * membership, and that business's first location.
 */
export async function findSignIn(db: Db, email: string, preferOrganizationId?: string) {
  const membership = await db.membership.findFirst({
    where: {
      user: { email: normalizeEmail(email) },
      organization: { isDemo: false },
      ...(preferOrganizationId ? { organizationId: preferOrganizationId } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      userId: true,
      organizationId: true,
      organization: { select: { onboardedAt: true, locations: { select: { id: true }, orderBy: { createdAt: "asc" }, take: 1 } } },
    },
  });
  const location = membership?.organization.locations[0];
  if (!membership || !location) return null;
  return {
    session: { userId: membership.userId, organizationId: membership.organizationId, locationId: location.id },
    onboarded: membership.organization.onboardedAt !== null,
  };
}
