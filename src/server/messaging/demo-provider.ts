import { createHash } from "node:crypto";
import type { MessageProvider, OutgoingMessage, SendResult } from "./provider";

/**
 * Simulated provider. Nothing leaves the system: messages are "delivered" instantly and
 * shown in the in-app demo inbox. Used for the demo workspace and local development.
 */
export const demoProvider: MessageProvider = {
  name: "demo",
  keepsBodies: true,
  async send(message: OutgoingMessage): Promise<SendResult> {
    const id = createHash("sha256").update(message.idempotencyKey).digest("hex").slice(0, 24);
    return { providerMessageId: `demo_${id}`, delivered: true };
  },
};
