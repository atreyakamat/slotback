"use client";

import { Plus } from "lucide-react";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { addWaitlistAction } from "@/server/actions/waitlist";
import { idle } from "@/server/actions/result-client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, Select, SubmitButton, TextInput, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AddWaitlistDialog({
  services,
  customers,
}: {
  services: { id: string; name: string }[];
  customers: { id: string; name: string; phone: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Add to waitlist
      </Button>
      <Dialog open={open} onClose={close} title="Add to waitlist" description="Only customers who agreed to be contacted will receive offers.">
        {open ? <AddForm services={services} customers={customers} onDone={close} /> : null}
      </Dialog>
    </>
  );
}

function AddForm({
  services,
  customers,
  onDone,
}: {
  services: { id: string; name: string }[];
  customers: { id: string; name: string; phone: string | null }[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(addWaitlistAction, idle);
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q)) : customers).slice(0, 5);
  }, [customers, query]);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="customerMode" value={mode} />
      <div role="radiogroup" aria-label="Customer" className="grid grid-cols-2 rounded-lg border p-0.5 text-sm">
        {(
          [
            ["new", "New customer"],
            ["existing", "Existing customer"],
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

      {mode === "new" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="wl-name" error={err.name}>
              <TextInput id="wl-name" name="name" autoComplete="off" />
            </Field>
            <Field label="Mobile" htmlFor="wl-phone" error={err.phone}>
              <TextInput id="wl-phone" name="phone" inputMode="tel" placeholder="98XXX XXXXX" />
            </Field>
            <Field label="Email (optional)" htmlFor="wl-email" error={err.email}>
              <TextInput id="wl-email" name="email" type="email" />
            </Field>
            <Field label="Prefers" htmlFor="wl-channel">
              <Select id="wl-channel" name="preferredChannel" defaultValue="WHATSAPP">
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </Select>
            </Field>
          </div>
          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">The customer agreed to receive openings on</legend>
            <div className="mt-1 flex flex-wrap gap-4">
              {[
                ["WHATSAPP", "WhatsApp"],
                ["SMS", "SMS"],
                ["EMAIL", "Email"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="consent" value={v} className="size-4 accent-[var(--accent)]" />
                  {l}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Leave all unchecked if you haven&apos;t asked yet. They won&apos;t be messaged.</p>
          </fieldset>
        </>
      ) : (
        <Field label="Customer" htmlFor="wl-search" error={err.customerId}>
          <input type="hidden" name="customerId" value={customerId} />
          <TextInput
            id="wl-search"
            placeholder="Search by name or phone"
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setCustomerId("");
            }}
          />
          <ul className="max-h-40 overflow-auto rounded-lg border">
            {matches.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerId(c.id);
                    setQuery(c.name);
                  }}
                  className={cn("flex w-full justify-between px-3 py-2 text-left text-sm hover:bg-surface-raised", customerId === c.id && "bg-accent/10")}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted">{c.phone}</span>
                </button>
              </li>
            ))}
          </ul>
        </Field>
      )}

      <Field label="Wants" htmlFor="wl-service">
        <Select id="wl-service" name="serviceId" defaultValue="">
          <option value="">Any service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Days that work (none = any day)</legend>
        <div className="flex flex-wrap gap-1.5">
          {ORDER.map((d) => (
            <label key={d} className="cursor-pointer">
              <input type="checkbox" name="days" value={d} className="peer sr-only" />
              <span className="inline-block rounded-md border px-2.5 py-1 text-sm text-muted peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
                {DAYS[d]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Earliest" htmlFor="wl-from">
          <TextInput id="wl-from" name="from" type="time" defaultValue="10:00" step={900} />
        </Field>
        <Field label="Latest" htmlFor="wl-to" error={err.to}>
          <TextInput id="wl-to" name="to" type="time" defaultValue="20:00" step={900} />
        </Field>
      </div>
      <Field label="Notes (optional)" htmlFor="wl-notes">
        <Textarea id="wl-notes" name="notes" maxLength={200} className="min-h-14" />
      </Field>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Adding…">Add to waitlist</SubmitButton>
      </div>
    </form>
  );
}
