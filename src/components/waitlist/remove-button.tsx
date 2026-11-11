"use client";

import { X } from "lucide-react";
import { useActionState } from "react";
import { removeWaitlistAction } from "@/server/actions/waitlist";
import { idle } from "@/server/actions/result-client";
import { SubmitButton } from "@/components/ui/form";

export function RemoveFromWaitlist({ entryId, name }: { entryId: string; name: string }) {
  const [, action] = useActionState(removeWaitlistAction, idle);
  return (
    <form action={action}>
      <input type="hidden" name="entryId" value={entryId} />
      <SubmitButton variant="ghost" size="sm" aria-label={`Remove ${name} from the waitlist`}>
        <X />
      </SubmitButton>
    </form>
  );
}
