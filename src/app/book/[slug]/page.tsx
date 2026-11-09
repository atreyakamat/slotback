import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/app/skeleton";
import { PublicShell } from "@/components/public/public-shell";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { bookableDates, openingIntervals, type BusinessHours } from "@/lib/slots";
import { formatDate, formatTime, localDateKey, localMinuteOfDay, zonedToUtc } from "@/lib/time";
import { findFreeSlots, getBookingLocation } from "@/server/appointments/core";
import { db } from "@/server/db";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = { title: "Book an appointment", robots: { index: false } };

export default function BookPage(props: PageProps<"/book/[slug]">) {
  return (
    <PublicShell>
      <Suspense fallback={<BookingSkeleton />}>
        <Booking {...props} />
      </Suspense>
    </PublicShell>
  );
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

async function Booking({ params, searchParams }: PageProps<"/book/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const location = await getBookingLocation(db, slug);
  if (!location) notFound();

  const now = new Date();
  const tz = location.timezone;
  const hours = (location.businessHours ?? {}) as BusinessHours;
  const service = location.services.find((s) => s.id === one(sp.service));
  const dates = bookableDates(localDateKey(now, tz), location.bookingHorizonDays).filter(
    (d) => openingIntervals(hours, d, tz).length > 0,
  );
  const date = dates.find((d) => d === one(sp.date));
  const startParam = one(sp.start);
  const href = (q: Record<string, string>) => `/book/${slug}?${new URLSearchParams(q)}`;

  const slots = service && date ? await findFreeSlots(db, location, service, date, now) : [];
  const chosen = startParam ? slots.find((s) => s.startAt.toISOString() === startParam) : undefined;

  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-muted">Book an appointment</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{location.name}</h1>
        {location.address ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {location.address}
          </p>
        ) : null}
      </header>

      {/* Step 1: service */}
      <Card className="p-5">
        <StepTitle n={1} title="Choose a service" done={service?.name} changeHref={service ? `/book/${slug}` : undefined} />
        {!service ? (
          location.services.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Online booking isn&apos;t open yet. Please call the clinic.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {location.services.map((s) => (
                <li key={s.id}>
                  <Link
                    href={href({ service: s.id })}
                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:border-accent hover:bg-accent/5"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="flex shrink-0 items-center gap-1 text-muted">
                      <Clock className="size-3.5" aria-hidden /> {s.durationMinutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </Card>

      {/* Step 2: day and time */}
      {service ? (
        <Card className="mt-4 p-5">
          <StepTitle
            n={2}
            title="Pick a day and time"
            done={chosen ? `${formatDate(chosen.startAt, tz)}, ${formatTime(chosen.startAt, tz)}` : undefined}
            changeHref={chosen ? href({ service: service.id, date: date! }) : undefined}
          />
          {!chosen ? (
            <>
              <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1" role="list" aria-label="Days">
                {dates.map((d) => {
                  const noon = zonedToUtc(d, 12 * 60, tz);
                  return (
                    <Link
                      role="listitem"
                      key={d}
                      href={href({ service: service.id, date: d })}
                      aria-current={d === date ? "date" : undefined}
                      className={cn(
                        "flex w-16 shrink-0 flex-col items-center rounded-lg border py-2 text-sm transition-colors hover:border-accent",
                        d === date && "border-accent bg-accent text-accent-foreground hover:border-accent",
                      )}
                    >
                      <span className="text-xs opacity-80">{formatDate(noon, tz, { weekday: "short", day: undefined, month: undefined })}</span>
                      <span className="font-semibold tabular-nums">{formatDate(noon, tz, { weekday: undefined, month: undefined })}</span>
                      <span className="text-xs opacity-80">{formatDate(noon, tz, { weekday: undefined, day: undefined })}</span>
                    </Link>
                  );
                })}
              </div>
              {date ? (
                slots.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">No free times on this day. Try another day.</p>
                ) : (
                  <SlotGroups
                    slots={slots.map((s) => ({
                      iso: s.startAt.toISOString(),
                      label: formatTime(s.startAt, tz),
                      minute: localMinuteOfDay(s.startAt, tz),
                    }))}
                    hrefFor={(iso) => href({ service: service.id, date, start: iso })}
                  />
                )
              ) : (
                <p className="mt-4 text-sm text-muted">Choose a day to see free times.</p>
              )}
            </>
          ) : null}
        </Card>
      ) : null}

      {/* Step 3: details */}
      {service && chosen ? (
        <Card className="mt-4 p-5">
          <StepTitle n={3} title="Your details" />
          <BookingForm slug={slug} serviceId={service.id} startAt={chosen.startAt.toISOString()} clinicName={location.name} />
        </Card>
      ) : null}
    </>
  );
}

function StepTitle({ n, title, done, changeHref }: { n: number; title: string; done?: string; changeHref?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-5 place-items-center rounded-full bg-surface-raised text-xs tabular-nums">{n}</span>
          {title}
        </h2>
        {done ? <p className="mt-1 pl-7 text-sm">{done}</p> : null}
      </div>
      {changeHref ? (
        <Link href={changeHref} className="inline-flex items-center gap-1 text-sm text-accent">
          <ArrowLeft className="size-3.5" aria-hidden /> Change
        </Link>
      ) : null}
    </div>
  );
}

function SlotGroups({ slots, hrefFor }: { slots: { iso: string; label: string; minute: number }[]; hrefFor: (iso: string) => string }) {
  const groups = [
    { name: "Morning", items: slots.filter((s) => s.minute < 12 * 60) },
    { name: "Afternoon", items: slots.filter((s) => s.minute >= 12 * 60 && s.minute < 17 * 60) },
    { name: "Evening", items: slots.filter((s) => s.minute >= 17 * 60) },
  ].filter((g) => g.items.length > 0);
  return (
    <div className="mt-4 grid gap-4">
      {groups.map((g) => (
        <section key={g.name} aria-label={g.name}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{g.name}</h3>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {g.items.map((s) => (
              <li key={s.iso}>
                <Link
                  href={hrefFor(s.iso)}
                  className="flex h-10 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors hover:border-accent hover:bg-accent/5"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading booking page">
      <Skeleton className="mb-6 h-16 w-64" />
      <Skeleton className="h-64" />
    </div>
  );
}
