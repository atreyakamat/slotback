import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { db } from "../db";
import type { Actor } from "../domain/types";
import { readSession } from "./session";

export type Member = {
  user: { id: string; name: string; email: string };
  organization: { id: string; name: string; isDemo: boolean; onboardedAt: Date | null };
  location: { id: string; name: string; timezone: string; currency: string };
  role: Role;
};

/**
 * Data access layer entry point. Verifies the session cookie AND the membership in the
 * database on every request, so a revoked member loses access immediately.
 * Every tenant-scoped query must use the ids returned here, never ids from the client.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  const session = await readSession();
  if (!session) return null;
  return loadMember(session);
});

/** Builds a Member from session ids, re-checking the membership and location. Shared by the web session and app device tokens. */
export async function loadMember(session: { userId: string; organizationId: string; locationId: string }): Promise<Member | null> {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.userId, organizationId: session.organizationId } },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, isDemo: true, onboardedAt: true } },
    },
  });
  if (!membership) return null;

  const location = await db.location.findFirst({
    where: { id: session.locationId, organizationId: session.organizationId },
    select: { id: true, name: true, timezone: true, currency: true },
  });
  if (!location) return null;

  return { user: membership.user, organization: membership.organization, location, role: membership.role };
}

export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireRole(...roles: Role[]): Promise<Member> {
  const member = await requireMember();
  if (!roles.includes(member.role)) redirect("/app?error=forbidden");
  return member;
}

/** The domain-layer view of a member: tenant ids and timezone, nothing from the client. */
export function toActor(member: Member): Actor {
  return {
    userId: member.user.id,
    organizationId: member.organization.id,
    locationId: member.location.id,
    timezone: member.location.timezone,
  };
}

/** Owners and admins manage the catalogue and settings; staff run the day. */
export function canManage(member: Member) {
  return member.role === "OWNER" || member.role === "ADMIN";
}
