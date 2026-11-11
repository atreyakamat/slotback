import type { CampaignStatus, Channel, OfferStatus } from "@/generated/prisma/enums";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Ready to launch", tone: "neutral" },
  ACTIVE: { label: "Offering", tone: "accent" },
  CLAIMED: { label: "Refilled", tone: "success" },
  EXPIRED: { label: "Expired", tone: "warning" },
  CANCELLED: { label: "Stopped", tone: "neutral" },
};

export const OFFER_STATUS: Record<OfferStatus, { label: string; tone: Tone }> = {
  QUEUED: { label: "Queued", tone: "neutral" },
  SENT: { label: "Sent", tone: "accent" },
  DELIVERED: { label: "Delivered", tone: "accent" },
  OPENED: { label: "Opened", tone: "warning" },
  CLAIMED: { label: "Claimed", tone: "success" },
  LOST: { label: "Too late", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  FAILED: { label: "Failed", tone: "danger" },
  SUPPRESSED: { label: "Opted out", tone: "neutral" },
};

export const CHANNEL_LABEL: Record<Channel, string> = { WHATSAPP: "WhatsApp", SMS: "SMS", EMAIL: "Email" };
