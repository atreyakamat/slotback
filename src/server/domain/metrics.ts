import type { AppointmentStatus, CampaignStatus } from "@/generated/prisma/enums";
import { addDays, localDateKey } from "@/lib/time";

/** The slice of a campaign the metrics need. Loaded by the query layer, summarized here. */
export type CampaignFact = {
  id: string;
  status: CampaignStatus;
  valuePaise: number;
  startAt: Date;
  launchedAt: Date | null;
  claimedAt: Date | null;
  offers: { sentAt: Date | null; openedAt: Date | null }[];
  claim: { appointmentStatus: AppointmentStatus } | null;
};

export type RecoveryMetrics = ReturnType<typeof summarizeRecovery>;

function median(xs: number[]) {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Headline recovery numbers for a period.
 *
 * - Recovered value counts every claimed opening (an estimate until the visit happens).
 * - Completed value counts only recovered appointments marked completed: the money actually earned.
 * - Fill rate is claimed / settled campaigns, so openings still being offered don't drag it down.
 */
export function summarizeRecovery(input: {
  campaigns: CampaignFact[];
  cancellations: number;
  days: number;
  timezone: string;
  now: Date;
}) {
  const { campaigns, timezone, now, days } = input;
  const launched = campaigns.filter((c) => c.launchedAt);
  const claimed = launched.filter((c) => c.status === "CLAIMED");
  const settled = launched.filter((c) => c.status === "CLAIMED" || c.status === "EXPIRED" || c.status === "CANCELLED");
  const completed = claimed.filter((c) => c.claim?.appointmentStatus === "COMPLETED");
  const upcoming = claimed.filter((c) => c.claim?.appointmentStatus === "BOOKED");

  const offers = launched.flatMap((c) => c.offers);
  const fillMinutes = claimed
    .filter((c) => c.launchedAt && c.claimedAt)
    .map((c) => (c.claimedAt!.getTime() - c.launchedAt!.getTime()) / 60_000);

  // One bucket per local day, oldest first, keyed by the day the opening was claimed.
  const today = localDateKey(now, timezone);
  const series = Array.from({ length: days }, (_, i) => ({ date: addDays(today, i - days + 1), valuePaise: 0, count: 0 }));
  const byDate = new Map(series.map((d) => [d.date, d]));
  for (const c of claimed) {
    const bucket = c.claimedAt ? byDate.get(localDateKey(c.claimedAt, timezone)) : undefined;
    if (bucket) {
      bucket.valuePaise += c.valuePaise;
      bucket.count += 1;
    }
  }

  return {
    cancellations: input.cancellations,
    launched: launched.length,
    claimed: claimed.length,
    expired: launched.filter((c) => c.status === "EXPIRED").length,
    active: launched.filter((c) => c.status === "ACTIVE").length,
    fillRate: settled.length ? claimed.length / settled.length : null,
    recoveredPaise: claimed.reduce((sum, c) => sum + c.valuePaise, 0),
    completedPaise: completed.reduce((sum, c) => sum + c.valuePaise, 0),
    upcomingPaise: upcoming.reduce((sum, c) => sum + c.valuePaise, 0),
    medianMinutesToFill: median(fillMinutes),
    funnel: {
      cancellations: input.cancellations,
      offered: launched.length,
      messagesSent: offers.filter((o) => o.sentAt).length,
      opened: offers.filter((o) => o.openedAt).length,
      claimed: claimed.length,
      completed: completed.length,
    },
    series,
  };
}
