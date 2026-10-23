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
    `To change it, please contact ${i.businessName} directly.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * A WhatsApp template call: the approved template's name, its body variables in order, and the
 * dynamic end of its URL button. The wording lives in Meta (see docs/WHATSAPP_SETUP.md) and must
 * match `offerMessage` / `confirmationMessage` above.
 */
export type TemplateRef = { name: string; body: string[]; urlSuffix?: string };

export const WHATSAPP_TEMPLATES = { offer: "slot_opening", confirmation: "slot_booked" } as const;

/** WhatsApp rejects variables with line breaks, tabs or long runs of spaces. */
const param = (v: string) => v.replace(/\s+/g, " ").trim().slice(0, 200);

export function offerTemplate(i: Omit<OfferTemplateInput, "link"> & { token: string }): TemplateRef {
  return {
    name: WHATSAPP_TEMPLATES.offer,
    body: [
      i.customerName.split(" ")[0],
      i.businessName,
      `${i.serviceName} with ${i.staffName}`,
      `${formatDate(i.startAt, i.timezone)} at ${formatTime(i.startAt, i.timezone)}`,
      formatTime(i.expiresAt, i.timezone),
    ].map(param),
    urlSuffix: i.token,
  };
}

export function confirmationTemplate(i: Omit<OfferTemplateInput, "expiresAt" | "link"> & { address: string | null }): TemplateRef {
  return {
    name: WHATSAPP_TEMPLATES.confirmation,
    body: [
      i.customerName.split(" ")[0],
      `${i.serviceName} with ${i.staffName}`,
      i.businessName,
      `${formatDate(i.startAt, i.timezone)} at ${formatTime(i.startAt, i.timezone)}`,
      i.address ?? "See the business for directions",
    ].map(param),
  };
}

/** Replaces a claim link in a sent message so the token is not kept at rest. */
export function redactLinks(body: string): string {
  return body.replace(/https?:\/\/\S+\/c\/[A-Za-z0-9_-]+/g, "[claim link]");
}
