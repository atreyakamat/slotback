import "server-only";
import { createServerClient } from "@supabase/ssr";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DomainError } from "../domain/errors";
import { env } from "../env";

export type EmailSignInMode = "supabase" | "dev-insecure";
export type LinkDelivery = { kind: "emailed" } | { kind: "shown"; url: string };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Which email sign-in is active, or null when it is off or misconfigured. The insecure dev mode never runs off localhost. */
export function emailSignInMode(): EmailSignInMode | null {
  const e = env();
  if (e.AUTH_EMAIL_PROVIDER === "supabase") return e.SUPABASE_URL && e.SUPABASE_ANON_KEY ? "supabase" : null;
  if (e.AUTH_EMAIL_PROVIDER === "dev-insecure") return LOCAL_HOSTS.has(new URL(e.NEXT_PUBLIC_APP_URL).hostname) ? "dev-insecure" : null;
  return null;
}

function devKey() {
  return new TextEncoder().encode(`${env().SESSION_SECRET}:sign-in-link`);
}

/** A Supabase client used only to send and verify sign-in emails. Its own session is discarded after verification. */
async function supabase() {
  const store = await cookies();
  const e = env();
  return createServerClient(e.SUPABASE_URL!, e.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
}

function callbackUrl() {
  return new URL("/auth/callback", env().NEXT_PUBLIC_APP_URL);
}

export async function sendSignInLink(email: string): Promise<LinkDelivery> {
  const mode = emailSignInMode();
  if (mode === "supabase") {
    const { error } = await (await supabase()).auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl().toString(), shouldCreateUser: true },
    });
    if (error?.status === 429) throw new DomainError("rate_limited", "Too many sign-in emails. Try again in a few minutes.");
    if (error) throw new DomainError("invalid", "We couldn't send the sign-in email. Check the address and try again.");
    return { kind: "emailed" };
  }
  if (mode === "dev-insecure") {
    const token = await new SignJWT({ email, purpose: "sign-in" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(devKey());
    const url = callbackUrl();
    url.searchParams.set("dev_token", token);
    return { kind: "shown", url: url.toString() };
  }
  throw new DomainError("forbidden", "Email sign-in isn't switched on yet.");
}

/** Checks the link the person clicked and returns their verified email, or null if the link is invalid or expired. */
export async function verifySignInCallback(url: URL): Promise<string | null> {
  const mode = emailSignInMode();
  if (mode === "supabase") {
    const client = await supabase();
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const result = code
      ? await client.auth.exchangeCodeForSession(code)
      : tokenHash
        ? await client.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
        : null;
    const email = result && !result.error ? result.data.user?.email : null;
    // SlotBack keeps its own session; drop the Supabase one.
    if (email) await client.auth.signOut({ scope: "local" });
    return email ?? null;
  }
  if (mode === "dev-insecure") {
    const token = url.searchParams.get("dev_token");
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, devKey(), { algorithms: ["HS256"] });
      return payload.purpose === "sign-in" && typeof payload.email === "string" ? payload.email : null;
    } catch {
      return null;
    }
  }
  return null;
}
