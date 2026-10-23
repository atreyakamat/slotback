import { localDateKey } from "@/lib/time";
import { DomainError } from "@/server/domain/errors";
import { mobileRoute } from "@/server/mobile/route";
import { getSchedule } from "@/server/queries/schedule";

/** One day's appointments by staff member. `?date=YYYY-MM-DD`, default today in the business's timezone. */
export const GET = mobileRoute(async ({ member, request }) => {
  const date = new URL(request.url).searchParams.get("date") ?? localDateKey(new Date(), member.location.timezone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new DomainError("invalid", "Use a date like 2026-10-24.");
  const s = await getSchedule(member, date, 1);
  return {
    date,
    hours: s.days[0]?.hours ?? [],
    staff: s.resources.map((r) => ({
      id: r.id,
      name: r.name,
      appointments: s.appointments
        .filter((a) => a.resourceId === r.id)
        .map((a) => ({
          id: a.id,
          startAt: a.startAt,
          endAt: a.endAt,
          status: a.status,
          recovered: a.source === "RECOVERY",
          customer: a.customer?.name ?? "Walk-in",
          service: a.service.name,
        })),
    })),
  };
});
