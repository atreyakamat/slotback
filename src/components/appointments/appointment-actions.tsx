"use client";

import { CalendarClock, Check, Send, UserX, X } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { changeStatusAction, rescheduleAppointmentAction } from "@/server/actions/appointments";
import { cancelAndRefillAction, refillAction } from "@/server/actions/campaigns";
import { idle } from "@/server/actions/result-client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, Select, SubmitButton, TextInput, Textarea } from "@/components/ui/form";
import type { AppointmentStatus } from "@/generated/prisma/enums";

export function AppointmentActions({
  id,
  status,
  isPast,
  date,
  time,
  resourceId,
  resources,
  canRefill,
}: {
  id: string;
  status: AppointmentStatus;
  isPast: boolean;
  /** Future, cancelled, and no campaign yet: offer it to the waitlist. */
  canRefill: boolean;
  date: string;
  time: string;
  resourceId: string;
  resources: { id: string; name: string }[];
}) {
  const [statusState, statusAction] = useActionState(changeStatusAction, idle);
  const [dialog, setDialog] = useState<"cancel" | "move" | null>(null);
  const close = useCallback(() => setDialog(null), []);

  if (status === "CANCELLED") return canRefill ? <RefillButton id={id} /> : null;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "BOOKED" ? (
          <>
            <Button variant="danger" onClick={() => setDialog("cancel")}>
              <X /> Cancel appointment
            </Button>
            <Button variant="secondary" onClick={() => setDialog("move")}>
              <CalendarClock /> Move
            </Button>
          </>
        ) : null}
        {(status === "BOOKED" && isPast) || status === "NO_SHOW" ? (
          <form action={statusAction}>
            <input type="hidden" name="appointmentId" value={id} />
            <input type="hidden" name="to" value="COMPLETED" />
            <SubmitButton variant="secondary">
              <Check /> Mark completed
            </SubmitButton>
          </form>
        ) : null}
        {(status === "BOOKED" && isPast) || status === "COMPLETED" ? (
          <form action={statusAction}>
            <input type="hidden" name="appointmentId" value={id} />
            <input type="hidden" name="to" value="NO_SHOW" />
            <SubmitButton variant="secondary">
              <UserX /> Mark no-show
            </SubmitButton>
          </form>
        ) : null}
      </div>
      <FormMessage state={statusState} />

      <Dialog
        open={dialog === "cancel"}
        onClose={close}
        title={isPast ? "Cancel this appointment?" : "Cancel this appointment and try to refill the opening?"}
        description={isPast ? undefined : "SlotBack will show you which waitlisted customers fit before anything is sent."}
      >
        {dialog === "cancel" ? <CancelForm id={id} onDone={close} canOffer={!isPast} /> : null}
      </Dialog>
      <Dialog open={dialog === "move"} onClose={close} title="Move appointment">
        {dialog === "move" ? <MoveForm id={id} date={date} time={time} resourceId={resourceId} resources={resources} onDone={close} /> : null}
      </Dialog>
    </div>
  );
}

function CancelForm({ id, onDone, canOffer }: { id: string; onDone: () => void; canOffer: boolean }) {
  const [state, action] = useActionState(changeStatusAction, idle);
  const [refillState, refill] = useActionState(cancelAndRefillAction, idle);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={canOffer ? refill : action} className="grid gap-4">
      <input type="hidden" name="appointmentId" value={id} />
      <input type="hidden" name="to" value="CANCELLED" />
      <Field label="Reason (optional)" htmlFor="reason" hint="Helps you spot patterns later. Not shared with the customer.">
        <Textarea id="reason" name="reason" maxLength={200} placeholder="e.g. Feeling unwell" />
      </Field>
      <FormMessage state={canOffer ? refillState : state} />
      <div className="flex flex-wrap justify-end gap-2">
        {canOffer ? (
          <>
            <SubmitButton variant="ghost" formAction={action}>
              Cancel without refilling
            </SubmitButton>
            <SubmitButton pendingLabel="Cancelling…">
              <Send /> Cancel and refill
            </SubmitButton>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={onDone}>
              Keep appointment
            </Button>
            <SubmitButton variant="danger" pendingLabel="Cancelling…">
              Cancel appointment
            </SubmitButton>
          </>
        )}
      </div>
    </form>
  );
}

function RefillButton({ id }: { id: string }) {
  const [state, action] = useActionState(refillAction, idle);
  return (
    <div className="grid gap-3">
      <form action={action}>
        <input type="hidden" name="appointmentId" value={id} />
        <SubmitButton pendingLabel="Opening…">
          <Send /> Offer this opening to the waitlist
        </SubmitButton>
      </form>
      <FormMessage state={state} />
    </div>
  );
}

function MoveForm({
  id,
  date,
  time,
  resourceId,
  resources,
  onDone,
}: {
  id: string;
  date: string;
  time: string;
  resourceId: string;
  resources: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(rescheduleAppointmentAction, idle);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="appointmentId" value={id} />
      <Field label="Staff" htmlFor="move-resource" error={err.resourceId}>
        <Select id="move-resource" name="resourceId" defaultValue={resourceId}>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="move-date" error={err.date}>
          <TextInput id="move-date" name="date" type="date" defaultValue={date} required />
        </Field>
        <Field label="Start time" htmlFor="move-time" error={err.time}>
          <TextInput id="move-time" name="time" type="time" step={900} defaultValue={time} required />
        </Field>
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Moving…">Move appointment</SubmitButton>
      </div>
    </form>
  );
}
