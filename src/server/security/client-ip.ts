import { createHmac } from "node:crypto";

/**
 * The visitor's IP address, or null when it isn't known.
 *
 * Netlify's edge sets `x-nf-client-connection-ip` from the TCP connection and replaces any copy
 * the client sent, so it can be trusted. `X-Forwarded-For` is deliberately ignored: its left-most
 * entry is whatever the client chose to send, so trusting it would let an attacker pick a fresh
 * "IP" for every request and walk straight past rate limits.
 */
export function clientIp(headers: Headers): string | null {
  const ip = headers.get("x-nf-client-connection-ip")?.trim();
  return ip && ip.length <= 64 ? ip : null;
}

/** A keyed hash of the IP, so rate-limit rows and leads never store the raw address. */
export function hashIp(ip: string, secret: string) {
  return createHmac("sha256", secret).update(ip).digest("hex");
}
