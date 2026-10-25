import { db } from "@/server/db";
import { revokeDevice } from "@/server/domain/devices";
import { mobileRoute } from "@/server/mobile/route";

export const GET = mobileRoute(async ({ member }) => ({
  user: member.user,
  business: { name: member.organization.name, isDemo: member.organization.isDemo },
  location: member.location,
  role: member.role,
}));

/** Signs this phone out. */
export const DELETE = mobileRoute(async ({ member, deviceId }) => {
  await revokeDevice(db, { userId: member.user.id, organizationId: member.organization.id }, deviceId);
});
