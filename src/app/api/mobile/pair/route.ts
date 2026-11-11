import { db } from "@/server/db";
import { completePairing } from "@/server/domain/devices";
import { DomainError } from "@/server/domain/errors";
import { mobileError, readJson } from "@/server/mobile/route";
import { LIMITS } from "@/server/security/rate-limit";
import { limitByIp } from "@/server/security/request";

/** The app scanned a pairing QR: swap its one-time code for a device token. */
export async function POST(request: Request) {
  try {
    await limitByIp("pair", LIMITS.pairPerIp, "Too many attempts. Wait a few minutes, then scan a new QR code.");
    const body = await readJson(request);
    const { token } = await completePairing(db, String(body.code ?? ""), typeof body.deviceName === "string" ? body.deviceName : null);
    return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof DomainError) return mobileError(err.code === "rate_limited" ? 429 : 422, err.message);
    throw err;
  }
}
