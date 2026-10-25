import { recordAudit } from "./audit";
import { DomainError } from "./errors";
import { generateClaimToken, hashClaimToken, looksLikeClaimToken } from "./tokens";
import type { Actor, Db } from "./types";

export const PAIR_TTL_MINUTES = 10;
/** Last-used times are only refreshed this often, so every API call isn't a database write. */
const TOUCH_EVERY_MS = 5 * 60_000;

type SessionIds = { userId: string; organizationId: string; locationId: string };

/** Starts pairing a phone for the signed-in member. The code goes into a QR shown in their browser. */
export async function createPairing(db: Db, actor: Actor, now = new Date()) {
  const { token, hash } = generateClaimToken();
  const expiresAt = new Date(now.getTime() + PAIR_TTL_MINUTES * 60_000);
  await db.deviceSession.create({
    data: { userId: actor.userId, organizationId: actor.organizationId, locationId: actor.locationId, pairHash: hash, pairExpiresAt: expiresAt },
  });
  return { code: token, expiresAt };
}

/** Swaps a pairing code (one use, 10 minutes) for a long-lived device token. */
export async function completePairing(db: Db, code: string, deviceName: string | null, now = new Date()) {
  if (!looksLikeClaimToken(code)) throw new DomainError("invalid", "That code isn't valid. Show a new QR code and try again.");
  const { token, hash } = generateClaimToken();
  const { count } = await db.deviceSession.updateMany({
    where: { pairHash: hashClaimToken(code), pairExpiresAt: { gt: now }, pairedAt: null, revokedAt: null },
    data: { pairHash: null, pairExpiresAt: null, tokenHash: hash, pairedAt: now, lastUsedAt: now, deviceName: deviceName?.slice(0, 80) ?? null },
  });
  if (count === 0) throw new DomainError("invalid", "That code has expired or was already used. Show a new QR code and try again.");
  const device = await db.deviceSession.findUniqueOrThrow({ where: { tokenHash: hash } });
  await recordAudit(db, {
    organizationId: device.organizationId,
    actorType: "USER",
    actorId: device.userId,
    entityType: "device",
    entityId: device.id,
    action: "device.paired",
  });
  return { token };
}

/** Issues a device token straight away. Only for the demo workspace, which holds no real data. */
export async function createDemoDevice(db: Db, ids: SessionIds, now = new Date()) {
  const { token, hash } = generateClaimToken();
  await db.deviceSession.create({ data: { ...ids, tokenHash: hash, pairedAt: now, lastUsedAt: now, deviceName: "Demo" } });
  return { token };
}

/**
 * The session a device token stands for, or null. Like the web session, it is checked against
 * the live membership on every call, so removing someone from the team signs out their phone too.
 */
export async function resolveDevice(db: Db, token: string, now = new Date()): Promise<(SessionIds & { deviceId: string }) | null> {
  if (!looksLikeClaimToken(token)) return null;
  const device = await db.deviceSession.findUnique({ where: { tokenHash: hashClaimToken(token) } });
  if (!device || device.revokedAt) return null;
  const member = await db.membership.findUnique({
    where: { userId_organizationId: { userId: device.userId, organizationId: device.organizationId } },
    select: { id: true },
  });
  if (!member) return null;
  if (!device.lastUsedAt || now.getTime() - device.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
    await db.deviceSession.update({ where: { id: device.id }, data: { lastUsedAt: now } });
  }
  return { deviceId: device.id, userId: device.userId, organizationId: device.organizationId, locationId: device.locationId };
}

export async function listDevices(db: Db, actor: Actor) {
  return db.deviceSession.findMany({
    where: { userId: actor.userId, organizationId: actor.organizationId, pairedAt: { not: null }, revokedAt: null },
    orderBy: { pairedAt: "desc" },
    select: { id: true, deviceName: true, pairedAt: true, lastUsedAt: true },
  });
}

/** Signs a phone out. Members can sign out their own devices. */
export async function revokeDevice(db: Db, ids: { userId: string; organizationId: string }, deviceId: string, now = new Date()) {
  const { count } = await db.deviceSession.updateMany({
    where: { id: deviceId, userId: ids.userId, organizationId: ids.organizationId, revokedAt: null },
    data: { revokedAt: now },
  });
  if (count === 0) throw new DomainError("not_found", "That device was already signed out.");
}
