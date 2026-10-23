"use server";

import { refresh } from "next/cache";
import QRCode from "qrcode";
import { requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { createPairing, revokeDevice } from "../domain/devices";
import { env } from "../env";
import { fromError, type ActionState } from "./result";

export type PairingState = ActionState & { svg?: string; expiresAt?: string };

/** What the app's scanner reads: where the API is, and the one-time code. */
function pairingPayload(code: string) {
  return `slotback://pair?api=${encodeURIComponent(env().NEXT_PUBLIC_APP_URL)}&code=${code}`;
}

export async function createPairingAction(): Promise<PairingState> {
  const member = await requireMember();
  const { code, expiresAt } = await createPairing(db, toActor(member));
  const svg = await QRCode.toString(pairingPayload(code), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#07140f", light: "#ffffff" },
  });
  return { ok: true, svg, expiresAt: expiresAt.toISOString() };
}

export async function revokeDeviceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  try {
    await revokeDevice(db, { userId: member.user.id, organizationId: member.organization.id }, String(form.get("id")));
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "That phone is signed out." };
}
