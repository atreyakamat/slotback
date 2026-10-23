import { formatDate, formatTime } from "@/lib/time";

export type OfferTemplateInput = {
  customerName: string;
  businessName: string;
  serviceName: string;
  staffName: string;
  startAt: Date;
  expiresAt: Date;
  timezone: string;
  link: string;
};

/** Customer-facing offer. Short, plain and with a clear opt-out, per WhatsApp/SMS template norms. */
export function offerMessage(i: OfferTemplateInput): string {
  const first = i.customerName.split(" ")[0];
  return [
    `Hi ${first}, an opening just came up at ${i.businessName}:`,
    `${i.serviceName} with ${i.staffName}, ${formatDate(i.startAt, i.timezone)} at ${formatTime(i.startAt, i.timezone)}.`,
    `Tap to claim it before ${formatTime(i.expiresAt, i.timezone)}: ${i.link}`,
    `First to confirm gets it. Reply STOP to opt out.`,
  ].join("\n");
}

export function confirmationMessage(i: Omit<OfferTemplateInput, "expiresAt" | "link"> & { address: string | null }): string {
  const first = i.customerName.split(" ")[0];
  return [
    `You're booked, ${first}! ${i.serviceName} with ${i.staffName} at ${i.businessName},`,
    `${formatDate(i.startAt, i.timezone)} at ${formatTime(i.startAt, i.timezone)}.`,
    i.address ? `Address: ${i.address}.` : null,
    `Need to change it? Just reply to this message.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Replaces a claim link in a sent message so the token is not kept at rest. */
export function redactLinks(body: string): string {
  return body.replace(/https?:\/\/\S+\/c\/[A-Za-z0-9_-]+/g, "[claim link]");
}
