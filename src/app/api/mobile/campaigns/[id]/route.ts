import { EXCLUSION_LABELS } from "@/server/domain/eligibility";
import { DomainError } from "@/server/domain/errors";
import { mobileRoute } from "@/server/mobile/route";
import { getCampaignDetail } from "@/server/queries/campaigns";

/** A recovery campaign: the slot, who fits and why others don't, offers sent so far, and who claimed it. */
export const GET = mobileRoute<{ id: string }>(async ({ member, params }) => {
  const d = await getCampaignDetail(member, params.id);
  if (!d) throw new DomainError("not_found", "That opening was not found.");
  const eligible = d.evaluated.filter((e) => e.eligible);
  return {
    id: d.campaign.id,
    status: d.campaign.status,
    startAt: d.campaign.startAt,
    endAt: d.campaign.endAt,
    expiresAt: d.campaign.expiresAt,
    service: d.service.name,
    staff: d.resource.name,
    valuePaise: d.campaign.valuePaise,
    batchSize: d.rules.offerBatchSize,
    quietUntil: d.quiet ? d.sendAt : null,
    message: d.message,
    nextUp: eligible.filter((e) => !e.candidate.alreadyOffered).slice(0, d.rules.offerBatchSize).map((e) => e.candidate.name),
    eligibleCount: eligible.length,
    excluded: d.evaluated
      .filter((e) => !e.eligible)
      .map((e) => ({ name: e.candidate.name, reason: e.eligible ? "" : EXCLUSION_LABELS[e.reason] })),
    offers: d.offers.map((o) => ({
      id: o.id,
      customer: o.customer.name,
      channel: o.channel,
      status: o.status,
      expiresAt: o.expiresAt,
    })),
    claimedBy: d.claim?.appointment.customer?.name ?? null,
  };
});
