"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { saveServiceAction, toggleServiceAction } from "@/server/actions/settings";
import { idle } from "@/server/actions/result-client";
import { formatPaise } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";

type Service = { id: string; name: string; durationMinutes: number; pricePaise: number; active: boolean; resourceIds: string[] };
type Resource = { id: string; name: string; active: boolean };

export function ServicesManager({ services, resources, canEdit }: { services: Service[]; resources: Resource[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const close = useCallback(() => setEditing(null), []);
  const [toggleState, toggle] = useActionState(toggleServiceAction, idle);
  const staffNames = new Map(resources.map((r) => [r.id, r.name]));

  return (
    <div className="grid gap-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add service
          </Button>
        </div>
      ) : null}
      <FormMessage state={toggleState} />
      <Card className="divide-y">
        {services.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {s.name}
                {!s.active ? <Badge>Archived</Badge> : null}
              </p>
              <p className="text-sm text-muted">
                {s.durationMinutes} min · {formatPaise(s.pricePaise)} ·{" "}
                {s.resourceIds.length ? s.resourceIds.map((id) => staffNames.get(id)).join(", ") : "No staff assigned"}
              </p>
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
                  <Pencil /> Edit
                </Button>
                <form action={toggle}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value={String(!s.active)} />
                  <SubmitButton variant="ghost" size="sm">
                    {s.active ? "Archive" : "Restore"}
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </Card>
      <Dialog open={editing !== null} onClose={close} title={editing === "new" ? "Add service" : "Edit service"}>
        {editing !== null ? (
          <ServiceForm key={editing === "new" ? "new" : editing.id} service={editing === "new" ? null : editing} resources={resources} onDone={close} />
        ) : null}
      </Dialog>
    </div>
  );
}

function ServiceForm({ service, resources, onDone }: { service: Service | null; resources: Resource[]; onDone: () => void }) {
  const [state, action] = useActionState(saveServiceAction, idle);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <Field label="Name" htmlFor="svc-name" error={err.name}>
        <TextInput id="svc-name" name="name" defaultValue={service?.name} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Duration (minutes)" htmlFor="svc-duration" error={err.durationMinutes}>
          <TextInput id="svc-duration" name="durationMinutes" type="number" min={5} step={5} defaultValue={service?.durationMinutes ?? 60} />
        </Field>
        <Field label="Price (₹)" htmlFor="svc-price" error={err.priceRupees} hint="Used to estimate recovered value.">
          <TextInput id="svc-price" name="priceRupees" type="number" min={0} defaultValue={service ? service.pricePaise / 100 : ""} />
        </Field>
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Who offers it</legend>
        {resources
          .filter((r) => r.active)
          .map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="resourceIds" value={r.id} defaultChecked={service?.resourceIds.includes(r.id)} className="size-4 accent-[var(--accent)]" />
              {r.name}
            </label>
          ))}
      </fieldset>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save service</SubmitButton>
      </div>
    </form>
  );
}
