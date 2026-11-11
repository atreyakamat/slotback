import "server-only";
import { headers } from "next/headers";
import { db } from "../db";
import { env } from "../env";
import { clientIp, hashIp } from "./client-ip";
import { enforce, type Limit } from "./rate-limit";

/** Hashed IP of the current request (null when unknown), for rate-limit keys and lead records. */
export async function requestIpHash() {
  const ip = clientIp(await headers());
  return ip ? hashIp(ip, env().SESSION_SECRET) : null;
}

/** A keyed hash of any identifier (an email, say), so rate-limit rows never hold it in the clear. */
export function keyHash(value: string) {
  return hashIp(value, env().SESSION_SECRET);
}

/**
 * Spends one attempt from the current visitor's budget for `scope`. Visitors without a known IP
 * (only possible off Netlify) share no bucket and are not limited per connection; per-target
 * limits still apply to them.
 */
export async function limitByIp(scope: string, limit: Limit, message: string) {
  const ip = await requestIpHash();
  if (ip) await enforce(db, `${scope}:ip:${ip}`, limit, message);
}
