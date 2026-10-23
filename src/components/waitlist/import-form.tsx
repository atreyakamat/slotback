"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton, Textarea } from "@/components/ui/form";
import { importWaitlistAction, type ImportState } from "@/server/actions/waitlist-growth";

const idle: ImportState = { ok: false };
const SAMPLE = "Name,Phone,Service\nAsha Naik,98765 43210,Haircut\nRohan Kamat,+91 91234 56789,";

export function ImportForm() {
  const [state, action] = useActionState(importWaitlistAction, idle);
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div className="grid gap-6">
      <form action={action} onSubmit={() => setFileName(null)} className="grid gap-5">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-surface px-6 py-10 text-center transition-colors hover:border-accent/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40">
          <Upload className="size-6 text-accent" aria-hidden />
          <span className="font-medium">{fileName ?? "Choose a CSV file"}</span>
          <span className="text-sm text-muted">Export it from Excel, Google Sheets or your booking tool. Up to 1,000 clients.</span>
          <input type="file" name="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
        </label>
        <Field label="Or paste your list" htmlFor="pasted" hint="First row: column names. Name and Phone are required; Email and Service are optional.">
          <Textarea id="pasted" name="pasted" rows={5} defaultValue={state.pasted} placeholder={SAMPLE} className="font-mono text-xs" />
        </Field>
        <label className="flex items-start gap-3 rounded-xl border bg-surface p-4 text-sm">
          <input type="checkbox" name="attested" className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
          <span>
            <span className="font-medium">These clients agreed to hear from us on WhatsApp or SMS.</span>
            <span className="mt-1 block text-muted">
              Leave this unticked if you&apos;re not sure. They&apos;ll still be added, but won&apos;t be messaged until they agree, for example by
              joining through your QR link. Anyone who opted out stays opted out.
            </span>
          </span>
        </label>
        <FormMessage state={state} />
        <div>
          <SubmitButton size="lg" pendingLabel="Importing…">
            Import clients
          </SubmitButton>
        </div>
      </form>

      {state.result && state.result.skipped.length > 0 ? (
        <div className="rounded-2xl border bg-surface p-5">
          <p className="font-medium">Skipped rows</p>
          <ul className="mt-3 grid max-h-64 gap-1 overflow-y-auto text-sm text-muted">
            {state.result.skipped.map((s) => (
              <li key={s.line}>
                Row {s.line}: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.ok ? (
        <Link href="/app/waitlist" className="text-sm font-medium text-accent underline underline-offset-4">
          See your waitlist
        </Link>
      ) : null}
    </div>
  );
}
