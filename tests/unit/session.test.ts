import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

beforeAll(() => {
  process.env.DATABASE_URL ??= "postgresql://unused";
  process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
});

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const { signSession, verifySession } = await import("@/server/auth/session");
    const token = await signSession({ userId: "u1", organizationId: "o1", locationId: "l1" }, 0);
    expect(await verifySession(token)).toEqual({ userId: "u1", organizationId: "o1", locationId: "l1", sessionVersion: 0 });
  });

  it("rejects a tampered token", async () => {
    const { signSession, verifySession } = await import("@/server/auth/session");
    const token = await signSession({ userId: "u1", organizationId: "o1", locationId: "l1" }, 0);
    const [h, p, s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "attacker", organizationId: "o1", locationId: "l1" })).toString(
      "base64url",
    );
    expect(await verifySession(`${h}.${forged}.${s}`)).toBeNull();
    expect(await verifySession(`${h}.${p}.invalid`)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});
