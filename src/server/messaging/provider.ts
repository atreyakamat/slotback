import type { Channel } from "@/generated/prisma/client";

export type OutgoingMessage = { channel: Channel; to: string; body: string; idempotencyKey: string };

export type SendResult = { providerMessageId: string; delivered: boolean };

/** Thrown by providers. `retryable` failures are retried with backoff; others fail immediately. */
export class ProviderError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ProviderError";
  }
}

/**
 * Every customer channel goes through this interface, so a WhatsApp, SMS or email
 * provider can be added without touching the recovery flow.
 */
export interface MessageProvider {
  readonly name: string;
  /** Whether message bodies must be kept after sending (only the simulated demo inbox needs them). */
  readonly keepsBodies: boolean;
  send(message: OutgoingMessage): Promise<SendResult>;
}
