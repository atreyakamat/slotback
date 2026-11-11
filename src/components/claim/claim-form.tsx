"use client";

import { useActionState } from "react";
import { claimAction } from "@/server/actions/campaigns";
import { idle } from "@/server/actions/result-client";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function ClaimForm({ token }: { token: string }) {
  const [state, action] = useActionState(claimAction, idle);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg" className="h-12 w-full text-base" pendingLabel="Booking…">
        Claim this slot
      </SubmitButton>
      {!state.ok ? <FormMessage state={state} /> : null}
    </form>
  );
}
