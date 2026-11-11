import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NewBusiness } from "../domain/accounts";
import { VERTICAL_OPTIONS } from "../domain/verticals";
import { env } from "../env";

const COOKIE = "slotback_signup";
const TTL_SECONDS = 60 * 60;

function key() {
  return new TextEncoder().encode(`${env().SESSION_SECRET}:signup`);
}

/** Holds the sign-up details until the email link is clicked, signed so they can't be altered in between. */
export async function saveSignupIntent(intent: NewBusiness) {
  const token = await new SignJWT({ ...intent }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${TTL_SECONDS}s`).sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function readSignupIntent(): Promise<NewBusiness | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const p = payload as Partial<NewBusiness>;
    const vertical = VERTICAL_OPTIONS.find((v) => v.value === p.vertical)?.value;
    if (!p.email || !p.ownerName || !p.businessName || !vertical) return null;
    return { email: p.email, ownerName: p.ownerName, businessName: p.businessName, city: p.city ?? "", vertical };
  } catch {
    return null;
  }
}

export async function clearSignupIntent() {
  (await cookies()).delete(COOKIE);
}
