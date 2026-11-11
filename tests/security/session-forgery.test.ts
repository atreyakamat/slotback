import { SignJWT, UnsecuredJWT } from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const SECRET = "test-secret-test-secret-test-secret-123";
const ids = { userId: "u1", organizationId: "o1", locationId: "l1" };

beforeAll(() => {
  process.env.DATABASE_URL ??= "postgresql://unused";
  process.env.SESSION_SECRET = SECRET;
});

async function session() {
  return import("@/server/auth/session");
}

function sign(payload: Record<string, unknown>, opts: { key?: string; alg?: string; exp?: string | number } = {}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: opts.alg ?? "HS256" })
    .setIssuedAt()
    .setExpirationTime(opts.exp ?? "1h")
    .sign(new TextEncoder().encode(opts.key ?? SECRET));
}

/** Attack: forge, downgrade or replay the session cookie to get into someone else's business. */
describe("attack: session cookie forgery", () => {
  it("accepts only a well-formed token signed with the server key", async () => {
    const { verifySession } = await session();
    expect(await verifySession(await sign({ ...ids, sv: 0 }))).toEqual({ ...ids, sessionVersion: 0 });
  });

  it("refuses an unsigned token (alg: none)", async () => {
    const { verifySession } = await session();
    const unsigned = new UnsecuredJWT({ ...ids, sv: 0 }).setIssuedAt().setExpirationTime("1h").encode();
    expect(await verifySession(unsigned)).toBeNull();
  });

  it("refuses a token signed with a guessed or leaked-elsewhere key", async () => {
    const { verifySession } = await session();
    for (const key of ["secret", "slotback", "local-dev-secret-local-dev-secret-0123", SECRET.toUpperCase()]) {
      expect(await verifySession(await sign({ ...ids, sv: 0 }, { key }))).toBeNull();
    }
  });

  it("refuses a different algorithm, even with the right key", async () => {
    const { verifySession } = await session();
    expect(await verifySession(await sign({ ...ids, sv: 0 }, { alg: "HS512" }))).toBeNull();
  });

  it("refuses an expired token", async () => {
    const { verifySession } = await session();
    expect(await verifySession(await sign({ ...ids, sv: 0 }, { exp: Math.floor(Date.now() / 1000) - 60 }))).toBeNull();
  });

  it("refuses tokens with missing or mistyped claims", async () => {
    const { verifySession } = await session();
    expect(await verifySession(await sign({ ...ids }))).toBeNull(); // issued before revocation existed
    expect(await verifySession(await sign({ ...ids, sv: "0" }))).toBeNull();
    expect(await verifySession(await sign({ ...ids, sv: 0, userId: ["u1", "u2"] }))).toBeNull();
    expect(await verifySession(await sign({ userId: "u1", sv: 0 }))).toBeNull();
  });

  it("refuses a payload swapped under a valid signature", async () => {
    const { signSession, verifySession } = await session();
    const [h, , s] = (await signSession(ids, 0)).split(".");
    const forged = Buffer.from(JSON.stringify({ ...ids, organizationId: "victim", sv: 0 })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`)).toBeNull();
  });

  it("refuses garbage of every shape", async () => {
    const { verifySession } = await session();
    for (const junk of ["", ".", "..", "a.b.c", "x".repeat(10_000), "' OR 1=1 --", "<script>alert(1)</script>"]) {
      expect(await verifySession(junk)).toBeNull();
    }
  });
});
