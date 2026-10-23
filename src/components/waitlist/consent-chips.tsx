"use client";

import { useActionState } from "react";
import { setConsentAction } from "@/server/actions/waitlist";
import { idle } from "@/server/actions/result-client";
import { cn } from "@/lib/utils";
import type { Channel } from "@/generated/prisma/enums";

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
];

/** One toggle per channel. Off = no consent; turning one off stops outreach on it immediately. */
export function ConsentChips({ customerId, granted, reachable }: { customerId: string; granted: Channel[]; reachable: Channel[] }) {
  const [state, action] = useActionState(setConsentAction, idle);
  return (
    <div className="flex flex-wrap gap-1" title={state.message}>
      {CHANNELS.filter((c) => reachable.includes(c.value)).map((c) => {
        const on = granted.includes(c.value);
        return (
          <form key={c.value} action={action}>
            <input type="hidden" name="customerId" value={customerId} />
            <input type="hidden" name="channel" value={c.value} />
            <input type="hidden" name="granted" value={String(!on)} />
            <button
              type="submit"
              aria-pressed={on}
              aria-label={`${c.label} consent ${on ? "on" : "off"}. Toggle.`}
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                on ? "border-success/40 bg-success/10 text-success" : "text-muted line-through decoration-1 hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          </form>
        );
      })}
    </div>
  );
}
