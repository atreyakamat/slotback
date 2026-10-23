"use client";

import { useActionState } from "react";
import { Field, FormMessage, Select, SubmitButton, Textarea, TextInput } from "@/components/ui/form";
import { idle } from "@/server/actions/result-client";
import { bookDemoAction } from "@/server/actions/leads";

const VERTICALS = ["Salon", "Spa", "Dental clinic", "Physiotherapy", "Skin clinic", "Other"];

export function BookDemoForm() {
  const [state, action] = useActionState(bookDemoAction, idle);
  const err = (k: string) => state.fieldErrors?.[k];
  const invalid = (k: string) => (err(k) ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  if (state.ok) {
    return (
      <div className="grid gap-3">
        <FormMessage state={state} />
        <p className="text-sm text-muted">
          In the meantime, you can click around the{" "}
          <a href="/login" className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
            live demo
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="lead-name" error={err("name")}>
          <TextInput id="lead-name" name="name" autoComplete="name" required {...invalid("name")} />
        </Field>
        <Field label="Business name" htmlFor="lead-business" error={err("business")}>
          <TextInput id="lead-business" name="business" autoComplete="organization" required {...invalid("business")} />
        </Field>
        <Field label="Mobile (WhatsApp)" htmlFor="lead-phone" error={err("phone")}>
          <TextInput id="lead-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98XXX XXXXX" {...invalid("phone")} />
        </Field>
        <Field label="Email" htmlFor="lead-email" error={err("email")}>
          <TextInput id="lead-email" name="email" type="email" autoComplete="email" {...invalid("email")} />
        </Field>
        <Field label="City" htmlFor="lead-city" error={err("city")}>
          <TextInput id="lead-city" name="city" autoComplete="address-level2" placeholder="Panaji" />
        </Field>
        <Field label="Type of business" htmlFor="lead-vertical" error={err("vertical")}>
          <Select id="lead-vertical" name="vertical" defaultValue="">
            <option value="">Choose one</option>
            {VERTICALS.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Anything we should know? (optional)" htmlFor="lead-message" error={err("message")}>
        <Textarea id="lead-message" name="message" placeholder="How many cancellations you see in a week, the tools you use today…" />
      </Field>
      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="lead-website">Website</label>
        <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton size="lg" pendingLabel="Sending…">
          Book a demo
        </SubmitButton>
        <p className="text-xs text-muted">
          Phone or email is enough. We only use it to arrange the demo. <a href="/privacy" className="underline">Privacy</a>
        </p>
      </div>
    </form>
  );
}
