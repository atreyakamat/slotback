import "server-only";
import type { Member } from "../auth/dal";
import { db } from "../db";
import { addDays, localDateKey, zonedToUtc } from "@/lib/time";

/** Today's schedule and headline counts for the member's location. */
export async function getTodayOverview(member: Member, now = new Date()) {
  const { id: locationId, timezone } = member.location;
  const today = localDateKey(now, timezone);
  const dayStart = zonedToUtc(today, 0, timezone);
  const dayEnd = zonedToUtc(addDays(today, 1), 0, timezone);
  const fortnightAgo = new Date(now.getTime() - 14 * 24 * 3600_000);

  const [appointments, resources, activeWaitlist, recentCancellations] = await Promise.all([
    db.appointment.findMany({
      where: { locationId, startAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        valuePaise: true,
        resourceId: true,
        customer: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
    db.resource.findMany({
      where: { locationId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.waitlistEntry.count({ where: { locationId, status: "ACTIVE" } }),
    db.appointment.count({ where: { locationId, status: "CANCELLED", cancelledAt: { gte: fortnightAgo } } }),
  ]);

  const live = appointments.filter((a) => a.status !== "CANCELLED");
  const upcoming = live.filter((a) => a.startAt > now && a.status === "BOOKED");

  return {
    today,
    resources: resources.map((r) => ({ ...r, appointments: appointments.filter((a) => a.resourceId === r.id) })),
    stats: {
      bookedToday: live.length,
      upcomingToday: upcoming.length,
      bookedValuePaise: live.reduce((sum, a) => sum + a.valuePaise, 0),
      activeWaitlist,
      recentCancellations,
    },
  };
}
