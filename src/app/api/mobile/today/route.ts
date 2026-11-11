import { db } from "@/server/db";
import { mobileRoute } from "@/server/mobile/route";
import { getRecoveryMetrics } from "@/server/queries/metrics";
import { getTodayOverview } from "@/server/queries/overview";

/** The home screen: this week's recovery numbers, live campaigns and today's next appointments. */
export const GET = mobileRoute(async ({ member }) => {
  const now = new Date();
  const [overview, week, live] = await Promise.all([
    getTodayOverview(member, now),
    getRecoveryMetrics(member, 7, now),
    db.recoveryCampaign.findMany({
      where: { locationId: member.location.id, status: "ACTIVE" },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        expiresAt: true,
        service: { select: { name: true } },
        resource: { select: { name: true } },
        _count: { select: { offers: true } },
      },
    }),
  ]);
  const appointments = overview.resources
    .flatMap((r) => r.appointments.map((a) => ({ ...a, resourceName: r.name })))
    .filter((a) => a.status === "BOOKED" && a.endAt > now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    .slice(0, 8);
  return {
    week: {
      recoveredPaise: week.metrics.recoveredPaise,
      claimed: week.metrics.claimed,
      fillRate: week.metrics.fillRate,
      medianMinutesToFill: week.metrics.medianMinutesToFill,
    },
    stats: overview.stats,
    live: live.map((c) => ({ id: c.id, startAt: c.startAt, expiresAt: c.expiresAt, service: c.service.name, staff: c.resource.name, offers: c._count.offers })),
    next: appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt,
      endAt: a.endAt,
      customer: a.customer?.name ?? "Walk-in",
      service: a.service.name,
      staff: a.resourceName,
    })),
    recent: week.recent,
  };
});
