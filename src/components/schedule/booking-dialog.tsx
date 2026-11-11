"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createAppointmentAction } from "@/server/actions/appointments";
import { idle } from "@/server/actions/result-client";
import { formatPaise } from "@/lib/money";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, Select, SubmitButton, TextInput } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { BookingPrefill, ScheduleCustomer, ScheduleResource, ScheduleService } from "./types";

type Mode = "existing" | "new" | "walkin";

export function BookingDialog({
  open,
  onClose,
  prefill,
  resources,
  services,
  customers,
}: {
  open: boolean;
  onClose: () => void;
  prefill: BookingPrefill;
  resources: ScheduleResource[];
  services: ScheduleService[];
  customers: ScheduleCustomer[];
}) {
  return (
    <Dialog open={open} onClose={onClose} title="New appointment" description="Book a customer into an open slot.">
      {/* Remount per opening so the form starts clean with the clicked slot. */}
      {open ? (
        <BookingForm
          key={`${prefill.date}-${prefill.time}-${prefill.resourceId}`}
          onDone={onClose}
          prefill={prefill}
          resources={resources}
          services={services}
          customers={customers}
        />
      ) : null}
    </Dialog>
  );
}

function BookingForm({
  onDone,
  prefill,
  resources,
  services,
  customers,
}: {
  onDone: () => void;
  prefill: BookingPrefill;
  resources: ScheduleResource[];
  services: ScheduleService[];
  customers: ScheduleCustomer[];
}) {
  const [state, action] = useActionState(createAppointmentAction, idle);
  const [mode, setMode] = useState<Mode>("existing");
  const [resourceId, setResourceId] = useState(prefill.resourceId ?? resources[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");

  const offered = useMemo(() => {
    const ids = resources.find((r) => r.id === resourceId)?.serviceIds ?? [];
    return services.filter((s) => ids.includes(s.id));
  }, [resourceId, resources, services]);
  const [serviceId, setServiceId] = useState(offered[0]?.id ?? "");
  const effectiveServiceId = offered.some((s) => s.id === serviceId) ? serviceId : (offered[0]?.id ?? "");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, "")))
      : customers;
    return list.slice(0, 6);
  }, [customers, query]);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="customerMode" value={mode} />
      <div role="radiogroup" aria-label="Customer" className="grid grid-cols-3 rounded-lg border p-0.5 text-sm">
        {(
          [
            ["existing", "Existing"],
            ["new", "New customer"],
            ["walkin", "Walk-in"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cn("h-8 rounded-md font-medium text-muted", mode === value && "bg-surface-raised text-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <Field label="Customer" htmlFor="customer-search" error={err.customerId}>
          <input type="hidden" name="customerId" value={customerId} />
          <TextInput
            id="customer-search"
            placeholder="Search by name or phone"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCustomerId("");
            }}
            autoComplete="off"
          />
          <ul role="listbox" aria-label="Matching customers" className="max-h-44 overflow-auto rounded-lg border">
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">No match. Use “New customer”.</li>
            ) : (
              matches.map((c) => (
                <li key={c.id} role="option" aria-selected={customerId === c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id);
                      setQuery(c.name);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-raised",
                      customerId === c.id && "bg-accent/10",
                    )}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs tabular-nums text-muted">{c.phone}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Field>
      ) : null}

      {mode === "new" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="newName" error={err.newName}>
            <TextInput id="newName" name="newName" autoComplete="off" />
          </Field>
          <Field label="Mobile" htmlFor="newPhone" error={err.newPhone} hint="Not added to the waitlist without consent.">
            <TextInput id="newPhone" name="newPhone" inputMode="tel" placeholder="98XXX XXXXX" />
          </Field>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Staff" htmlFor="resourceId" error={err.resourceId}>
          <Select id="resourceId" name="resourceId" value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Service" htmlFor="serviceId" error={err.serviceId}>
          <Select id="serviceId" name="serviceId" value={effectiveServiceId} onChange={(e) => setServiceId(e.target.value)}>
            {offered.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMinutes} min · {formatPaise(s.pricePaise)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="date" error={err.date}>
          <TextInput id="date" name="date" type="date" defaultValue={prefill.date} required />
        </Field>
        <Field label="Start time" htmlFor="time" error={err.time}>
          <TextInput id="time" name="time" type="time" step={900} defaultValue={prefill.time} required />
        </Field>
      </div>

      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <SubmitButton pendingLabel="Booking…">Book appointment</SubmitButton>
      </div>
    </form>
  );
}
