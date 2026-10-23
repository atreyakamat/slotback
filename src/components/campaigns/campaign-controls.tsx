"use client";

import { RotateCw, Send, Square } from "lucide-react";
import { useActionState } from "react";
import { retryMessageAction, sendRoundAction, stopCampaignAction } from "@/server/actions/campaigns";
import { idle } from "@/server/actions/result-client";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import type { CampaignStatus } from "@/generated/prisma/enums";

export function CampaignControls({
  campaignId,
  status,
  eligibleRemaining,
  batchSize,
  hasOutstandingOffers,
  autoRounds,
}: {
  campaignId: string;
  status: CampaignStatus;
  eligibleRemaining: number;
  batchSize: number;
  hasOutstandingOffers: boolean;
  /** Automatic rounds left after this one, or null when automatic rounds are off. */
  autoRounds: { left: number } | null;
}) {
  const [sendState, send] = useActionState(sendRoundAction, idle);
  const [stopState, stop] = useActionState(stopCampaignAction, idle);
  if (status !== "DRAFT" && status !== "ACTIVE") return null;
  const next = Math.min(eligibleRemaining, batchSize);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {eligibleRemaining > 0 ? (
          <form action={send}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <SubmitButton size="lg" variant={status === "ACTIVE" && hasOutstandingOffers ? "secondary" : "primary"} pendingLabel="Sending…">
              <Send />
              {status === "DRAFT" ? `Launch: offer to ${next} customer${next === 1 ? "" : "s"}` : `Offer to next ${next}`}
            </SubmitButton>
          </form>
        ) : null}
        <form action={stop}>
          <input type="hidden" name="campaignId" value={campaignId} />
          <SubmitButton size="lg" variant="ghost">
            <Square /> {status === "DRAFT" ? "Handle manually" : "Stop offering"}
          </SubmitButton>
        </form>
      </div>
      {status === "ACTIVE" && hasOutstandingOffers && eligibleRemaining > 0 && autoRounds && autoRounds.left > 0 ? (
        <p className="text-sm text-muted">
          If nobody claims before these offers close, SlotBack offers it to the next {next} automatically.
        </p>
      ) : null}
      <FormMessage state={sendState.message ? sendState : stopState} />
    </div>
  );
}

export function RetryButton({ messageId }: { messageId: string }) {
  const [state, action] = useActionState(retryMessageAction, idle);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="messageId" value={messageId} />
      <SubmitButton variant="ghost" size="sm" title={state.message}>
        <RotateCw /> Retry
      </SubmitButton>
    </form>
  );
}
