import "server-only";
import type { Member } from "../auth/dal";
import { toActor } from "../auth/dal";
import { db } from "../db";
import { previewCampaign } from "../domain/campaigns";
import { env } from "../env";

export async function getCampaignDetail(member: Member, id: string) {
  const exists = await db.recoveryCampaign.findFirst({ where: { id, locationId: member.location.id }, select: { id: true } });
  if (!exists) return null;

  const [preview, offers, claim] = await Promise.all([
    previewCampaign(db, toActor(member), id, { baseUrl: env().NEXT_PUBLIC_APP_URL }),
    db.offer.findMany({
      where: { campaignId: id },
      orderBy: { rank: "asc" },
      include: {
        customer: { select: { name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, errorCode: true, nextAttemptAt: true } },
      },
    }),
    db.claim.findUnique({
      where: { campaignId: id },
      include: { appointment: { select: { id: true, customer: { select: { name: true } } } } },
    }),
  ]);
  // Demo workspaces show the simulated messages so the flow can be demonstrated end to end.
  const demoMessages = member.organization.isDemo
    ? await db.outboxMessage.findMany({
        where: { offer: { campaignId: id } },
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, status: true, channel: true, offer: { select: { customer: { select: { name: true } } } } },
      })
    : [];
  return { ...preview, offers, claim, demoMessages };
}

export async function listCampaigns(member: Member) {
  return db.recoveryCampaign.findMany({
    where: { locationId: member.location.id },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    include: {
      service: { select: { name: true } },
      resource: { select: { name: true } },
      _count: { select: { offers: true } },
      claim: { include: { appointment: { select: { customer: { select: { name: true } } } } } },
    },
  });
}

export async function getWaitlist(member: Member) {
  const locationId = member.location.id;
  const [entries, services, customers] = await Promise.all([
    db.waitlistEntry.findMany({
      where: { locationId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      include: {
        service: { select: { name: true } },
        customer: {
          select: { id: true, name: true, phone: true, email: true, preferredChannel: true, consents: { select: { channel: true, status: true } } },
        },
      },
    }),
    db.service.findMany({ where: { locationId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.customer.findMany({ where: { locationId, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
  ]);
  return { entries, services, customers };
}
