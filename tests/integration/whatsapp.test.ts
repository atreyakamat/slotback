import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createBusiness } from "@/server/domain/accounts";
import { processOutbox } from "@/server/messaging/outbox";
import type { OutgoingMessage } from "@/server/messaging/provider";
import { registerProvider } from "@/server/messaging/registry";
import { handleWhatsAppWebhook } from "@/server/messaging/whatsapp-webhook";
import { hasTestDb, testDb } from "../support/db";

describe.skipIf(!hasTestDb)("WhatsApp delivery and replies", () => {
  const db = hasTestDb ? testDb() : (null as never);
  const tag = randomUUID().slice(0, 8);
  const emails = [`wa-a-${tag}@example.com`, `wa-b-${tag}@example.com`];
  const orgs: { organizationId: string; locationId: string }[] = [];
  const digits = String(Date.now()).slice(-9);
  const phone = `+91 9${digits.slice(0, 4)} ${digits.slice(4)}`;
  const sent: OutgoingMessage[] = [];

  beforeAll(async () => {
    for (const [i, email] of emails.entries()) {
      orgs.push(await createBusiness(db, { email, ownerName: "Owner", businessName: `WA ${i}`, city: "Panaji", vertical: "salon" }));
    }
    registerProvider({
      name: `wa-test-${tag}`,
      keepsBodies: false,
      channels: ["WHATSAPP"],
      async send(m) {
        sent.push(m);
        return { providerMessageId: `wamid.${tag}`, delivered: false };
      },
    });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: orgs.map((o) => o.organizationId) } } });
    await db.user.deleteMany({ where: { email: { in: emails } } });
  });

  it("sends the template, then clears it so the claim token isn't kept", async () => {
    const msg = await db.outboxMessage.create({
      data: {
        locationId: orgs[0].locationId,
        channel: "WHATSAPP",
        provider: `wa-test-${tag}`,
        toAddress: phone,
        body: "Tap https://slotback.example/c/secret-token-value",
        template: { name: "slot_opening", body: ["Asha"], urlSuffix: "secret-token-value" },
        idempotencyKey: `wa-${tag}`,
      },
    });
    await processOutbox(db, new Date(Date.now() + 1000));
    expect(sent.at(-1)?.template).toEqual({ name: "slot_opening", body: ["Asha"], urlSuffix: "secret-token-value" });
    const after = await db.outboxMessage.findUniqueOrThrow({ where: { id: msg.id } });
    expect(after).toMatchObject({ status: "SENT", providerMessageId: `wamid.${tag}`, template: null });
    expect(after.body).not.toContain("secret-token-value");
  });

  it("moves delivery status forward only", async () => {
    const status = (s: string, errors?: { code: number }[]) => ({ entry: [{ changes: [{ value: { statuses: [{ id: `wamid.${tag}`, status: s, errors }] } }] }] });
    await handleWhatsAppWebhook(db, status("delivered"));
    await handleWhatsAppWebhook(db, status("sent"));
    expect(await db.outboxMessage.findFirst({ where: { providerMessageId: `wamid.${tag}` } })).toMatchObject({ status: "DELIVERED" });
    await handleWhatsAppWebhook(db, status("failed", [{ code: 131026 }]));
    expect(await db.outboxMessage.findFirst({ where: { providerMessageId: `wamid.${tag}` } })).toMatchObject({ status: "DELIVERED" });
  });

  it("opts a client out of WhatsApp at every business when they reply STOP", async () => {
    for (const o of orgs) {
      await db.customer.create({
        data: {
          locationId: o.locationId,
          name: "Stop Sam",
          phone,
          consents: { create: [{ channel: "WHATSAPP", status: "GRANTED", source: "test" }, { channel: "SMS", status: "GRANTED", source: "test" }] },
        },
      });
    }
    const reply = (text: string) => ({ entry: [{ changes: [{ value: { messages: [{ from: phone.replace(/\D/g, ""), type: "text", text: { body: text } }] } }] }] });
    expect(await handleWhatsAppWebhook(db, reply("thanks!"))).toEqual({ statuses: 0, optOuts: 0 });
    expect(await handleWhatsAppWebhook(db, reply("Stop"))).toEqual({ statuses: 0, optOuts: 2 });

    const consents = await db.channelConsent.findMany({ where: { customer: { phone } }, select: { channel: true, status: true, source: true } });
    expect(consents.filter((c) => c.channel === "WHATSAPP")).toEqual([
      { channel: "WHATSAPP", status: "REVOKED", source: "whatsapp_stop_reply" },
      { channel: "WHATSAPP", status: "REVOKED", source: "whatsapp_stop_reply" },
    ]);
    expect(consents.filter((c) => c.channel === "SMS").every((c) => c.status === "GRANTED")).toBe(true);
    expect(await db.auditEvent.count({ where: { action: "consent.revoked", organizationId: { in: orgs.map((o) => o.organizationId) } } })).toBe(2);
  });
});
