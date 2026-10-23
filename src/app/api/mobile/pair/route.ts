import { db } from "@/server/db";
import { completePairing } from "@/server/domain/devices";
import { DomainError } from "@/server/domain/errors";
import { mobileError, readJson } from "@/server/mobile/route";

/** The app scanned a pairing QR: swap its one-time code for a device token. */
export async function POST(request: Request) {
  const body = await readJson(request);
  try {
    const { token } = await completePairing(db, String(body.code ?? ""), typeof body.deviceName === "string" ? body.deviceName : null);
    return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof DomainError) return mobileError(422, err.message);
    throw err;
  }
}
