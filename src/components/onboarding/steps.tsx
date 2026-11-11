"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import { idle } from "@/server/actions/result-client";
import { finishOnboardingAction, saveHoursStepAction, saveServicesStepAction, saveStaffStepAction } from "@/server/actions/onboarding";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function Footer({ back, label }: { back?: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t pt-6">
      {back ? (
        <Link href={back} className="text-sm text-muted hover:text-foreground">
          Back
        </Link>
      ) : (
        <span />
      )}
      <SubmitButton size="lg" pendingLabel="Saving…">
        {label}
      </SubmitButton>
    </div>
  );
}

export function HoursStep({ hours }: { hours: Record<string, { open: string; close: string }[]> }) {
  const [state, action] = useActionState(saveHoursStepAction, idle);
  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-2">
        {ORDER.map((d) => {
          const h = hours[String(d)]?.[0];
          return (
            <div key={d} className="grid items-center gap-2 rounded-xl border bg-surface px-3 py-2 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name={`open-${d}`} defaultChecked={Boolean(h)} className="size-4 accent-[var(--accent)]" />
                {DAYS[d]}
              </label>
              <div className="flex items-center gap-2">
                <TextInput aria-label={`${DAYS[d]} opens`} type="time" name={`from-${d}`} defaultValue={h?.open ?? "10:00"} className="w-36" />
                <span className="text-muted">to</span>
                <TextInput aria-label={`${DAYS[d]} closes`} type="time" name={`to-${d}`} defaultValue={h?.close ?? "20:00"} className="w-36" />
              </div>
            </div>
          );
        })}
      </div>
      <FormMessage state={state} />
      <Footer label="Continue" />
    </form>
  );
}

type Row = { name: string; durationMinutes: number; priceRupees: number; on: boolean };

export function ServicesStep({ suggested, existing }: { suggested: Row[]; existing: { name: string; durationMinutes: number; priceRupees: number }[] }) {
  const [state, action] = useActionState(saveServicesStepAction, idle);
  const [rows, setRows] = useState<Row[]>(suggested.length > 0 ? suggested : [{ name: "", durationMinutes: 60, priceRupees: 1000, on: true }]);
  return (
    <form action={action} className="grid gap-6">
      {existing.length > 0 ? (
        <div className="rounded-xl border bg-surface p-4 text-sm">
          <p className="font-medium">Already added</p>
          <ul className="mt-2 grid gap-1 text-muted">
            {existing.map((s) => (
              <li key={s.name}>
                {s.name} · {s.durationMinutes} min · ₹{s.priceRupees.toLocaleString("en-IN")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-2">
        <div className="hidden grid-cols-[1.5rem_1fr_5.5rem_6.5rem] gap-3 px-3 text-xs text-muted sm:grid">
          <span />
          <span>Service</span>
          <span>Minutes</span>
          <span>Price (₹)</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className={cn("grid grid-cols-[1.5rem_1fr] items-center gap-3 rounded-xl border bg-surface px-3 py-2 sm:grid-cols-[1.5rem_1fr_5.5rem_6.5rem]", !r.on && "opacity-60")}>
            <input
              type="checkbox"
              name={`svc-${i}-on`}
              checked={r.on}
              onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))}
              aria-label={`Include ${r.name || "this service"}`}
              className="size-4 accent-[var(--accent)]"
            />
            <TextInput name={`svc-${i}-name`} defaultValue={r.name} placeholder="Service name" aria-label="Service name" />
            <TextInput name={`svc-${i}-min`} type="number" min={5} defaultValue={r.durationMinutes} aria-label="Minutes" className="col-start-2 sm:col-start-auto" />
            <TextInput name={`svc-${i}-price`} type="number" min={0} step={50} defaultValue={r.priceRupees} aria-label="Price in rupees" className="col-start-2 sm:col-start-auto" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((all) => [...all, { name: "", durationMinutes: 60, priceRupees: 1000, on: true }])}
          className="flex items-center gap-2 justify-self-start rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:bg-surface-raised"
        >
          <Plus className="size-4" aria-hidden /> Add a service
        </button>
      </div>
      <p className="text-sm text-muted">Prices are what a refilled slot counts as in your recovered revenue. You can change everything later in Settings.</p>
      <FormMessage state={state} />
      <Footer back="/onboarding?step=hours" label="Continue" />
    </form>
  );
}

export function StaffStep({ initial, existing }: { initial: string[]; existing: string[] }) {
  const [state, action] = useActionState(saveStaffStepAction, idle);
  const [names, setNames] = useState(initial.length > 0 ? initial : [""]);
  return (
    <form action={action} className="grid gap-6">
      {existing.length > 0 ? <p className="rounded-xl border bg-surface p-4 text-sm text-muted">Already added: {existing.join(", ")}</p> : null}
      <div className="grid gap-2">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextInput name="staff" defaultValue={n} placeholder="Name, or a room like “Treatment room 1”" aria-label={`Staff member ${i + 1}`} />
            {names.length > 1 ? (
              <button
                type="button"
                onClick={() => setNames((all) => all.filter((_, j) => j !== i))}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-foreground"
                aria-label={`Remove staff member ${i + 1}`}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setNames((all) => [...all, ""])}
          className="flex items-center gap-2 justify-self-start rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:bg-surface-raised"
        >
          <Plus className="size-4" aria-hidden /> Add someone
        </button>
      </div>
      <p className="text-sm text-muted">Each person or room gets their own row on the schedule. Everyone can do every service for now.</p>
      <FormMessage state={state} />
      <Footer back="/onboarding?step=services" label="Continue" />
    </form>
  );
}

export function RulesStep({ rules }: { rules: { offerBatchSize: number; offerTtlMinutes: number; minLeadMinutes: number; quietHoursStart: string; quietHoursEnd: string } }) {
  const [state, action] = useActionState(finishOnboardingAction, idle);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Clients per round" htmlFor="offerBatchSize" error={err.offerBatchSize} hint="How many waitlisted clients hear about each opening at once.">
          <TextInput id="offerBatchSize" name="offerBatchSize" type="number" min={1} max={50} defaultValue={rules.offerBatchSize} />
        </Field>
        <Field label="Link works for (minutes)" htmlFor="offerTtlMinutes" error={err.offerTtlMinutes} hint="After this, you can send the next round.">
          <TextInput id="offerTtlMinutes" name="offerTtlMinutes" type="number" min={5} defaultValue={rules.offerTtlMinutes} />
        </Field>
        <Field label="Minimum notice (minutes)" htmlFor="minLeadMinutes" error={err.minLeadMinutes} hint="Slots starting sooner than this aren't offered.">
          <TextInput id="minLeadMinutes" name="minLeadMinutes" type="number" min={0} defaultValue={rules.minLeadMinutes} />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:max-w-sm">
          <Field label="Quiet from" htmlFor="quietHoursStart" error={err.quietHoursStart}>
            <TextInput id="quietHoursStart" name="quietHoursStart" type="time" defaultValue={rules.quietHoursStart} />
          </Field>
          <Field label="Until" htmlFor="quietHoursEnd" error={err.quietHoursEnd} hint="No messages in between.">
            <TextInput id="quietHoursEnd" name="quietHoursEnd" type="time" defaultValue={rules.quietHoursEnd} />
          </Field>
        </div>
      </div>
      <p className="text-sm text-muted">These defaults work well for most businesses. You can change them any time in Settings.</p>
      <FormMessage state={state} />
      <Footer back="/onboarding?step=staff" label="Finish setup" />
    </form>
  );
}
