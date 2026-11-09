"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { submitBooking, type BookingFormState } from "@/server/actions/booking";

export function BookingForm({ slug, serviceId, startAt, clinicName }: { slug: string; serviceId: string; startAt: string; clinicName: string }) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(submitBooking, {});
  return (
    <form action={action} className="mt-4 grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="startAt" value={startAt} />
      <div className="hidden" aria-hidden>
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} defaultValue={state.fields?.name} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="phone">WhatsApp number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          required
          defaultValue={state.fields?.phone}
        />
      </div>
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input type="checkbox" name="whatsappConsent" defaultChecked className="mt-0.5 size-4 accent-[var(--accent)]" />
        <span>
          Send me my booking confirmation and reminders on WhatsApp from {clinicName}. I can stop them at any time.
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Book appointment
      </Button>
    </form>
  );
}
