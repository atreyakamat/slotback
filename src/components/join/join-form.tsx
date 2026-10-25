"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton, TextInput } from "@/components/ui/form";
import { idle } from "@/server/actions/result-client";
import { type JoinState, selfJoinAction } from "@/server/actions/waitlist-growth";

const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [0, "Sun"],
] as const;
const WINDOWS = [
  ["any", "Any time"],
  ["morning", "Mornings"],
  ["afternoon", "Afternoons"],
  ["evening", "Evenings"],
] as const;

const chip =
  "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-transparent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40";

export function JoinForm({ code, business, services }: { code: string; business: string; services: { id: string; name: string }[] }) {
  const [state, action] = useActionState<JoinState, FormData>(selfJoinAction.bind(null, code), idle);
  if (state.ok) {
    return (
      <div role="status" className="grid justify-items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-highlight text-highlight-foreground">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="font-display text-2xl">You&apos;re on the list</h2>
        <p className="max-w-xs text-muted">
          When a slot opens that fits, {business} will message you a link. The first to tap gets it. Reply STOP any time to opt out.
        </p>
      </div>
    );
  }
  const err = (k: string) => state.fieldErrors?.[k];
  const v = state.values;
  return (
    <form action={action} className="grid gap-5" noValidate>
      <Field label="Your name" htmlFor="join-name" error={err("name")}>
        <TextInput id="join-name" name="name" autoComplete="name" defaultValue={v?.name} required />
      </Field>
      <Field label="Mobile number" htmlFor="join-phone" error={err("phone")}>
        <TextInput id="join-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXX XXXXX" defaultValue={v?.phone} required />
      </Field>
      {services.length > 0 ? (
        <Field label="What would you like?" htmlFor="join-service">
          <Select id="join-service" name="serviceId" defaultValue={v?.serviceId ?? ""}>
            <option value="">Anything that opens up</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Which days suit you? Leave empty for any day.</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(([d, label]) => (
            <label key={d} className={chip}>
              <input type="checkbox" name="days" value={d} defaultChecked={v?.days.includes(String(d))} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">What time of day?</legend>
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map(([value, label]) => (
            <label key={value} className={chip}>
              <input type="radio" name="window" value={value} defaultChecked={value === (v?.window ?? "any")} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2 rounded-xl border bg-surface p-4">
        <legend className="float-left mb-1 w-full text-sm font-medium">How can {business} tell you about openings?</legend>
        {(["WHATSAPP", "SMS"] as const).map((c) => (
          <label key={c} className="flex items-center gap-3 text-sm">
            <input type="checkbox" name={`consent-${c}`} defaultChecked={v?.channels.includes(c)} className="size-4 accent-[var(--accent)]" />
            {c === "WHATSAPP" ? "Message me on WhatsApp" : "Text me (SMS)"}
          </label>
        ))}
        <p className="text-xs text-muted">Only for last-minute openings you asked for. Opt out any time.</p>
      </fieldset>
      <div className="hidden" aria-hidden>
        <label htmlFor="join-website">Website</label>
        <input id="join-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message ? <FormMessage state={state} /> : null}
      <SubmitButton size="lg" className="w-full" pendingLabel="Joining…">
        Join the waitlist
      </SubmitButton>
    </form>
  );
}
