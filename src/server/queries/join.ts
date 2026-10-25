import "server-only";
import QRCode from "qrcode";
import type { Member } from "../auth/dal";
import { toActor } from "../auth/dal";
import { db } from "../db";
import { ensureJoinCode } from "../domain/waitlist-growth";
import { env } from "../env";

/** The public join link for the member's location and its QR code as SVG markup. */
export async function getJoinLink(member: Member) {
  const code = await ensureJoinCode(db, toActor(member));
  const url = new URL(`/join/${code}`, env().NEXT_PUBLIC_APP_URL).toString();
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#07140f", light: "#ffffff" } });
  return { url, svg };
}
