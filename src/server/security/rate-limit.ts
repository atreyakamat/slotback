import { DomainError } from "../domain/errors";
import { withTx, type Db } from "../domain/types";

export type Limit = { limit: number; windowMs: number };

const MINUTE = 60_000;

/** Budgets for public entry points. Keyed per connection and, where there is one, per target. */
export const LIMITS = {
  signInPerIp: { limit: 30, windowMs: 15 * MINUTE },
  signInPerEmail: { limit: 5, windowMs: 15 * MINUTE },
  signUpPerIp: { limit: 10, windowMs: 60 * MINUTE },
  claimPerIp: { limit: 30, windowMs: 10 * MINUTE },
  pairPerIp: { limit: 10, windowMs: 15 * MINUTE },
  demoDevicePerIp: { limit: 20, windowMs: 60 * MINUTE },
} satisfies Record<string, Limit>;

/**
 * Counts one attempt against `key` and refuses once the window's budget is spent. A transaction-
 * scoped advisory lock on the key makes the count-then-insert atomic, so a burst of parallel
 * requests can't all slip under the limit.
 */
export async function consume(db: Db, key: string, { limit, windowMs }: Limit, now = new Date()) {
  return withTx(db, async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    const recent = await tx.rateLimitHit.count({ where: { key, createdAt: { gte: new Date(now.getTime() - windowMs) } } });
    if (recent >= limit) return false;
    await tx.rateLimitHit.create({ data: { key, createdAt: now } });
    return true;
  });
}

/** Like `consume`, but throws a friendly `rate_limited` error. */
export async function enforce(db: Db, key: string, limit: Limit, message: string, now = new Date()) {
  if (!(await consume(db, key, limit, now))) throw new DomainError("rate_limited", message);
}

/** Drops hits older than any window. Run on a schedule. */
export async function pruneRateLimits(db: Db, now = new Date()) {
  const { count } = await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * MINUTE) } } });
  return count;
}
