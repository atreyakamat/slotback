import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarX2, FlaskConical, IndianRupee, ListChecks, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { AppointmentStatusBadge } from "@/components/app/status-badge";
import { AutoRefresh } from "@/components/campaigns/auto-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPaise } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { getRecoveryMetrics } from "@/server/queries/metrics";
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
  const [{ resources, stats }, recovery] = await Promise.all([
    getTodayOverview(member, now),
    getRecoveryMetrics(member, 30, now),
  ]);
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

      {stats.liveCampaigns > 0 ? <AutoRefresh /> : null}
      {member.organization.isDemo ? <DemoGuide /> : null}
      <RecoveryHero recovery={recovery} liveCampaigns={stats.liveCampaigns} tz={tz} />

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

type Recovery = Awaited<ReturnType<typeof getRecoveryMetrics>>;

function RecoveryHero({ recovery, liveCampaigns, tz }: { recovery: Recovery; liveCampaigns: number; tz: string }) {
  const { metrics: m, recent } = recovery;
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <Sparkles className="size-4 text-accent" aria-hidden /> Recovered by SlotBack · last 30 days
            </p>
            {liveCampaigns > 0 ? (
              <Link href="/app/campaigns" className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                {liveCampaigns} offering now
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{formatPaise(m.recoveredPaise)}</p>
          <p className="mt-1 text-sm text-muted">
            {m.claimed} cancelled opening{m.claimed === 1 ? "" : "s"} refilled · {formatPaise(m.completedPaise)} already completed
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Fill rate</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{m.fillRate === null ? "—" : `${Math.round(m.fillRate * 100)}%`}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Median refill</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {m.medianMinutesToFill === null ? "—" : `${Math.round(m.medianMinutesToFill)} min`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Cancellations</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{m.cancellations}</dd>
            </div>
          </dl>
          <Link href="/app/analytics" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            See analytics <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="border-t bg-surface-raised/50 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <p className="text-sm font-medium">Latest recoveries</p>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              When a customer cancels, choose “Cancel and refill” and the first refilled opening will show up here.
            </p>
          ) : (
            <ul className="mt-2 divide-y">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/app/campaigns/${r.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.customerName}</p>
                      <p className="truncate text-xs text-muted">
                        {r.serviceName} · {formatDate(r.startAt, tz)} · refilled in {r.minutesToFill} min
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-success">+{formatPaise(r.valuePaise)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function DemoGuide() {
  return (
    <Card className="mb-4 border-dashed">
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
        <FlaskConical className="size-5 shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-medium">Try the recovery loop:</span> open any upcoming appointment on the schedule, choose
          “Cancel and refill”, send the offers, then claim the slot as a customer from the demo inbox or your phone.
        </p>
        <Link href="/app/schedule" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          Open schedule <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
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
