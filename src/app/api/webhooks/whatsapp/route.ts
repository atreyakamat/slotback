import { timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { verifyWebhookSignature } from "@/server/messaging/whatsapp-cloud";
import { handleWhatsAppWebhook, type WhatsAppWebhook } from "@/server/messaging/whatsapp-webhook";

/** Meta's one-time check when the webhook URL is saved in the app dashboard. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const expected = env().WHATSAPP_VERIFY_TOKEN;
  const given = params.get("hub.verify_token") ?? "";
  const ok =
    params.get("hub.mode") === "subscribe" &&
    !!expected &&
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new Response("forbidden", { status: 403 });
  return new Response(params.get("hub.challenge") ?? "", { status: 200 });
}

/** Delivery receipts and replies. Signed by Meta with the app secret; unsigned calls are refused. */
export async function POST(request: Request) {
  const secret = env().WHATSAPP_APP_SECRET;
  const raw = await request.text();
  if (!secret || !verifyWebhookSignature(raw, request.headers.get("x-hub-signature-256"), secret)) {
    return new Response("forbidden", { status: 403 });
  }
  let payload: WhatsAppWebhook;
  try {
    payload = JSON.parse(raw) as WhatsAppWebhook;
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const result = await handleWhatsAppWebhook(db, payload);
  return Response.json(result);
}
