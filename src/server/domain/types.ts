import type { Prisma, PrismaClient } from "@/generated/prisma/client";

/** Either the root client or a transaction client. Domain functions accept both. */
export type Db = PrismaClient | Prisma.TransactionClient;

/** The tenant + actor a domain operation runs as. Always derived from the verified session. */
export type Actor = {
  userId: string;
  organizationId: string;
  locationId: string;
  timezone: string;
};

export function isRootClient(db: Db): db is PrismaClient {
  return "$transaction" in db;
}

/** Runs `fn` in a transaction, or inside the caller's transaction if one is already open. */
export async function withTx<T>(db: Db, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  if (isRootClient(db)) return db.$transaction(fn);
  return fn(db);
}
