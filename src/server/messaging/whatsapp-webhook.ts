import type { MessageStatus } from "@/generated/prisma/client";
import { normalizeIndianPhone } from "../domain/customers";
import type { Db } from "../domain/types";
import { setConsent } from "../domain/waitlist";

/** The parts of Meta's webhook payload SlotBack reads. */
export type WhatsAppWebhook = {
  entry?: {
    changes?: {
      value?: {
        statuses?: { id: string; status: string; errors?: { code?: number }[] }[];
        messages?: { from: string; type: string; text?: { body?: string }; button?: { text?: string } }[];
      };
    }[];
  }[];
};

const STATUS: Record<string, MessageStatus> = { sent: "SENT", delivered: "DELIVERED", read: "DELIVERED", failed: "FAILED" };
/** A status update only moves forward: a late "sent" never overwrites "delivered". */
const MAY_BECOME: Record<MessageStatus, MessageStatus[]> = {
  QUEUED: [],
  SENT: ["QUEUED"],
  DELIVERED: ["QUEUED", "SENT"],
  FAILED: ["QUEUED", "SENT"],
};

const OPT_OUT = /^\s*(stop|stop all|unsubscribe|opt out|cancel)\s*[.!]?\s*$/i;

export type WebhookResult = { statuses: number; optOuts: number };

/**
 * Applies delivery receipts to the outbox and offers, and turns a "STOP" reply into an
 * immediate WhatsApp opt-out. SlotBack sends from one number for every business, so the
 * client can't say which business they mean: the opt-out applies to all of them.
 */
export async function handleWhatsAppWebhook(db: Db, payload: WhatsAppWebhook): Promise<WebhookResult> {
  const result: WebhookResult = { statuses: 0, optOuts: 0 };
  const values = (payload.entry ?? []).flatMap((e) => e.changes ?? []).map((c) => c.value ?? {});

  for (const s of values.flatMap((v) => v.statuses ?? [])) {
    const status = STATUS[s.status];
    if (!status) continue;
    const errorCode = status === "FAILED" ? `meta_${s.errors?.[0]?.code ?? "unknown"}` : undefined;
    const { count } = await db.outboxMessage.updateMany({
      where: { providerMessageId: s.id, status: { in: MAY_BECOME[status] } },
      data: { status, errorCode },
    });
    if (count === 0) continue;
    result.statuses++;
    const msg = await db.outboxMessage.findFirst({ where: { providerMessageId: s.id }, select: { offerId: true } });
    if (msg?.offerId) {
      await db.offer.updateMany({ where: { id: msg.offerId, status: { in: MAY_BECOME[status] } }, data: { status } });
    }
  }

  for (const m of values.flatMap((v) => v.messages ?? [])) {
    const text = m.text?.body ?? m.button?.text ?? "";
    if (!OPT_OUT.test(text)) continue;
    const phone = normalizeIndianPhone(m.from);
    if (!phone) continue;
    const customers = await db.customer.findMany({
      where: { phone, deletedAt: null, consents: { some: { channel: "WHATSAPP", status: "GRANTED" } } },
      select: { id: true, locationId: true, location: { select: { organizationId: true } } },
    });
    for (const c of customers) {
      await setConsent(
        db,
        { organizationId: c.location.organizationId, locationId: c.locationId, userId: null },
        { customerId: c.id, channel: "WHATSAPP", granted: false, source: "whatsapp_stop_reply" },
      );
      result.optOuts++;
    }
  }
  return result;
}
