"use client";

import { useActionState } from "react";
import { updateLocationAction } from "@/server/actions/settings";
import { idle } from "@/server/actions/result-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

type Hours = Record<string, { open: string; close: string }[]>;

export function LocationForm({
  location,
  disabled,
}: {
  location: {
    name: string;
    address: string | null;
    phone: string | null;
    businessHours: Hours;
    minLeadMinutes: number;
    offerTtlMinutes: number;
    offerBatchSize: number;
    quietHoursStart: string;
    quietHoursEnd: string;
    autoNextRound: boolean;
    maxRounds: number;
  };
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateLocationAction, idle);
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4">
      <fieldset disabled={disabled} className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Location name" htmlFor="name" error={err.name}>
              <TextInput id="name" name="name" defaultValue={location.name} required />
            </Field>
            <Field label="Phone" htmlFor="phone" error={err.phone} hint="Shown to customers on claim pages.">
              <TextInput id="phone" name="phone" defaultValue={location.phone ?? ""} inputMode="tel" />
            </Field>
            <Field label="Address" htmlFor="address" error={err.address} className="sm:col-span-2">
              <TextInput id="address" name="address" defaultValue={location.address ?? ""} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Opening hours</CardTitle>
              <CardDescription className="mt-1">Openings are only offered inside these hours.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {ORDER.map((d) => {
                const h = location.businessHours[String(d)]?.[0];
                return (
                  <div key={d} className="grid grid-cols-[110px_1fr] items-center gap-3 sm:grid-cols-[140px_auto_auto_1fr]">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" name={`open-${d}`} defaultChecked={Boolean(h)} className="size-4 accent-[var(--accent)]" />
                      {DAYS[d]}
                    </label>
                    <div className="flex items-center gap-2">
                      <TextInput aria-label={`${DAYS[d]} opens`} type="time" name={`from-${d}`} defaultValue={h?.open ?? "10:00"} className="w-32" />
                      <span className="text-muted">–</span>
                      <TextInput aria-label={`${DAYS[d]} closes`} type="time" name={`to-${d}`} defaultValue={h?.close ?? "20:00"} className="w-32" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Refill rules</CardTitle>
              <CardDescription className="mt-1">How SlotBack offers a cancelled opening to your waitlist.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Minimum notice (min)" htmlFor="minLeadMinutes" error={err.minLeadMinutes} hint="Don't offer slots starting sooner.">
              <TextInput id="minLeadMinutes" name="minLeadMinutes" type="number" min={0} defaultValue={location.minLeadMinutes} />
            </Field>
            <Field label="Offer expires after (min)" htmlFor="offerTtlMinutes" error={err.offerTtlMinutes}>
              <TextInput id="offerTtlMinutes" name="offerTtlMinutes" type="number" min={5} defaultValue={location.offerTtlMinutes} />
            </Field>
            <Field label="Customers per round" htmlFor="offerBatchSize" error={err.offerBatchSize}>
              <TextInput id="offerBatchSize" name="offerBatchSize" type="number" min={1} max={50} defaultValue={location.offerBatchSize} />
            </Field>
            <Field label="Quiet hours start" htmlFor="quietHoursStart" error={err.quietHoursStart}>
              <TextInput id="quietHoursStart" name="quietHoursStart" type="time" defaultValue={location.quietHoursStart} />
            </Field>
            <Field label="Quiet hours end" htmlFor="quietHoursEnd" error={err.quietHoursEnd} hint="No customer messages in between.">
              <TextInput id="quietHoursEnd" name="quietHoursEnd" type="time" defaultValue={location.quietHoursEnd} />
            </Field>
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input type="checkbox" name="autoNextRound" defaultChecked={location.autoNextRound} className="mt-0.5 size-4 accent-[var(--accent)]" />
              <span>
                <span className="font-medium">Send the next round automatically</span>
                <span className="block text-muted">If nobody claims before the offers expire, the next people in line get it. No tap needed.</span>
              </span>
            </label>
            <Field label="Most rounds per opening" htmlFor="maxRounds" error={err.maxRounds} hint="Includes the first one.">
              <TextInput id="maxRounds" name="maxRounds" type="number" min={1} max={10} defaultValue={location.maxRounds} />
            </Field>
          </CardContent>
        </Card>
      </fieldset>

      <FormMessage state={state} />
      {disabled ? (
        <p className="text-sm text-muted">Only owners and admins can change these settings.</p>
      ) : (
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
        </div>
      )}
    </form>
  );
}
