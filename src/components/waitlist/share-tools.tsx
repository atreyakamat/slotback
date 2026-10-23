"use client";

import { Check, Copy, Printer, RotateCcw } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { idle } from "@/server/actions/result-client";
import { resetJoinLinkAction } from "@/server/actions/waitlist-growth";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

export function PrintPoster() {
  return (
    <a href="/poster" target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-surface-raised">
      <Printer className="size-4" aria-hidden /> Print a counter poster
    </a>
  );
}

export function ResetLink() {
  const [state, action] = useActionState(resetJoinLinkAction, idle);
  return (
    <form action={action} className="grid gap-3">
      <SubmitButton variant="ghost" pendingLabel="Resetting…" className="justify-self-start">
        <RotateCcw /> Reset the link
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
