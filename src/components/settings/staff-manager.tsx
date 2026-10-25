"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useCallback, useEffect, useState } from "react";
import { saveResourceAction, toggleResourceAction } from "@/server/actions/settings";
import { idle } from "@/server/actions/result-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";

type Staff = { id: string; name: string; active: boolean; serviceIds: string[] };
type Service = { id: string; name: string; active: boolean };

export function StaffManager({ staff, services, canEdit }: { staff: Staff[]; services: Service[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const close = useCallback(() => setEditing(null), []);
  const [toggleState, toggle] = useActionState(toggleResourceAction, idle);
  const serviceNames = new Map(services.map((s) => [s.id, s.name]));

  return (
    <div className="grid gap-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("new")}>
            <Plus /> Add staff member
          </Button>
        </div>
      ) : null}
      <FormMessage state={toggleState} />
      <Card className="divide-y">
        {staff.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {m.name}
                {!m.active ? <Badge>Archived</Badge> : null}
              </p>
              <p className="text-sm text-muted">
                {m.serviceIds.length ? m.serviceIds.map((id) => serviceNames.get(id)).join(", ") : "No services yet"}
              </p>
            </div>
            {canEdit ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>
                  <Pencil /> Edit
                </Button>
                <form action={toggle}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="active" value={String(!m.active)} />
                  <SubmitButton variant="ghost" size="sm">
                    {m.active ? "Archive" : "Restore"}
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </Card>
      <Dialog open={editing !== null} onClose={close} title={editing === "new" ? "Add staff member" : "Edit staff member"}>
        {editing !== null ? (
          <StaffForm key={editing === "new" ? "new" : editing.id} member={editing === "new" ? null : editing} services={services} onDone={close} />
        ) : null}
      </Dialog>
    </div>
  );
}

function StaffForm({ member, services, onDone }: { member: Staff | null; services: Service[]; onDone: () => void }) {
  const [state, action] = useActionState(saveResourceAction, idle);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="grid gap-4">
      {member ? <input type="hidden" name="id" value={member.id} /> : null}
      <Field label="Name" htmlFor="staff-name" error={state.fieldErrors?.name}>
        <TextInput id="staff-name" name="name" defaultValue={member?.name} required />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Services they offer</legend>
        {services
          .filter((s) => s.active)
          .map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="serviceIds" value={s.id} defaultChecked={member?.serviceIds.includes(s.id)} className="size-4 accent-[var(--accent)]" />
              {s.name}
            </label>
          ))}
      </fieldset>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
      </div>
    </form>
  );
}
