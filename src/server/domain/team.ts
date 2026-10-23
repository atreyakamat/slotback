import type { Role } from "@/generated/prisma/client";
import { normalizeEmail } from "./accounts";
import { recordAudit } from "./audit";
import { DomainError } from "./errors";
import { generateClaimToken, hashClaimToken, looksLikeClaimToken } from "./tokens";
import { type Actor, type Db, withTx } from "./types";

export const INVITE_TTL_DAYS = 7;

/** Roles a person can hand out. Owners invite admins and staff; admins invite staff. Nobody invites owners. */
export function assignableRoles(role: Role): Role[] {
  if (role === "OWNER") return ["ADMIN", "STAFF"];
  if (role === "ADMIN") return ["STAFF"];
  return [];
}

type TeamActor = Actor & { role: Role };

export async function listTeam(db: Db, actor: Actor, now = new Date()) {
  const [members, invites] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: actor.organizationId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
    }),
    db.invite.findMany({
      where: { organizationId: actor.organizationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, expiresAt: true },
    }),
  ]);
  return { members, invites };
}

/**
 * Creates an invite and returns the one-time link token. Inviting the same email again replaces
 * the old link, so an owner who lost the link just invites again.
 */
export async function createInvite(db: Db, actor: TeamActor, input: { email: string; name: string; role: Role }, now = new Date()) {
  if (!assignableRoles(actor.role).includes(input.role)) {
    throw new DomainError("forbidden", "You can't invite someone with that role.");
  }
  const email = normalizeEmail(input.email);
  return withTx(db, async (tx) => {
    const member = await tx.membership.findFirst({ where: { organizationId: actor.organizationId, user: { email } }, select: { id: true } });
    if (member) throw new DomainError("conflict", "That person is already on your team.");
    await tx.invite.updateMany({
      where: { organizationId: actor.organizationId, email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    const { token, hash } = generateClaimToken();
    const invite = await tx.invite.create({
      data: {
        organizationId: actor.organizationId,
        email,
        name: input.name,
        role: input.role,
        tokenHash: hash,
        invitedById: actor.userId,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 86_400_000),
      },
    });
    await recordAudit(tx, {
      organizationId: actor.organizationId,
      actorType: "USER",
      actorId: actor.userId,
      entityType: "invite",
      entityId: invite.id,
      action: "member.invited",
      metadata: { role: input.role },
    });
    return { invite, token };
  });
}

export async function revokeInvite(db: Db, actor: TeamActor, inviteId: string, now = new Date()) {
  if (assignableRoles(actor.role).length === 0) throw new DomainError("forbidden", "Only owners and admins manage the team.");
  const { count } = await db.invite.updateMany({
    where: { id: inviteId, organizationId: actor.organizationId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  if (count === 0) throw new DomainError("not_found", "That invite was already used or cancelled.");
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "invite",
    entityId: inviteId,
    action: "member.invite_revoked",
  });
}

export type InviteView =
  | { state: "invalid" }
  | { state: "expired" | "used"; businessName: string }
  | { state: "valid"; businessName: string; email: string; name: string; role: Role };

/** What the public invite page shows for a link. */
export async function viewInvite(db: Db, token: string, now = new Date()): Promise<InviteView> {
  if (!looksLikeClaimToken(token)) return { state: "invalid" };
  const invite = await db.invite.findUnique({
    where: { tokenHash: hashClaimToken(token) },
    select: { email: true, name: true, role: true, expiresAt: true, acceptedAt: true, revokedAt: true, organization: { select: { name: true } } },
  });
  if (!invite || invite.revokedAt) return { state: "invalid" };
  const businessName = invite.organization.name;
  if (invite.acceptedAt) return { state: "used", businessName };
  if (invite.expiresAt <= now) return { state: "expired", businessName };
  return { state: "valid", businessName, email: invite.email, name: invite.name, role: invite.role };
}

/**
 * Called after an email is verified by a sign-in link: turns every open invite for that email
 * into a membership. Returns the businesses joined, newest invite first.
 */
export async function acceptInvites(db: Db, rawEmail: string, now = new Date()): Promise<string[]> {
  const email = normalizeEmail(rawEmail);
  return withTx(db, async (tx) => {
    const invites = await tx.invite.findMany({
      where: { email, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (invites.length === 0) return [];
    const user =
      (await tx.user.findUnique({ where: { email } })) ?? (await tx.user.create({ data: { email, name: invites[0].name } }));
    const joined: string[] = [];
    for (const invite of invites) {
      const existing = await tx.membership.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: invite.organizationId } },
      });
      if (!existing) {
        await tx.membership.create({ data: { userId: user.id, organizationId: invite.organizationId, role: invite.role } });
        await recordAudit(tx, {
          organizationId: invite.organizationId,
          actorType: "USER",
          actorId: user.id,
          entityType: "invite",
          entityId: invite.id,
          action: "member.joined",
          metadata: { role: invite.role },
        });
        joined.push(invite.organizationId);
      }
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: now } });
    }
    return joined;
  });
}

async function loadTarget(db: Db, actor: TeamActor, membershipId: string) {
  const target = await db.membership.findFirst({ where: { id: membershipId, organizationId: actor.organizationId } });
  if (!target) throw new DomainError("not_found", "That team member was not found.");
  if (target.userId === actor.userId) throw new DomainError("forbidden", "You can't change your own access.");
  if (target.role === "OWNER") throw new DomainError("forbidden", "The owner's access can't be changed.");
  if (!assignableRoles(actor.role).includes(target.role)) throw new DomainError("forbidden", "You can't change that person's access.");
  return target;
}

export async function changeRole(db: Db, actor: TeamActor, membershipId: string, role: Role) {
  const target = await loadTarget(db, actor, membershipId);
  if (!assignableRoles(actor.role).includes(role)) throw new DomainError("forbidden", "You can't give that role.");
  await db.membership.update({ where: { id: target.id }, data: { role } });
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "membership",
    entityId: target.id,
    action: "member.role_changed",
    metadata: { from: target.role, to: role },
  });
}

/** Removes someone's access. Their session stops working on the next request, because every request re-checks membership. */
export async function removeMember(db: Db, actor: TeamActor, membershipId: string) {
  const target = await loadTarget(db, actor, membershipId);
  await db.membership.delete({ where: { id: target.id } });
  await recordAudit(db, {
    organizationId: actor.organizationId,
    actorType: "USER",
    actorId: actor.userId,
    entityType: "membership",
    entityId: target.id,
    action: "member.removed",
    metadata: { role: target.role },
  });
}
