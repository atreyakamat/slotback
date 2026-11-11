import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { OutgoingMessage } from "@/server/messaging/provider";
import { offerTemplate } from "@/server/messaging/templates";
import { toWhatsAppNumber, verifyWebhookSignature, whatsAppCloudProvider, whatsAppConfigFrom } from "@/server/messaging/whatsapp-cloud";

const template = offerTemplate({
  customerName: "Asha Naik",
  businessName: "Casa Verde\nSalon",
  serviceName: "Haircut",
  staffName: "Riya",
  startAt: new Date("2026-10-24T09:30:00Z"),
  expiresAt: new Date("2026-10-24T08:00:00Z"),
  timezone: "Asia/Kolkata",
  token: "tok_abc",
});

const message: OutgoingMessage = { channel: "WHATSAPP", to: "+91 98765 43210", body: "plain", template, idempotencyKey: "offer:1" };

function fakeFetch(status: number, json: unknown, calls: { url: string; init: RequestInit }[] = []) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(json), { status });
  }) as unknown as typeof fetch;
}

const config = { accessToken: "token-token-token-token", phoneNumberId: "1234567890", language: "en" };

describe("WhatsApp Cloud API provider", () => {
  it("sends the approved template with the claim token in the URL button", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const provider = whatsAppCloudProvider({ ...config, fetch: fakeFetch(200, { messages: [{ id: "wamid.1" }] }, calls) });
    expect(await provider.send(message)).toEqual({ providerMessageId: "wamid.1", delivered: false });

    expect(calls[0].url).toBe("https://graph.facebook.com/v21.0/1234567890/messages");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer token-token-token-token");
    const body = JSON.parse(String(calls[0].init.body));
    expect(body).toMatchObject({ to: "919876543210", type: "template", template: { name: "slot_opening", language: { code: "en" } } });
    expect(body.template.components[0].parameters.map((p: { text: string }) => p.text)).toEqual([
      "Asha",
      "Casa Verde Salon",
      "Haircut with Riya",
      "Sat, 24 Oct at 3:00 pm",
      "1:30 pm",
    ]);
    expect(body.template.components[1]).toEqual({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "tok_abc" }] });
  });

  it("retries rate limits and outages, but not rejected templates", async () => {
    const limited = whatsAppCloudProvider({ ...config, fetch: fakeFetch(429, { error: { code: 130429, message: "Rate limit" } }) });
    await expect(limited.send(message)).rejects.toMatchObject({ code: "meta_130429", retryable: true });

    const rejected = whatsAppCloudProvider({ ...config, fetch: fakeFetch(400, { error: { code: 132001, message: "Template does not exist" } }) });
    await expect(rejected.send(message)).rejects.toMatchObject({ code: "meta_132001", retryable: false });

    const offline = whatsAppCloudProvider({ ...config, fetch: (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch });
    await expect(offline.send(message)).rejects.toMatchObject({ code: "network", retryable: true });
  });

  it("refuses SMS and messages without a template", async () => {
    const provider = whatsAppCloudProvider({ ...config, fetch: fakeFetch(200, {}) });
    await expect(provider.send({ ...message, channel: "SMS" })).rejects.toMatchObject({ code: "channel_unsupported", retryable: false });
    await expect(provider.send({ ...message, template: null })).rejects.toMatchObject({ code: "template_missing", retryable: false });
  });

  it("reads its settings only when both required keys are set", () => {
    expect(whatsAppConfigFrom({ WHATSAPP_ACCESS_TOKEN: "x" })).toBeNull();
    expect(whatsAppConfigFrom({ WHATSAPP_ACCESS_TOKEN: "x", WHATSAPP_PHONE_NUMBER_ID: "1" })).toMatchObject({ language: "en" });
    expect(toWhatsAppNumber("+91 98765 43210")).toBe("919876543210");
  });

  it("accepts only webhook calls signed with the app secret", () => {
    const raw = JSON.stringify({ entry: [] });
    const sig = `sha256=${createHmac("sha256", "app-secret-app-secret").update(raw).digest("hex")}`;
    expect(verifyWebhookSignature(raw, sig, "app-secret-app-secret")).toBe(true);
    expect(verifyWebhookSignature(raw + " ", sig, "app-secret-app-secret")).toBe(false);
    expect(verifyWebhookSignature(raw, sig, "another-secret-value")).toBe(false);
    expect(verifyWebhookSignature(raw, null, "app-secret-app-secret")).toBe(false);
  });
});
