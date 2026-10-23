import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import { buttonVariants } from "@/components/ui/button";
import { addDays, formatDate, formatTime, localDateKey, localMinuteOfDay, localWeekday, parseHm, zonedToUtc } from "@/lib/time";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/dal";
import { getSchedule } from "@/server/queries/schedule";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage({ searchParams }: PageProps<"/app/schedule">) {
  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <Schedule searchParams={searchParams} />
    </Suspense>
  );
}

async function Schedule({ searchParams }: { searchParams: PageProps<"/app/schedule">["searchParams"] }) {
  const member = await requireMember();
  const tz = member.location.timezone;
  const params = await searchParams;
  const view = params.view === "week" ? "week" : "day";
  const today = localDateKey(new Date(), tz);
  const requested = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

  // Weeks start on Monday.
  const start =
    view === "week" ? addDays(requested, -((localWeekday(zonedToUtc(requested, 720, tz), tz) + 6) % 7)) : requested;
  const span = view === "week" ? 7 : 1;
  const data = await getSchedule(member, start, span);

  const days = data.days.map((d) => ({
    date: d.date,
    label: formatDate(zonedToUtc(d.date, 720, tz), tz),
    openMin: d.hours.length ? Math.min(...d.hours.map((h) => parseHm(h.open))) : null,
    closeMin: d.hours.length ? Math.max(...d.hours.map((h) => parseHm(h.close))) : null,
  }));

  const appointments = data.appointments.map((a) => ({
    id: a.id,
    date: localDateKey(a.startAt, tz),
    startMin: localMinuteOfDay(a.startAt, tz),
    endMin: localMinuteOfDay(a.endAt, tz) || 1440,
    timeLabel: formatTime(a.startAt, tz),
    status: a.status,
    source: a.source,
    resourceId: a.resourceId,
    customerName: a.customer?.name ?? "Walk-in",
    serviceName: a.service.name,
  }));

  const prev = addDays(start, -span);
  const next = addDays(start, span);
  const title =
    view === "day"
      ? formatDate(zonedToUtc(start, 720, tz), tz, { weekday: "long", month: "long" })
      : `${formatDate(zonedToUtc(start, 720, tz), tz, { weekday: undefined })} – ${formatDate(zonedToUtc(addDays(start, 6), 720, tz), tz, { weekday: undefined })}`;

  // Default booking slot: next quarter hour today, otherwise opening time.
  const nowMin = localMinuteOfDay(new Date(), tz);
  const openMin = days[0].openMin ?? 600;
  const defaultTime = start === today ? Math.max(openMin, Math.ceil((nowMin + 1) / 15) * 15) : openMin;

  return (
    <>
      <PageHeader
        title="Schedule"
        description={title}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border bg-surface p-0.5 text-sm">
              {(["day", "week"] as const).map((v) => (
                <Link
                  key={v}
                  href={`/app/schedule?date=${requested}&view=${v}`}
                  aria-current={view === v ? "page" : undefined}
                  className={cn("rounded-md px-3 py-1.5 font-medium capitalize text-muted", view === v && "bg-surface-raised text-foreground")}
                >
                  {v}
                </Link>
              ))}
            </div>
            <div className="inline-flex items-center gap-1">
              <Link aria-label="Previous" href={`/app/schedule?date=${prev}&view=${view}`} className={buttonVariants({ variant: "secondary", size: "icon" })}>
                <ChevronLeft />
              </Link>
              <Link href={`/app/schedule?date=${today}&view=${view}`} className={buttonVariants({ variant: "secondary" })}>
                Today
              </Link>
              <Link aria-label="Next" href={`/app/schedule?date=${next}&view=${view}`} className={buttonVariants({ variant: "secondary", size: "icon" })}>
                <ChevronRight />
              </Link>
            </div>
          </div>
        }
      />
      <ScheduleBoard
        view={view}
        days={days}
        resources={data.resources}
        appointments={appointments}
        services={data.services}
        customers={data.customers}
        defaultPrefill={{ date: start, time: `${String(Math.floor(defaultTime / 60)).padStart(2, "0")}:${String(defaultTime % 60).padStart(2, "0")}` }}
      />
    </>
  );
}

function ScheduleSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-8 h-12 w-72" />
      <Skeleton className="h-[560px]" />
    </div>
  );
}
