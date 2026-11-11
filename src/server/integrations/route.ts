import "server-only";
import { db } from "../db";
import { DomainError } from "../domain/errors";
import { resolveIntegrationKey, type ResolvedIntegration } from "../domain/integrations";
import { consume } from "../security/rate-limit";

const STATUS: Record<DomainError["code"], number> = {
  not_found: 404,
  invalid: 422,
  conflict: 409,
  forbidden: 403,
  invalid_transition: 409,
  rate_limited: 429,
};

/** Generous for a booking tool replaying a day's changes; tight enough to stop a leaked key flooding us. */
const PER_MINUTE = 300;

function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Wraps a public integration API route: checks the secret key from `Authorization: Bearer sbk_…`,
 * applies a per-connection rate limit, and turns expected failures into JSON errors.
 */
export function integrationRoute(handler: (ctx: { integration: ResolvedIntegration; request: Request }) => Promise<unknown>) {
  return async (request: Request) => {
    const key = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
    const integration = key ? await resolveIntegrationKey(db, key) : null;
    if (!integration) return json(401, { error: "unauthorized", message: "Missing, wrong or revoked API key." });
    if (!(await consume(db, `integration:${integration.id}`, { limit: PER_MINUTE, windowMs: 60_000 }))) {
      return json(429, { error: "rate_limited", message: `Slow down: at most ${PER_MINUTE} requests a minute per key.` });
    }
    try {
      return json(200, await handler({ integration, request }));
    } catch (err) {
      if (err instanceof DomainError) return json(STATUS[err.code], { error: err.code, message: err.message });
      console.error(JSON.stringify({ level: "error", event: "integration_api_error", integrationId: integration.id, message: err instanceof Error ? err.message : String(err) }));
      return json(500, { error: "server_error", message: "Something went wrong on our side. Retry later." });
    }
  };
}

const MAX_BODY_BYTES = 16 * 1024;

/** Parses a JSON object body; anything else is a 422. */
export async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) throw new DomainError("invalid", "Request body is too large.");
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) throw new DomainError("invalid", "Request body is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError("invalid", "Send a JSON body.");
  }
}
