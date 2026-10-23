import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarCheck, CalendarX2, IndianRupee, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { AppointmentStatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPaise } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { getTodayOverview } from "@/server/queries/overview";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <Today />
    </Suspense>
  );
}

async function Today() {
  const member = await requireMember();
  const now = new Date();
  const { resources, stats } = await getTodayOverview(member, now);
  const tz = member.location.timezone;
  const firstName = member.user.name.split(" ")[0];

  const tiles = [
    { label: "Booked today", value: String(stats.bookedToday), hint: `${stats.upcomingToday} still to come`, icon: CalendarCheck },
    { label: "Booked value today", value: formatPaise(stats.bookedValuePaise), hint: "Owner-entered estimates", icon: IndianRupee },
    { label: "Active waitlist", value: String(stats.activeWaitlist), hint: "Customers ready for an opening", icon: ListChecks },
    { label: "Cancellations, 14 days", value: String(stats.recentCancellations), hint: "Openings you could refill", icon: CalendarX2 },
  ];

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description={`${member.location.name} · ${formatDate(now, tz, { weekday: "long", month: "long" })}`}
      />

      <section aria-label="Today at a glance" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2 text-sm text-muted">
              {label}
              <Icon className="size-4 shrink-0" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-semibold sm:text-3xl tracking-tight tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </Card>
        ))}
      </section>

      <section aria-label="Today's schedule" className="mt-8 grid gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle>{resource.name}</CardTitle>
              <span className="text-xs text-muted">
                {resource.appointments.filter((a) => a.status !== "CANCELLED").length} appointments
              </span>
            </CardHeader>
            <CardContent>
              {resource.appointments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Nothing booked today.</p>
              ) : (
                <ul className="divide-y">
                  {resource.appointments.map((a) => (
                    <li key={a.id} className="flex items-center gap-4 py-2.5">
                      <span className="w-[4.5rem] shrink-0 text-sm tabular-nums text-muted">{formatTime(a.startAt, tz)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.customer?.name ?? "Walk-in"}</p>
                        <p className="truncate text-xs text-muted">{a.service.name}</p>
                      </div>
                      <AppointmentStatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today">
      <Skeleton className="mb-8 h-12 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[118px]" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
  );
}
