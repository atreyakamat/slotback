import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { CAMPAIGN_STATUS } from "@/components/campaigns/labels";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPaise } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { listCampaigns } from "@/server/queries/campaigns";

export const metadata: Metadata = { title: "Recovery" };

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Recovery"
        description="Every cancelled opening you've offered to the waitlist, and what happened."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Campaigns />
      </Suspense>
    </>
  );
}

async function Campaigns() {
  const member = await requireMember();
  const campaigns = await listCampaigns(member);
  const tz = member.location.timezone;

  if (campaigns.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="font-medium">Your next recovered appointment starts here.</p>
        <p className="mt-1 text-sm text-muted">
          Open any upcoming appointment on the <Link href="/app/schedule" className="text-accent hover:underline">schedule</Link>{" "}
          and choose “Cancel and refill” when a customer cancels.
        </p>
      </Card>
    );
  }

  return (
    <Card className="divide-y">
      {campaigns.map((c) => {
        const s = CAMPAIGN_STATUS[c.status];
        return (
          <Link key={c.id} href={`/app/campaigns/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-surface-raised">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {c.service.name} · {formatDate(c.startAt, tz)} {formatTime(c.startAt, tz)}
              </p>
              <p className="truncate text-sm text-muted">
                {c.resource.name} · {c._count.offers} offer{c._count.offers === 1 ? "" : "s"}
                {c.claim ? ` · claimed by ${c.claim.appointment.customer?.name}` : ""}
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted">{formatPaise(c.valuePaise)}</span>
            <Badge tone={s.tone}>{s.label}</Badge>
          </Link>
        );
      })}
    </Card>
  );
}
