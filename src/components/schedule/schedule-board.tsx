"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingDialog } from "./booking-dialog";
import type { BookingPrefill, ScheduleAppointment, ScheduleCustomer, ScheduleResource, ScheduleService } from "./types";

const SLOT = 15; // minutes per grid row
const ROW_PX = 14; // height of one 15-minute row

type Day = { date: string; label: string; openMin: number | null; closeMin: number | null };

function hmLabel(min: number) {
  const h = Math.floor(min / 60);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${min % 60 ? `:${String(min % 60).padStart(2, "0")}` : ""} ${suffix}`;
}

function toHm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// Opaque tints (mixed with the surface colour) so grid lines don't show through blocks.
const tint = (token: string, pct: number) => `color-mix(in oklab, var(${token}) ${pct}%, var(--surface))`;

const STATUS_STYLE: Record<ScheduleAppointment["status"], { className: string; background: string }> = {
  BOOKED: { className: "border-accent/40 hover:border-accent", background: tint("--accent", 10) },
  COMPLETED: { className: "border-success/40 hover:border-success", background: tint("--success", 10) },
  NO_SHOW: { className: "border-warning/40 hover:border-warning", background: tint("--warning", 12) },
  CANCELLED: {
    className: "border-dashed border-danger/50 text-muted hover:border-danger",
    background: `repeating-linear-gradient(135deg, var(--surface) 0 6px, ${tint("--danger", 8)} 6px 12px)`,
  },
};

export function ScheduleBoard({
  view,
  days,
  resources,
  appointments,
  services,
  customers,
  defaultPrefill,
}: {
  view: "day" | "week";
  days: Day[];
  resources: ScheduleResource[];
  appointments: ScheduleAppointment[];
  services: ScheduleService[];
  customers: ScheduleCustomer[];
  defaultPrefill: BookingPrefill;
}) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPrefill>(defaultPrefill);
  const close = useCallback(() => setOpen(false), []);

  function book(p: BookingPrefill) {
    setPrefill(p);
    setOpen(true);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => book(defaultPrefill)}>
          <Plus /> New appointment
        </Button>
      </div>
      {view === "day" ? (
        <DayGrid day={days[0]} resources={resources} appointments={appointments} onBook={book} />
      ) : (
        <WeekList days={days} resources={resources} appointments={appointments} />
      )}
      <BookingDialog
        open={open}
        onClose={close}
        prefill={prefill}
        resources={resources}
        services={services}
        customers={customers}
      />
    </>
  );
}

function DayGrid({
  day,
  resources,
  appointments,
  onBook,
}: {
  day: Day;
  resources: ScheduleResource[];
  appointments: ScheduleAppointment[];
  onBook: (p: BookingPrefill) => void;
}) {
  if (day.openMin === null || day.closeMin === null) {
    return (
      <div className="rounded-[var(--radius-card)] border bg-surface p-10 text-center text-sm text-muted">
        Closed on this day. Change opening hours in Settings.
      </div>
    );
  }
  const start = day.openMin;
  const end = day.closeMin;
  const rows = Math.ceil((end - start) / SLOT);
  const hours: number[] = [];
  for (let m = Math.ceil(start / 60) * 60; m < end; m += 60) hours.push(m);

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border bg-surface">
      <div className="min-w-[640px]" style={{ display: "grid", gridTemplateColumns: `56px repeat(${resources.length}, minmax(150px, 1fr))` }}>
        <div className="sticky left-0 z-10 border-b bg-surface" />
        {resources.map((r) => (
          <div key={r.id} className="border-b border-l px-3 py-2.5 text-sm font-medium">
            {r.name}
          </div>
        ))}

        <div className="relative sticky left-0 z-10 bg-surface" style={{ height: rows * ROW_PX }}>
          {hours.map((m) => (
            <span
              key={m}
              className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted"
              style={{ top: Math.max(((m - start) / SLOT) * ROW_PX, 8) }}
            >
              {hmLabel(m)}
            </span>
          ))}
        </div>

        {resources.map((r) => (
          <div key={r.id} className="relative border-l" style={{ height: rows * ROW_PX }}>
            {/* Empty 15-minute cells: click to book. */}
            {Array.from({ length: rows }, (_, i) => {
              const m = start + i * SLOT;
              return (
                <button
                  key={m}
                  type="button"
                  aria-label={`Book ${r.name} at ${hmLabel(m)}`}
                  onClick={() => onBook({ date: day.date, time: toHm(m), resourceId: r.id })}
                  className={cn(
                    "absolute inset-x-0 block w-full hover:bg-accent/5 focus-visible:z-10",
                    m % 60 === 0 && "border-t",
                    m % 60 === 30 && "border-t border-dashed border-border/60",
                  )}
                  style={{ top: i * ROW_PX, height: ROW_PX }}
                />
              );
            })}
            {appointments
              .filter((a) => a.resourceId === r.id && a.date === day.date)
              .map((a) => {
                const top = ((Math.max(a.startMin, start) - start) / SLOT) * ROW_PX;
                const height = Math.max(((Math.min(a.endMin, end) - Math.max(a.startMin, start)) / SLOT) * ROW_PX - 2, 20);
                return (
                  <Link
                    key={a.id}
                    href={`/app/appointments/${a.id}`}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-xs transition-colors",
                      // A cancelled opening sits under any replacement booked into the same time.
                      a.status === "CANCELLED" ? "z-[1]" : "z-[2]",
                      STATUS_STYLE[a.status].className,
                    )}
                    style={{ top: top + 1, height, background: STATUS_STYLE[a.status].background }}
                  >
                    <span className="block truncate font-medium text-foreground">
                      {a.status === "CANCELLED" ? "Opening · " : ""}
                      {a.customerName}
                    </span>
                    {height > 30 ? (
                      <span className="block truncate text-muted">
                        {a.timeLabel} · {a.serviceName}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekList({
  days,
  resources,
  appointments,
}: {
  days: Day[];
  resources: ScheduleResource[];
  appointments: ScheduleAppointment[];
}) {
  const names = new Map(resources.map((r) => [r.id, r.name.split(" ")[0]]));
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((d) => {
        const items = appointments.filter((a) => a.date === d.date);
        const live = items.filter((a) => a.status !== "CANCELLED").length;
        return (
          <section key={d.date} className="min-w-0 rounded-[var(--radius-card)] border bg-surface">
            <Link
              href={`/app/schedule?date=${d.date}&view=day`}
              className="flex items-baseline justify-between border-b px-3 py-2.5 hover:bg-surface-raised"
            >
              <span className="text-sm font-medium">{d.label}</span>
              <span className="text-xs text-muted">{d.openMin === null ? "Closed" : `${live} booked`}</span>
            </Link>
            <ul className="max-h-[520px] divide-y overflow-auto">
              {items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/app/appointments/${a.id}`}
                    className={cn("block px-3 py-2 text-xs hover:bg-surface-raised", a.status === "CANCELLED" && "text-muted line-through")}
                  >
                    <span className="tabular-nums text-muted">{a.timeLabel}</span>{" "}
                    <span className="font-medium">{a.customerName}</span>
                    <span className="block truncate text-muted">
                      {names.get(a.resourceId)} · {a.serviceName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
