"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { REMINDER_OFFSET_CHOICES, describeOffset } from "@/lib/reminders";
import { updateBookingSettings, type BookingSettingsState } from "@/server/actions/reminders";

export function BookingSettingsForm({
  appUrl,
  bookingEnabled,
  bookingSlug,
  reminderOffsets,
}: {
  appUrl: string;
  bookingEnabled: boolean;
  bookingSlug: string;
  reminderOffsets: number[];
}) {
  const [state, action, pending] = useActionState<BookingSettingsState, FormData>(updateBookingSettings, {});
  return (
    <form action={action} className="grid gap-5">
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="bookingEnabled" defaultChecked={bookingEnabled} className="size-4 accent-[var(--accent)]" />
        Accept online bookings
      </label>

      <div className="grid gap-1.5">
        <Label htmlFor="bookingSlug">Booking link</Label>
        <div className="flex items-center overflow-hidden rounded-lg border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <span className="shrink-0 border-r bg-surface-raised px-3 py-2.5 text-sm text-muted">{appUrl.replace(/^https?:\/\//, "")}/book/</span>
          <Input
            id="bookingSlug"
            name="bookingSlug"
            defaultValue={bookingSlug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            minLength={3}
            maxLength={48}
            className="rounded-none border-0 focus-visible:ring-0"
          />
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">WhatsApp reminders before each appointment</legend>
        <div className="flex flex-wrap gap-2">
          {REMINDER_OFFSET_CHOICES.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input type="checkbox" name="reminderOffsets" value={o} defaultChecked={reminderOffsets.includes(o)} className="size-4 accent-[var(--accent)]" />
              {describeOffset(o)}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted">Up to three. Changes apply to new bookings. Nothing is sent during quiet hours.</p>
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null} Save
        </Button>
        {state.saved && !pending ? (
          <span role="status" className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" aria-hidden /> Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
