import "server-only";
import type { Member } from "../auth/dal";
import { db } from "../db";
import { summarizeRecovery } from "../domain/metrics";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

/** Campaigns launched in the last `days` days for the member's location, with what the metrics need. */
async function loadCampaigns(member: Member, since: Date) {
  return db.recoveryCampaign.findMany({
    where: { locationId: member.location.id, launchedAt: { gte: since } },
    orderBy: { launchedAt: "desc" },
    select: {
      id: true,
      status: true,
      valuePaise: true,
      startAt: true,
      launchedAt: true,
      claimedAt: true,
      service: { select: { name: true } },
      resource: { select: { name: true } },
      offers: { select: { sentAt: true, openedAt: true } },
      claim: {
        select: { appointment: { select: { status: true, customer: { select: { name: true } } } } },
      },
    },
  });
}

export async function getRecoveryMetrics(member: Member, days: number, now = new Date()) {
  const since = new Date(now.getTime() - days * 24 * 3600_000);
  const [campaigns, cancellations] = await Promise.all([
    loadCampaigns(member, since),
    db.appointment.count({
      where: { locationId: member.location.id, status: "CANCELLED", cancelledAt: { gte: since } },
    }),
  ]);

  const metrics = summarizeRecovery({
    campaigns: campaigns.map((c) => ({
      ...c,
      claim: c.claim ? { appointmentStatus: c.claim.appointment.status } : null,
    })),
    cancellations,
    days,
    timezone: member.location.timezone,
    now,
  });

  const recent = campaigns
    .filter((c) => c.status === "CLAIMED" && c.claimedAt)
    .sort((a, b) => b.claimedAt!.getTime() - a.claimedAt!.getTime())
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      serviceName: c.service.name,
      customerName: c.claim?.appointment.customer?.name ?? "Customer",
      valuePaise: c.valuePaise,
      startAt: c.startAt,
      minutesToFill: Math.round((c.claimedAt!.getTime() - c.launchedAt!.getTime()) / 60_000),
    }));

  return { metrics, recent, campaigns };
}
