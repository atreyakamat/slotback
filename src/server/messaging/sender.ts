/**
 * Outbound message providers. Only the mock provider exists today: it records the message
 * as sent without contacting anyone, so the full reminder flow can be demoed and tested
 * without a paid WhatsApp Business account.
 *
 * A real provider (Meta Cloud API, Gupshup, Interakt, …) implements the same interface.
 * WhatsApp requires pre-approved templates for business-initiated messages, so a real
 * adapter will map `purpose` to a template name and pass the variables, not free text.
 */
import type { Channel, MessagePurpose } from "@/generated/prisma/enums";

export type OutgoingMessage = {
  id: string;
  channel: Channel;
  purpose: MessagePurpose;
  to: string;
  body: string;
  idempotencyKey: string;
};

export type SendResult = { providerMessageId: string };

export class SendError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code);
  }
}

export interface MessageSender {
  readonly name: string;
  send(message: OutgoingMessage): Promise<SendResult>;
}

/** Accepts every message and returns a deterministic provider id. Never contacts anyone. */
export const mockWhatsAppSender: MessageSender = {
  name: "mock-whatsapp",
  async send(message) {
    return { providerMessageId: `mock_${message.idempotencyKey}` };
  },
};

export function senderFor(provider: string | undefined): MessageSender {
  switch (provider ?? "mock") {
    case "mock":
      return mockWhatsAppSender;
    default:
      throw new Error(`Unknown WHATSAPP_PROVIDER "${provider}". Only "mock" is available.`);
  }
}
