import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { DailyBars } from "@/components/analytics/daily-bars";
import { Funnel } from "@/components/analytics/funnel";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { CAMPAIGN_STATUS } from "@/components/campaigns/labels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPaise } from "@/lib/money";
import { formatDate, formatTime, zonedToUtc } from "@/lib/time";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/dal";
import { getRecoveryMetrics, parseRange, RANGES } from "@/server/queries/metrics";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage({ searchParams }: PageProps<"/app/analytics">) {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <Analytics searchParams={searchParams} />
    </Suspense>
  );
}

async function Analytics({ searchParams }: { searchParams: PageProps<"/app/analytics">["searchParams"] }) {
  const member = await requireMember();
  const days = parseRange((await searchParams).days);
  const { metrics: m, campaigns } = await getRecoveryMetrics(member, days);
  const tz = member.location.timezone;

  const tiles = [
    {
      label: "Recovered revenue",
      value: formatPaise(m.recoveredPaise),
      hint: `${m.claimed} opening${m.claimed === 1 ? "" : "s"} refilled from the waitlist`,
    },
    {
      label: "Completed so far",
      value: formatPaise(m.completedPaise),
      hint: m.upcomingPaise ? `${formatPaise(m.upcomingPaise)} more still to come` : "Recovered visits marked completed",
    },
    {
      label: "Fill rate",
      value: m.fillRate === null ? "—" : `${Math.round(m.fillRate * 100)}%`,
      hint: `${m.claimed} of ${m.claimed + m.expired} finished campaigns refilled`,
    },
    {
      label: "Median time to refill",
      value: m.medianMinutesToFill === null ? "—" : `${Math.round(m.medianMinutesToFill)} min`,
      hint: "From offers going out to a confirmed claim",
    },
  ];

  const points = m.series.map((d) => {
    const at = zonedToUtc(d.date, 12 * 60, tz);
    return {
      date: d.date,
      label: formatDate(at, tz, { weekday: "short", day: "numeric", month: "short" }),
      tick: formatDate(at, tz, { weekday: undefined, day: "numeric", month: "short" }),
      value: d.valuePaise,
      valueLabel: formatPaise(d.valuePaise),
      detail: `${d.count} opening${d.count === 1 ? "" : "s"} refilled`,
    };
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="What SlotBack has recovered for your business."
        actions={
          <a
            href={`/app/analytics/export?days=${days}`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-surface px-3 text-sm font-medium hover:bg-surface-raised"
          >
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        }
      />

      <nav aria-label="Date range" className="mb-6 inline-flex rounded-lg border bg-surface p-1">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/app/analytics?days=${r}`}
            aria-current={r === days ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground",
              r === days && "bg-surface-raised text-foreground",
            )}
          >
            Last {r} days
          </Link>
        ))}
      </nav>

      <section aria-label="Recovery at a glance" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4 sm:p-5">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.hint}</p>
          </Card>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recovered revenue by day</CardTitle>
              <CardDescription className="mt-1">Value of openings refilled, by the day they were claimed.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DailyBars points={points} />
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-muted">View as table</summary>
              <table className="mt-2 w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 font-medium">Day</th>
                    <th className="py-1 text-right font-medium">Refilled</th>
                    <th className="py-1 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {points
                    .filter((p) => p.value > 0)
                    .map((p) => (
                      <tr key={p.date}>
                        <td className="py-1.5">{p.label}</td>
                        <td className="py-1.5 text-right tabular-nums">{p.detail.split(" ")[0]}</td>
                        <td className="py-1.5 text-right tabular-nums">{p.valueLabel}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recovery funnel</CardTitle>
              <CardDescription className="mt-1">From a cancellation to a completed visit.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Funnel
              steps={[
                { label: "Cancellations", value: m.funnel.cancellations, hint: "Appointments cancelled in this period" },
                { label: "Offered to the waitlist", value: m.funnel.offered, hint: "Openings you launched a campaign for" },
                { label: "Claimed", value: m.funnel.claimed, hint: "Openings a customer confirmed" },
                { label: "Completed", value: m.funnel.completed, hint: "Recovered visits that happened" },
              ]}
            />
            <p className="mt-4 border-t pt-3 text-xs text-muted">
              {m.funnel.messagesSent} offer messages sent
              {m.funnel.messagesSent
                ? ` · ${Math.round((m.funnel.opened / m.funnel.messagesSent) * 100)}% opened their claim link`
                : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription className="mt-1">The most recent openings offered in this period. Export the CSV for all of them.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {campaigns.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted">
              No openings offered in this period yet.
            </p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 font-medium">Opening</th>
                  <th className="pb-2 font-medium">Claimed by</th>
                  <th className="pb-2 text-right font-medium">Offers</th>
                  <th className="pb-2 text-right font-medium">Value</th>
                  <th className="pb-2 text-right font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.slice(0, 12).map((c) => {
                  const s = CAMPAIGN_STATUS[c.status];
                  return (
                    <tr key={c.id}>
                      <td className="py-2.5">
                        <Link href={`/app/campaigns/${c.id}`} className="font-medium hover:underline">
                          {c.service.name}
                        </Link>
                        <span className="block text-xs text-muted">
                          {formatDate(c.startAt, tz)} · {formatTime(c.startAt, tz)} · {c.resource.name}
                        </span>
                      </td>
                      <td className="py-2.5">{c.claim?.appointment.customer?.name ?? <span className="text-muted">—</span>}</td>
                      <td className="py-2.5 text-right tabular-nums">{c.offers.length}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatPaise(c.valuePaise)}</td>
                      <td className="py-2.5 text-right">
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AnalyticsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading analytics">
      <Skeleton className="mb-8 h-12 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[118px]" />
        ))}
      </div>
      <Skeleton className="mt-4 h-80" />
    </div>
  );
}
