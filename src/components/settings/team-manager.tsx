"use client";

import { MessageCircle, UserPlus } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { CopyLink } from "@/components/waitlist/share-tools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, FormMessage, Select, SubmitButton, TextInput } from "@/components/ui/form";
import type { Role } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/time";
import { idle } from "@/server/actions/result-client";
import { changeRoleAction, inviteAction, removeMemberAction, revokeInviteAction, type InviteState } from "@/server/actions/team";

type Member = { id: string; role: Role; user: { id: string; name: string; email: string } };
type Invite = { id: string; name: string; email: string; role: Role; expiresAt: Date };

const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner", ADMIN: "Admin", STAFF: "Staff" };
const ROLE_HELP: Record<Role, string> = {
  OWNER: "Everything, including the team",
  ADMIN: "Settings, services, staff and imports",
  STAFF: "Schedule, waitlist and recovery",
};

export function TeamManager({
  members,
  invites,
  me,
  assignable,
  timezone,
}: {
  members: Member[];
  invites: Invite[];
  me: string;
  assignable: Role[];
  timezone: string;
}) {
  const [inviting, setInviting] = useState(0);
  const close = useCallback(() => setInviting(0), []);
  const [rowState, rowAction] = useActionState(changeRoleAction, idle);
  const [removeState, remove] = useActionState(removeMemberAction, idle);
  const [revokeState, revoke] = useActionState(revokeInviteAction, idle);
  const canManage = assignable.length > 0;

  return (
    <div className="grid gap-6">
      {canManage ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted">
            Everyone signs in with their own email. Removing someone stops their access straight away.
          </p>
          <Button onClick={() => setInviting((n) => n + 1)}>
            <UserPlus /> Invite someone
          </Button>
        </div>
      ) : null}
      <FormMessage state={rowState} />
      <FormMessage state={removeState} />
      <FormMessage state={revokeState} />

      <Card className="divide-y">
        {members.map((m) => {
          const editable = canManage && m.user.id !== me && assignable.includes(m.role);
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {m.user.name}
                  {m.user.id === me ? <Badge>You</Badge> : null}
                </p>
                <p className="truncate text-sm text-muted">{m.user.email}</p>
              </div>
              {editable ? (
                <div className="flex flex-wrap items-center gap-2">
                  <form action={rowAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <label className="sr-only" htmlFor={`role-${m.id}`}>
                      Role for {m.user.name}
                    </label>
                    <Select
                      id={`role-${m.id}`}
                      name="role"
                      defaultValue={m.role}
                      className="h-8 w-28"
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      {assignable.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                  </form>
                  <form
                    action={remove}
                    onSubmit={(e) => {
                      if (!confirm(`Remove ${m.user.name} from the team?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={m.id} />
                    <SubmitButton variant="ghost" size="sm" pendingLabel="Removing…">
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              ) : (
                <Badge tone={m.role === "OWNER" ? "accent" : "neutral"} title={ROLE_HELP[m.role]}>
                  {ROLE_LABEL[m.role]}
                </Badge>
              )}
            </div>
          );
        })}
      </Card>

      {invites.length > 0 ? (
        <section aria-labelledby="pending-invites" className="grid gap-3">
          <h2 id="pending-invites" className="text-sm font-medium">
            Waiting to join
          </h2>
          <Card className="divide-y">
            {invites.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {i.name} <Badge>{ROLE_LABEL[i.role]}</Badge>
                  </p>
                  <p className="truncate text-sm text-muted">
                    {i.email} · link works until {formatDate(i.expiresAt, timezone)}
                  </p>
                </div>
                {canManage ? (
                  <form action={revoke}>
                    <input type="hidden" name="id" value={i.id} />
                    <SubmitButton variant="ghost" size="sm" pendingLabel="Cancelling…">
                      Cancel invite
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            ))}
          </Card>
          <p className="text-xs text-muted">Lost the link? Invite the same email again for a new one. The old link stops working.</p>
        </section>
      ) : null}

      <ul className="grid gap-2 text-sm text-muted sm:grid-cols-3">
        {(["OWNER", "ADMIN", "STAFF"] as const).map((r) => (
          <li key={r} className="rounded-xl border bg-surface p-3">
            <span className="font-medium text-foreground">{ROLE_LABEL[r]}:</span> {ROLE_HELP[r]}
          </li>
        ))}
      </ul>

      <Dialog open={inviting > 0} onClose={close} title="Invite someone" description="They'll get a link to sign in with this email.">
        {inviting > 0 ? <InviteForm key={inviting} assignable={assignable} /> : null}
      </Dialog>
    </div>
  );
}

function InviteForm({ assignable }: { assignable: Role[] }) {
  const [state, action] = useActionState<InviteState, FormData>(inviteAction, idle);
  if (state.ok && state.link) {
    const text = `Hi ${state.name?.split(" ")[0]}, join our team on SlotBack: ${state.link}`;
    return (
      <div className="grid gap-4">
        <p className="text-sm">
          Send this link to <span className="font-medium">{state.email}</span>. It works for 7 days, and only with that email.
        </p>
        <p className="break-all rounded-lg bg-surface-raised px-3 py-2 font-mono text-xs">{state.link}</p>
        <div className="flex flex-wrap gap-2">
          <CopyLink url={state.link} />
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-surface-raised"
          >
            <MessageCircle className="size-4" aria-hidden /> Send on WhatsApp
          </a>
        </div>
        <p className="text-xs text-muted">For safety we don&apos;t keep the link. If it&apos;s lost, invite them again.</p>
      </div>
    );
  }
  const err = (k: string) => state.fieldErrors?.[k];
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field label="Name" htmlFor="invite-name" error={err("name")}>
        <TextInput id="invite-name" name="name" autoComplete="off" defaultValue={state.name} required />
      </Field>
      <Field label="Email" htmlFor="invite-email" error={err("email")}>
        <TextInput id="invite-email" name="email" type="email" inputMode="email" autoComplete="off" defaultValue={state.email} required />
      </Field>
      <Field label="Role" htmlFor="invite-role">
        <Select id="invite-role" name="role" defaultValue="STAFF">
          {assignable.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}: {ROLE_HELP[r]}
            </option>
          ))}
        </Select>
      </Field>
      {state.message ? <FormMessage state={state} /> : null}
      <SubmitButton pendingLabel="Creating invite…">Create invite link</SubmitButton>
    </form>
  );
}
