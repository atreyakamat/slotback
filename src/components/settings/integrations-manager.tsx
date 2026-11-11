"use client";

import { Copy, Plug } from "lucide-react";
import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormMessage, SubmitButton, TextInput } from "@/components/ui/form";
import { formatDate } from "@/lib/time";
import {
  createIntegrationAction,
  revokeIntegrationAction,
  updateIntegrationAction,
  type CreateIntegrationState,
} from "@/server/actions/integrations";
import { idle } from "@/server/actions/result-client";

type Connection = {
  id: string;
  name: string;
  keyPrefix: string;
  webhookUrl: string | null;
  autoRefill: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  bookings: number;
  signingSecret: string;
  lastDelivery: { status: string; lastError: string | null } | null;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md border bg-surface-raised px-2 py-1.5 font-mono text-xs">{value}</code>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(value).catch(() => undefined);
            setCopied(true);
          }}
        >
          <Copy /> {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsManager({ connections, apiBase, canManage, timezone }: { connections: Connection[]; apiBase: string; canManage: boolean; timezone: string }) {
  const [created, create] = useActionState<CreateIntegrationState, FormData>(createIntegrationAction, idle);
  const [revoked, revoke] = useActionState(revokeIntegrationAction, idle);
  const err = created.fieldErrors ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-6">
        <Card className="grid gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
              <Plug className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-lg">Connect your booking tool</h2>
              <p className="text-sm text-muted">Bookings and cancellations flow in. Refilled slots flow back.</p>
            </div>
          </div>
          <ol className="grid list-decimal gap-1.5 pl-5 text-sm text-muted">
            <li>Create a key below and paste it into your booking tool, Zapier or Make.</li>
            <li>
              Send each booking change to <code className="break-all font-mono text-xs text-foreground">POST {apiBase}/api/integrations/v1/bookings</code>.
            </li>
            <li>When a cancellation comes in, SlotBack starts offering the slot to your waitlist.</li>
          </ol>

          {created.key ? (
            <div className="grid gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
              <p className="text-sm font-medium">
                {created.name} is connected. Copy the key now: it won&apos;t be shown again.
              </p>
              <CopyField label="API key" value={created.key} />
              <CopyField label="Webhook signing secret" value={created.signingSecret!} />
            </div>
          ) : null}

          {canManage ? (
            <form action={create} className="grid gap-3">
              <Field label="Name" htmlFor="name" error={err.name} hint="The tool it's for, like Fresha or Zapier.">
                <TextInput id="name" name="name" required maxLength={60} placeholder="Zapier" />
              </Field>
              <Field label="Webhook URL (optional)" htmlFor="webhookUrl" error={err.webhookUrl} hint="We POST signed events here when a slot is refilled. https only.">
                <TextInput id="webhookUrl" name="webhookUrl" type="url" inputMode="url" placeholder="https://hooks.example.com/slotback" />
              </Field>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="autoRefill" defaultChecked className="mt-0.5 size-4 accent-[var(--accent)]" />
                <span>
                  <span className="font-medium">Refill cancellations automatically</span>
                  <span className="block text-muted">Start offering the slot as soon as the tool reports a cancellation.</span>
                </span>
              </label>
              <FormMessage state={created.key ? idle : created} />
              <SubmitButton pendingLabel="Creating…" className="justify-self-start">
                Create key
              </SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-muted">Only owners and admins can create connections.</p>
          )}
        </Card>
      </div>

      <section aria-labelledby="connections" className="grid min-w-0 content-start gap-3">
        <h2 id="connections" className="text-sm font-medium">
          Connections
        </h2>
        <FormMessage state={revoked} />
        {connections.length === 0 ? (
          <Card className="p-6 text-sm text-muted">No connections yet.</Card>
        ) : (
          connections.map((c) => <ConnectionCard key={c.id} c={c} canManage={canManage} timezone={timezone} revoke={revoke} />)
        )}
      </section>
    </div>
  );
}

function ConnectionCard({ c, canManage, timezone, revoke }: { c: Connection; canManage: boolean; timezone: string; revoke: (f: FormData) => void }) {
  const [saved, save] = useActionState(updateIntegrationAction, idle);
  return (
    <Card className="grid gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{c.name}</p>
        <Badge>{c.keyPrefix}…</Badge>
        {c.autoRefill ? <Badge tone="success">Auto-refill</Badge> : null}
        {c.lastDelivery?.status === "FAILED" ? <Badge tone="danger">Webhook failing</Badge> : null}
      </div>
      <p className="text-sm text-muted">
        {c.bookings} booking{c.bookings === 1 ? "" : "s"} synced · {c.lastUsedAt ? `last used ${formatDate(c.lastUsedAt, timezone)}` : "not used yet"}
      </p>
      {c.lastDelivery?.status === "FAILED" && c.lastDelivery.lastError ? <p className="text-xs text-danger">Last webhook error: {c.lastDelivery.lastError}</p> : null}
      {canManage ? (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted hover:text-foreground">Edit</summary>
          <form action={save} className="mt-3 grid gap-3">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="name" value={c.name} />
            <Field label="Webhook URL" htmlFor={`url-${c.id}`} error={saved.fieldErrors?.webhookUrl}>
              <TextInput id={`url-${c.id}`} name="webhookUrl" type="url" defaultValue={c.webhookUrl ?? ""} placeholder="https://…" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="autoRefill" defaultChecked={c.autoRefill} className="size-4 accent-[var(--accent)]" />
              Refill cancellations automatically
            </label>
            {c.webhookUrl ? <CopyField label="Webhook signing secret" value={c.signingSecret} /> : null}
            <FormMessage state={saved} />
            <div className="flex flex-wrap gap-2">
              <SubmitButton size="sm" pendingLabel="Saving…">
                Save
              </SubmitButton>
            </div>
          </form>
          <form action={revoke} className="mt-2">
            <input type="hidden" name="id" value={c.id} />
            <SubmitButton size="sm" variant="ghost" pendingLabel="Removing…">
              Remove connection
            </SubmitButton>
          </form>
        </details>
      ) : null}
    </Card>
  );
}
