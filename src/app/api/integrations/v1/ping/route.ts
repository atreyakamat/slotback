import { integrationRoute } from "@/server/integrations/route";

/** Lets a booking tool check its key works, and which business it's connected to. */
export const GET = integrationRoute(async ({ integration }) => ({
  ok: true,
  connection: integration.name,
  business: integration.location.organization.name,
  location: integration.location.name,
  timezone: integration.location.timezone,
}));
