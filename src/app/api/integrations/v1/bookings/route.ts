import { z } from "zod";
import { db } from "@/server/db";
import { DomainError } from "@/server/domain/errors";
import { syncBooking } from "@/server/domain/integrations";
import { env } from "@/server/env";
import { integrationRoute, readBody } from "@/server/integrations/route";

const schema = z.object({
  externalId: z.string().trim().min(1).max(100).regex(/^[\w.:@-]+$/, "Use letters, digits and . : @ _ - only."),
  status: z.enum(["booked", "cancelled", "completed", "no_show"]),
  startAt: z.iso.datetime({ offset: true }).transform((s) => new Date(s)),
  service: z.string().trim().min(1).max(120),
  staff: z.string().trim().max(80).nullish(),
  customer: z
    .object({
      name: z.string().trim().min(1).max(80),
      phone: z.string().trim().max(20).nullish(),
      email: z.email().max(160).nullish(),
    })
    .nullish(),
  cancelReason: z.string().trim().max(200).nullish(),
});

/**
 * Create, move, cancel or complete a booking made in another tool. Send the full booking every
 * time; it's matched by `externalId`, so retries are safe. See docs/INTEGRATIONS.md.
 */
export const POST = integrationRoute(async ({ integration, request }) => {
  const parsed = schema.safeParse(await readBody(request));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new DomainError("invalid", `${issue.path.join(".") || "body"}: ${issue.message}`);
  }
  return syncBooking(db, integration, parsed.data, { baseUrl: env().NEXT_PUBLIC_APP_URL, messageProvider: env().MESSAGE_PROVIDER });
});
