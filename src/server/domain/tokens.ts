import { createHash, randomBytes } from "node:crypto";

/** 256-bit random, URL-safe claim token. Only its hash is ever stored. */
export function generateClaimToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashClaimToken(token) };
}

export function hashClaimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cheap shape check before touching the database. */
export function looksLikeClaimToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
