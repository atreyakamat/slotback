import { db } from "@/server/db";
import { demoSessionTarget } from "@/server/demo/target";
import { createDemoDevice } from "@/server/domain/devices";
import { DomainError } from "@/server/domain/errors";
import { env } from "@/server/env";
import { mobileError } from "@/server/mobile/route";
import { LIMITS } from "@/server/security/rate-limit";
import { limitByIp } from "@/server/security/request";

/** Signs the app in to the fictional demo salon, so anyone can try it without an account. */
export async function POST() {
  if (!env().DEMO_MODE) return mobileError(403, "The demo is switched off on this site.");
  try {
    await limitByIp("demo-device", LIMITS.demoDevicePerIp, "Too many demo sign-ins from this connection. Try again later.");
  } catch (err) {
    if (err instanceof DomainError) return mobileError(429, err.message);
    throw err;
  }
  const { token } = await createDemoDevice(db, await demoSessionTarget(db));
  return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
