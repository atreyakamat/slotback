import { db } from "@/server/db";
import { demoSessionTarget } from "@/server/demo/target";
import { createDemoDevice } from "@/server/domain/devices";
import { env } from "@/server/env";
import { mobileError } from "@/server/mobile/route";

/** Signs the app in to the fictional demo salon, so anyone can try it without an account. */
export async function POST() {
  if (!env().DEMO_MODE) return mobileError(403, "The demo is switched off on this site.");
  const { token } = await createDemoDevice(db, await demoSessionTarget(db));
  return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
