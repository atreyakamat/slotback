import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import { Skeleton } from "@/components/app/skeleton";
import { AppointmentStatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPaise } from "@/lib/money";
import { formatDate, formatTime, localDateKey, localMinuteOfDay } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { getAppointmentDetail } from "@/server/queries/schedule";

export const metadata: Metadata = { title: "Appointment" };

const ACTION_LABELS: Record<string, string> = {
  "appointment.created": "Booked",
  "appointment.rescheduled": "Moved",
  "appointment.cancelled": "Cancelled",
  "appointment.completed": "Marked completed",
  "appointment.no_show": "Marked no-show",
};

export default function AppointmentPage({ params }: PageProps<"/app/appointments/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Appointment params={params} />
    </Suspense>
  );
}

async function Appointment({ params }: { params: PageProps<"/app/appointments/[id]">["params"] }) {
  const member = await requireMember();
  const { id } = await params;
  const detail = await getAppointmentDetail(member, id);
  if (!detail) notFound();
  const { appointment: a, history, resources } = detail;
  const tz = member.location.timezone;
  const date = localDateKey(a.startAt, tz);
  const minute = localMinuteOfDay(a.startAt, tz);

  const rows: [string, string][] = [
    ["When", `${formatDate(a.startAt, tz, { weekday: "long", month: "long" })}, ${formatTime(a.startAt, tz)} – ${formatTime(a.endAt, tz)}`],
    ["Service", `${a.service.name} · ${a.service.durationMinutes} min`],
    ["Staff", a.resource.name],
    ["Value (estimate)", formatPaise(a.valuePaise)],
  ];
  if (a.cancelReason) rows.push(["Cancellation reason", a.cancelReason]);

  return (
    <>
      <Link href={`/app/schedule?date=${date}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Schedule
      </Link>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{a.customer?.name ?? "Walk-in"}</h1>
        <AppointmentStatusBadge status={a.status} />
        {a.source === "RECOVERY" ? <Badge tone="accent">Recovered slot</Badge> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-4">
          <Card>
            <CardContent className="pt-5">
              <dl className="divide-y text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr]">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
                {a.customer ? (
                  <div className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr]">
                    <dt className="text-muted">Contact</dt>
                    <dd className="font-medium tabular-nums">{[a.customer.phone, a.customer.email].filter(Boolean).join(" · ")}</dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>
          <AppointmentActions
            id={a.id}
            status={a.status}
            isPast={a.startAt <= new Date()}
            date={date}
            time={`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`}
            resourceId={a.resourceId}
            resources={resources}
            canRefill={a.status === "CANCELLED" && !a.recoveryCampaign && a.startAt > new Date()}
          />
          {a.recoveryCampaign ? (
            <Link href={`/app/campaigns/${a.recoveryCampaign.id}`} className={buttonVariants({ variant: "secondary", className: "w-fit" })}>
              View recovery campaign <ArrowRight />
            </Link>
          ) : null}
          {a.claim ? (
            <Link href={`/app/campaigns/${a.claim.campaignId}`} className="text-sm text-accent hover:underline">
              Booked by claiming a recovered opening →
            </Link>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted">Imported with the demo data.</p>
            ) : (
              <ol className="grid gap-3">
                {history.map((h) => (
                  <li key={h.id} className="text-sm">
                    <p className="font-medium">{ACTION_LABELS[h.action] ?? h.action}</p>
                    <p className="text-xs text-muted">
                      {h.actorName} · {formatDate(h.createdAt, tz)} {formatTime(h.createdAt, tz)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
