import "server-only";
import { isId } from "@/lib/ids";
import { loadMember, type Member } from "../auth/dal";
import { db } from "../db";
import { resolveDevice } from "../domain/devices";
import { DomainError } from "../domain/errors";

const STATUS: Record<DomainError["code"], number> = {
  not_found: 404,
  invalid: 422,
  conflict: 409,
  forbidden: 403,
  invalid_transition: 409,
  rate_limited: 429,
};

export type MobileContext<P> = { member: Member; deviceId: string; request: Request; params: P };

/** JSON errors the app can show as they are. */
export function mobileError(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Wraps a staff-app API route: checks the device token from the Authorization header, loads the
 * member exactly like a web request, and turns expected failures into JSON errors.
 */
export function mobileRoute<P = Record<string, never>>(handler: (ctx: MobileContext<P>) => Promise<unknown>) {
  return async (request: Request, ctx: { params: Promise<P> }) => {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const device = token ? await resolveDevice(db, token) : null;
    const member = device ? await loadMember(device) : null;
    if (!device || !member) return mobileError(401, "Signed out. Connect the app again from SlotBack on the web.");
    const params = await ctx.params;
    // Every path parameter in this API is a record id.
    if (params && Object.values(params).some((v) => !isId(v))) return mobileError(404, "Not found.");
    try {
      const data = await handler({ member, deviceId: device.deviceId, request, params });
      return Response.json(data ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
      if (err instanceof DomainError) return mobileError(STATUS[err.code], err.message);
      console.error(JSON.stringify({ level: "error", event: "mobile_api_error", path: new URL(request.url).pathname, message: err instanceof Error ? err.message : String(err) }));
      return mobileError(500, "Something went wrong. Please try again.");
    }
  };
}

/** The app only ever sends a few short fields. */
const MAX_BODY_BYTES = 16 * 1024;

/** Reads a JSON body, treating a missing or broken one as empty. Oversized bodies are refused. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) throw new DomainError("invalid", "That request is too large.");
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) throw new DomainError("invalid", "That request is too large.");
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
