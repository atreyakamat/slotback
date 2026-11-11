import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, BellRing, CalendarCheck, Globe, MessageCircle, PhoneCall } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { AppointmentStatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatTime, zonedToUtc } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { staffCancel, staffConfirm, staffMarkCompleted, staffMarkNoShow } from "@/server/actions/reminders";
import { getAppointmentsBoard, type ReminderState } from "@/server/queries/appointments";

export const metadata: Metadata = { title: "Reminders" };

export default function RemindersPage() {
  return (
    <>
      <PageHeader
        title="Reminders"
        description="Confirmations, WhatsApp reminders and no-shows for the next 7 days."
        actions={
          <Link href="/app/reminders/messages" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
            <MessageCircle className="size-4" aria-hidden /> Message log
          </Link>
        }
      />
      <Suspense fallback={<BoardSkeleton />}>
        <Board />
      </Suspense>
    </>
  );
}

type Row = Awaited<ReturnType<typeof getAppointmentsBoard>>["days"][number]["appointments"][number];

async function Board() {
  const member = await requireMember();
  const now = new Date();
  const tz = member.location.timezone;
  const { needsOutcome, needsCall, days } = await getAppointmentsBoard(member, now);

  return (
    <div className="grid gap-6">
      {needsOutcome.length > 0 ? (
        <Card className="border-warning/40">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" aria-hidden /> Did they come?
              </CardTitle>
              <CardDescription className="mt-1">Record what happened so your no-show rate stays accurate.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentList rows={needsOutcome} tz={tz} now={now} showDate />
          </CardContent>
        </Card>
      ) : null}

      {needsCall.length > 0 ? (
        <Card className="border-accent/40">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="size-4 text-accent" aria-hidden /> Not confirmed yet
              </CardTitle>
              <CardDescription className="mt-1">
                Coming up in the next 24 hours without a confirmation. A quick call now saves an empty chair.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentList rows={needsCall} tz={tz} now={now} showDate />
          </CardContent>
        </Card>
      ) : null}

      {days.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">No appointments in the next 7 days.</Card>
      ) : (
        days.map(({ date, appointments }) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle>{formatDate(zonedToUtc(date, 12 * 60, tz), tz, { weekday: "long", month: "long" })}</CardTitle>
              <span className="text-xs text-muted">
                {appointments.filter((a) => a.status !== "CANCELLED").length} booked ·{" "}
                {appointments.filter((a) => a.confirmedAt && a.status === "BOOKED").length} confirmed
              </span>
            </CardHeader>
            <CardContent>
              <AppointmentList rows={appointments} tz={tz} now={now} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AppointmentList({ rows, tz, now, showDate = false }: { rows: Row[]; tz: string; now: Date; showDate?: boolean }) {
  return (
    <ul className="divide-y">
      {rows.map((a) => {
        const started = a.startAt <= now;
        return (
          <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <span className="w-[5.5rem] shrink-0 text-sm tabular-nums text-muted">
              {showDate ? <span className="block text-xs">{formatDate(a.startAt, tz)}</span> : null}
              {formatTime(a.startAt, tz)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                <Link href={`/app/appointments/${a.id}`} className="truncate hover:underline">
                  {a.customer?.name ?? "Walk-in"}
                </Link>
                {a.repeatNoShows > 0 ? (
                  <Badge tone="warning" title="No-shows in the last 6 months">
                    {a.repeatNoShows} no-shows
                  </Badge>
                ) : null}
                {a.source === "ONLINE" ? (
                  <Globe className="size-3.5 text-muted" aria-label="Booked online" />
                ) : null}
              </p>
              <p className="truncate text-xs text-muted">
                {a.service.name} · {a.resource.name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {a.status === "BOOKED" && !started ? <ReminderBadge state={a.reminder} /> : null}
              {a.status !== "BOOKED" ? <AppointmentStatusBadge status={a.status} /> : null}
              {a.status === "CANCELLED" && a.recoveryCampaign ? (
                <Link href={`/app/campaigns/${a.recoveryCampaign.id}`}>
                  <Badge tone={a.recoveryCampaign.status === "CLAIMED" ? "success" : "accent"}>{REFILL_LABEL[a.recoveryCampaign.status]}</Badge>
                </Link>
              ) : null}
              {a.status === "BOOKED" ? <Actions id={a.id} started={started} confirmed={Boolean(a.confirmedAt)} /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const REFILL_LABEL = { DRAFT: "Refill drafted", ACTIVE: "Refilling", CLAIMED: "Refilled", EXPIRED: "Refill closed", CANCELLED: "Refill closed" } as const;

const REMINDER_LABEL: Record<ReminderState, { label: string; tone: "success" | "accent" | "neutral" | "warning" }> = {
  confirmed: { label: "Confirmed", tone: "success" },
  reminded: { label: "Reminded", tone: "accent" },
  scheduled: { label: "Reminder scheduled", tone: "neutral" },
  "no-whatsapp": { label: "No WhatsApp", tone: "warning" },
  none: { label: "No reminders", tone: "neutral" },
};

function ReminderBadge({ state }: { state: ReminderState }) {
  const { label, tone } = REMINDER_LABEL[state];
  return (
    <Badge tone={tone}>
      {state === "confirmed" ? <CalendarCheck className="size-3" aria-hidden /> : state === "reminded" ? <BellRing className="size-3" aria-hidden /> : null}
      {label}
    </Badge>
  );
}

function Actions({ id, started, confirmed }: { id: string; started: boolean; confirmed: boolean }) {
  const button = (action: (fd: FormData) => Promise<void>, label: string, variant: "secondary" | "ghost" = "secondary") => (
    <form action={action}>
      <input type="hidden" name="appointmentId" value={id} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
  if (started) {
    return (
      <>
        {button(staffMarkCompleted, "Came")}
        {button(staffMarkNoShow, "No-show")}
      </>
    );
  }
  return (
    <>
      {confirmed ? null : button(staffConfirm, "Confirm")}
      {button(staffCancel, "Cancel", "ghost")}
    </>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading appointments" className="grid gap-4">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-56" />
      ))}
    </div>
  );
}
