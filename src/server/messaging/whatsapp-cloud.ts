import { createHmac, timingSafeEqual } from "node:crypto";
import { type MessageProvider, type OutgoingMessage, ProviderError, type SendResult } from "./provider";

export type WhatsAppCloudConfig = {
  accessToken: string;
  phoneNumberId: string;
  /** Template language code, as chosen when the templates were created in Meta. */
  language: string;
  apiVersion?: string;
  fetch?: typeof fetch;
};

/** Meta error codes worth retrying: rate limits and temporary outages. Everything else fails at once. */
const RETRYABLE_CODES = new Set([1, 2, 4, 17, 80007, 130429, 131000, 131016, 131048, 131056]);

/** Meta wants the number as digits with the country code: "+91 98765 43210" → "919876543210". */
export function toWhatsAppNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

/**
 * Sends through Meta's WhatsApp Cloud API. Messages a business starts must use an approved
 * template, so the provider sends `message.template` and never the free-text body.
 */
export function whatsAppCloudProvider(config: WhatsAppCloudConfig): MessageProvider {
  const doFetch = config.fetch ?? fetch;
  const url = `https://graph.facebook.com/${config.apiVersion ?? "v21.0"}/${config.phoneNumberId}/messages`;

  return {
    name: "whatsapp_cloud",
    keepsBodies: false,
    channels: ["WHATSAPP"],
    async send(message: OutgoingMessage): Promise<SendResult> {
      if (message.channel !== "WHATSAPP") throw new ProviderError("channel_unsupported", false, `WhatsApp can't send ${message.channel}`);
      const t = message.template;
      if (!t) throw new ProviderError("template_missing", false, "WhatsApp needs an approved template for this message");

      const components: unknown[] = [{ type: "body", parameters: t.body.map((text) => ({ type: "text", text })) }];
      if (t.urlSuffix) {
        components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: t.urlSuffix }] });
      }

      let res: Response;
      try {
        res = await doFetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toWhatsAppNumber(message.to),
            type: "template",
            template: { name: t.name, language: { code: config.language }, components },
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new ProviderError("network", true, "Couldn't reach WhatsApp");
      }

      const json = (await res.json().catch(() => ({}))) as {
        messages?: { id: string }[];
        error?: { code?: number; message?: string };
      };
      if (!res.ok || !json.messages?.[0]?.id) {
        const code = json.error?.code;
        const retryable = res.status >= 500 || res.status === 429 || (code !== undefined && RETRYABLE_CODES.has(code));
        throw new ProviderError(`meta_${code ?? res.status}`, retryable, json.error?.message);
      }
      return { providerMessageId: json.messages[0].id, delivered: false };
    },
  };
}

/** Reads the WhatsApp settings from the environment. Returns null when any required one is missing. */
export function whatsAppConfigFrom(e: Record<string, string | undefined>): WhatsAppCloudConfig | null {
  const accessToken = e.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = e.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId, language: e.WHATSAPP_TEMPLATE_LANGUAGE || "en" };
}

/** Checks Meta's X-Hub-Signature-256 header: an HMAC of the raw body with the app secret. */
export function verifyWebhookSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  const given = Buffer.from(header.slice(7), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
