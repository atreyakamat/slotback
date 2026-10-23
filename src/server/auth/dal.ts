import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { db } from "../db";
import { readSession } from "./session";

export type Member = {
  user: { id: string; name: string; email: string };
  organization: { id: string; name: string; isDemo: boolean };
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

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.userId, organizationId: session.organizationId } },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, isDemo: true } },
    },
  });
  if (!membership) return null;

  const location = await db.location.findFirst({
    where: { id: session.locationId, organizationId: session.organizationId },
    select: { id: true, name: true, timezone: true, currency: true },
  });
  if (!location) return null;

  return { user: membership.user, organization: membership.organization, location, role: membership.role };
});

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
