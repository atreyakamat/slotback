import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, CalendarX2, CheckCircle2, MapPin, Phone } from "lucide-react";
import { Skeleton } from "@/components/app/skeleton";
import { PublicShell } from "@/components/public/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { formatDate, formatTime } from "@/lib/time";
import { hashToken } from "@/server/appointments/core";
import { cancelByToken, confirmByToken, stopRemindersByToken } from "@/server/actions/booking";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Your appointment", robots: { index: false, follow: false } };

export default function ManagePage(props: PageProps<"/a/[token]">) {
  return (
    <PublicShell>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Manage {...props} />
      </Suspense>
    </PublicShell>
  );
}

async function Manage({ params, searchParams }: PageProps<"/a/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();

  const a = await db.appointment.findUnique({
    where: { manageTokenHash: hashToken(token) },
    select: {
      status: true,
      startAt: true,
      confirmedAt: true,
      service: { select: { name: true, durationMinutes: true } },
      resource: { select: { name: true } },
      customer: { select: { name: true, consents: { where: { channel: "WHATSAPP" }, select: { status: true } } } },
      location: { select: { name: true, address: true, phone: true, timezone: true, bookingSlug: true, bookingEnabled: true } },
    },
  });
  if (!a) notFound();

  const now = new Date();
  const tz = a.location.timezone;
  const upcoming = a.status === "BOOKED" && a.startAt > now;
  const whatsappOn = a.customer?.consents[0]?.status === "GRANTED";
  const askCancel = sp.cancel === "1" && upcoming;

  return (
    <>
      {sp.booked === "1" && upcoming ? (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4" aria-hidden /> You&apos;re booked. Save this page to manage your appointment.
        </div>
      ) : null}

      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{a.location.name}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{a.service.name}</h1>
          </div>
          <StatusBadge status={a.status} confirmed={Boolean(a.confirmedAt)} past={a.startAt <= now} />
        </div>

        <dl className="mt-5 grid gap-3 text-sm">
          <Row label="When">
            {formatDate(a.startAt, tz, { weekday: "long", month: "long" })}, {formatTime(a.startAt, tz)}
            <span className="text-muted"> · {a.service.durationMinutes} min</span>
          </Row>
          <Row label="With">{a.resource.name}</Row>
          {a.customer ? <Row label="Name">{a.customer.name}</Row> : null}
          {a.location.address ? (
            <Row label="Where">
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> {a.location.address}
              </span>
            </Row>
          ) : null}
        </dl>

        {upcoming && !askCancel ? (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {a.confirmedAt ? (
              <p className="flex h-11 items-center justify-center gap-2 rounded-lg bg-success/10 text-sm font-medium text-success">
                <CalendarCheck className="size-4" aria-hidden /> You&apos;ve confirmed
              </p>
            ) : (
              <form action={confirmByToken}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit" size="lg" className="w-full">
                  <CalendarCheck /> I&apos;ll be there
                </Button>
              </form>
            )}
            <Link
              href={`/a/${token}?cancel=1`}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border bg-surface text-[15px] font-medium hover:bg-surface-raised"
            >
              <CalendarX2 className="size-4" aria-hidden /> Cancel
            </Link>
          </div>
        ) : null}

        {askCancel ? (
          <form action={cancelByToken} className="mt-6 grid gap-3 rounded-lg border p-4">
            <input type="hidden" name="token" value={token} />
            <p className="text-sm font-medium">Cancel this appointment?</p>
            <p className="text-sm text-muted">Your slot will be offered to someone on the waiting list.</p>
            <div className="grid gap-1.5">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input id="reason" name="reason" maxLength={200} placeholder="e.g. Travelling" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="danger">
                Yes, cancel
              </Button>
              <Link href={`/a/${token}`} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-muted hover:bg-surface-raised">
                Keep my appointment
              </Link>
            </div>
          </form>
        ) : null}

        {a.status === "CANCELLED" && a.location.bookingEnabled && a.location.bookingSlug ? (
          <Link href={`/book/${a.location.bookingSlug}`} className="mt-6 inline-flex text-sm font-medium text-accent">
            Book another time
          </Link>
        ) : null}
      </Card>

      {a.location.phone ? (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
          <Phone className="size-3.5" aria-hidden /> Questions? Call{" "}
          <a className="font-medium text-foreground" href={`tel:${a.location.phone.replace(/\s/g, "")}`}>
            {a.location.phone}
          </a>
        </p>
      ) : null}

      {upcoming && whatsappOn ? (
        <form action={stopRemindersByToken} className="mt-6 text-center">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="text-xs text-muted underline underline-offset-2 hover:text-foreground">
            Stop WhatsApp reminders from {a.location.name}
          </button>
        </form>
      ) : sp.stopped === "1" ? (
        <p role="status" className="mt-6 text-center text-xs text-muted">
          WhatsApp reminders are off. The clinic won&apos;t message you on WhatsApp.
        </p>
      ) : null}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-3">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function StatusBadge({ status, confirmed, past }: { status: string; confirmed: boolean; past: boolean }) {
  if (status === "CANCELLED") return <Badge tone="danger">Cancelled</Badge>;
  if (status === "COMPLETED") return <Badge tone="success">Completed</Badge>;
  if (status === "NO_SHOW") return <Badge tone="warning">Missed</Badge>;
  if (past) return <Badge>Past</Badge>;
  return confirmed ? <Badge tone="success">Confirmed</Badge> : <Badge tone="accent">Booked</Badge>;
}
