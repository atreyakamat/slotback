import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CheckCircle2, Clock, PartyPopper } from "lucide-react";
import { Skeleton } from "@/components/app/skeleton";
import { AutoRefresh } from "@/components/campaigns/auto-refresh";
import {
  CampaignControls,
  RetryButton,
} from "@/components/campaigns/campaign-controls";
import { DemoInbox } from "@/components/campaigns/demo-inbox";
import { MessagePreview } from "@/components/campaigns/message-preview";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CAMPAIGN_STATUS,
  CHANNEL_LABEL,
  OFFER_STATUS,
} from "@/components/campaigns/labels";
import { formatPaise } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { EXCLUSION_LABELS } from "@/server/domain/eligibility";
import { getCampaignDetail } from "@/server/queries/campaigns";

export const metadata: Metadata = { title: "Recovery campaign" };

export default function CampaignPage({
  params,
}: PageProps<"/app/campaigns/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Campaign params={params} />
    </Suspense>
  );
}

async function Campaign({
  params,
}: {
  params: PageProps<"/app/campaigns/[id]">["params"];
}) {
  const member = await requireMember();
  const { id } = await params;
  const detail = await getCampaignDetail(member, id);
  if (!detail) notFound();
  const {
    campaign,
    service,
    resource,
    rules,
    evaluated,
    message,
    offers,
    claim,
    quiet,
    sendAt,
    demoMessages,
  } = detail;
  const tz = rules.timezone;
  const status = CAMPAIGN_STATUS[campaign.status];
  const eligible = evaluated.filter((e) => e.eligible);
  const excluded = evaluated.filter(
    (e) => !e.eligible && e.reason !== "already_offered",
  );
  const outstanding = offers.some((o) =>
    ["QUEUED", "SENT", "DELIVERED", "OPENED"].includes(o.status),
  );
  const live = campaign.status === "ACTIVE";

  return (
    <>
      {live ? <AutoRefresh /> : null}
      <Link
        href="/app/campaigns"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Recovery
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl tracking-tight">
          {service.name} · {formatTime(campaign.startAt, tz)}
        </h1>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="-mt-4 mb-8 text-sm text-muted">
        {formatDate(campaign.startAt, tz, { weekday: "long", month: "long" })} ·{" "}
        {formatTime(campaign.startAt, tz)} – {formatTime(campaign.endAt, tz)}{" "}
        with {resource.name} · worth {formatPaise(campaign.valuePaise)}
      </p>

      {claim ? (
        <Card className="mb-6 border-success/40 bg-success/5">
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <PartyPopper className="size-5 text-success" aria-hidden />
            <p className="flex-1 text-sm">
              <span className="font-semibold">
                {claim.appointment.customer?.name}
              </span>{" "}
              claimed this opening at {formatTime(claim.claimedAt, tz)}.
              It&apos;s on the schedule.
            </p>
            <Link
              href={`/app/appointments/${claim.appointment.id}`}
              className="text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              View appointment →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-4">
          {offers.length > 0 ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Offers sent</CardTitle>
                  <CardDescription className="mt-1">
                    {live
                      ? "Updates automatically. The first customer to confirm gets the slot."
                      : "Final outcome of each offer."}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {offers.map((o) => {
                    const s = OFFER_STATUS[o.status];
                    const msg = o.messages[0];
                    return (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-center gap-3 py-2.5"
                      >
                        <span className="w-6 text-xs tabular-nums text-muted">
                          #{o.rank}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {o.customer.name}
                        </span>
                        <span className="text-xs text-muted">
                          {CHANNEL_LABEL[o.channel]}
                        </span>
                        <Badge tone={s.tone}>{s.label}</Badge>
                        {msg?.status === "FAILED" && o.status === "FAILED" ? (
                          <RetryButton messageId={msg.id} />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {campaign.status === "DRAFT" || live ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>
                    {offers.length
                      ? "Next in line"
                      : "Who will be offered this opening"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Opted-in waitlist customers who fit the service, day and
                    time. Exact service requests come first, then by who joined
                    earliest.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {eligible.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted">
                    {offers.length
                      ? "Everyone who fits has been offered. Add to the waitlist to reach more customers."
                      : "No matching customers are available right now. Add to the waitlist or handle this slot manually."}
                  </p>
                ) : (
                  <ol className="divide-y">
                    {eligible.map((e) =>
                      e.eligible ? (
                        <li
                          key={e.candidate.customerId}
                          className="flex items-center gap-3 py-2.5"
                        >
                          <span className="w-6 text-xs tabular-nums text-muted">
                            {e.rank}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {e.candidate.name}
                          </span>
                          <span className="hidden text-xs text-muted sm:inline">
                            {e.candidate.entryServiceId
                              ? "Asked for this service"
                              : "Any service"}
                          </span>
                          <Badge tone="success">
                            <CheckCircle2 className="size-3" />{" "}
                            {CHANNEL_LABEL[e.channel]}
                          </Badge>
                        </li>
                      ) : null,
                    )}
                  </ol>
                )}
                {excluded.length > 0 ? (
                  <details className="mt-4 rounded-lg border">
                    <summary className="cursor-pointer px-3 py-2 text-sm text-muted">
                      {excluded.length} waitlisted customer
                      {excluded.length === 1 ? "" : "s"} not offered, and why
                    </summary>
                    <ul className="divide-y border-t">
                      {excluded.map((e) =>
                        !e.eligible ? (
                          <li
                            key={e.candidate.customerId}
                            className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                          >
                            <span>{e.candidate.name}</span>
                            <span className="text-muted">
                              {EXCLUSION_LABELS[e.reason]}
                            </span>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </details>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid content-start gap-4">
          <MessagePreview body={message} channelLabel="WhatsApp / SMS" />
          <Card>
            <CardContent className="grid gap-2 pt-5 text-sm">
              <p className="flex items-center gap-2 text-muted">
                <Clock className="size-4" aria-hidden /> Each offer is open for{" "}
                {rules.offerTtlMinutes} minutes, up to {rules.offerBatchSize}{" "}
                customers at a time.
              </p>
              {campaign.expiresAt ? (
                <p className="text-muted">
                  Offers stop at {formatTime(campaign.expiresAt, tz)} (
                  {rules.minLeadMinutes} min before the appointment).
                </p>
              ) : null}
              {quiet &&
              (campaign.status === "DRAFT" || campaign.status === "ACTIVE") ? (
                <p className="text-warning">
                  Quiet hours now: messages will go out at{" "}
                  {formatTime(sendAt, tz)}.
                </p>
              ) : null}
            </CardContent>
          </Card>
          <CampaignControls
            campaignId={campaign.id}
            status={campaign.status}
            eligibleRemaining={eligible.length}
            batchSize={rules.offerBatchSize}
            hasOutstandingOffers={outstanding}
          />
          <DemoInbox messages={demoMessages} />
        </div>
      </div>
    </>
  );
}
