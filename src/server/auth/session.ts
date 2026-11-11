import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "../db";
import { env } from "../env";

/**
 * In production the cookie uses the `__Host-` prefix, which browsers only accept when it is
 * Secure, set from HTTPS, scoped to "/" and has no Domain: a sibling subdomain can't plant or
 * overwrite it.
 */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-slotback_session" : "slotback_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionPayload = {
  userId: string;
  organizationId: string;
  locationId: string;
};

/** A verified session, with the user's session version at the time it was issued. */
export type VerifiedSession = SessionPayload & { sessionVersion: number };

function key() {
  return new TextEncoder().encode(env().SESSION_SECRET);
}

export async function signSession(payload: SessionPayload, sessionVersion: number): Promise<string> {
  return new SignJWT({ ...payload, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<VerifiedSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const { userId, organizationId, locationId, sv } = payload as Partial<SessionPayload> & { sv?: unknown };
    if (typeof userId !== "string" || typeof organizationId !== "string" || typeof locationId !== "string") return null;
    if (typeof sv !== "number" || !Number.isInteger(sv)) return null;
    return { userId, organizationId, locationId, sessionVersion: sv };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const user = await db.user.findUniqueOrThrow({ where: { id: payload.userId }, select: { sessionVersion: true } });
  const token = await signSession(payload, user.sessionVersion);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function readSession(): Promise<VerifiedSession | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Signs out this browser. For real businesses it also signs the user out everywhere else, so a
 * copied cookie stops working the moment they sign out. The demo login is shared by every visitor,
 * so signing out there only clears this browser.
 */
export async function destroySession() {
  const session = await readSession();
  if (session) {
    const org = await db.organization.findUnique({ where: { id: session.organizationId }, select: { isDemo: true } });
    if (org && !org.isDemo) {
      await db.user.updateMany({
        where: { id: session.userId, sessionVersion: session.sessionVersion },
        data: { sessionVersion: { increment: 1 } },
      });
    }
  }
  (await cookies()).delete(SESSION_COOKIE);
}
