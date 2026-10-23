"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { parseCsv } from "@/lib/csv";
import { canManage, requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { DomainError } from "../domain/errors";
import { hashIp } from "../domain/leads";
import { type ImportResult, importWaitlist, mapImportRows, rotateJoinCode, selfJoin, TIME_WINDOWS, type TimeWindow } from "../domain/waitlist-growth";
import { env } from "../env";
import { fromError, fromZod, type ActionState } from "./result";

const joinSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  phone: z.string().trim().min(10, "Enter your mobile number.").max(20),
  serviceId: z.string().max(40).optional().transform((v) => v || null),
  window: z.enum(Object.keys(TIME_WINDOWS) as [TimeWindow, ...TimeWindow[]]).default("any"),
  website: z.string().max(0).optional(),
});

async function clientIpHash() {
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? hashIp(ip, env().SESSION_SECRET) : null;
}

/** What the client typed, sent back on an error so the form keeps it after React resets it. */
export type JoinValues = { name: string; phone: string; serviceId: string; window: string; days: string[]; channels: string[] };
export type JoinState = ActionState & { values?: JoinValues };

export async function selfJoinAction(code: string, _prev: JoinState, form: FormData): Promise<JoinState> {
  const channels = (["WHATSAPP", "SMS"] as const).filter((c) => form.get(`consent-${c}`) === "on");
  const values: JoinValues = {
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    serviceId: String(form.get("serviceId") ?? ""),
    window: String(form.get("window") ?? "any"),
    days: form.getAll("days").map(String),
    channels: [...channels],
  };
  const parsed = joinSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ...fromZod(parsed.error), values };
  if (channels.length === 0) return { ok: false, message: "Tick WhatsApp or SMS so the business can tell you about openings.", values };
  if (parsed.data.website) return { ok: true, message: "You're on the list." };
  try {
    await selfJoin(
      db,
      code,
      {
        name: parsed.data.name,
        phone: parsed.data.phone,
        serviceId: parsed.data.serviceId,
        window: parsed.data.window,
        days: form.getAll("days").map(Number).filter(Number.isInteger),
        channels: [...channels],
      },
      { ipHash: await clientIpHash() },
    );
  } catch (err) {
    return { ...fromError(err), values };
  }
  return { ok: true, message: "You're on the list." };
}

/** `pasted` comes back on an error so the textarea keeps it after React resets the form. */
export type ImportState = ActionState & { result?: ImportResult; pasted?: string };

const MAX_BYTES = 1_000_000;

export async function importWaitlistAction(_prev: ImportState, form: FormData): Promise<ImportState> {
  const pasted = String(form.get("pasted") ?? "");
  try {
    const member = await requireMember();
    if (!canManage(member)) throw new DomainError("forbidden", "Only owners and admins can import clients.");
    const file = form.get("file");
    let text = pasted;
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) return { ok: false, message: "That file is over 1 MB. Split it into smaller files.", pasted };
      text = await file.text();
    }
    if (!text.trim()) return { ok: false, message: "Choose a CSV file or paste your list." };
    const rows = mapImportRows(parseCsv(text));
    const result = await importWaitlist(db, toActor(member), rows, { attested: form.get("attested") === "on" });
    refresh();
    const parts = [`${result.added} added`, result.updated ? `${result.updated} already on file` : null, result.skipped.length ? `${result.skipped.length} skipped` : null];
    return { ok: true, message: `Import finished: ${parts.filter(Boolean).join(", ")}.`, result };
  } catch (err) {
    return { ...fromError(err), pasted };
  }
}

export async function resetJoinLinkAction(): Promise<ActionState> {
  try {
    const member = await requireMember();
    if (!canManage(member)) throw new DomainError("forbidden", "Only owners and admins can reset the join link.");
    await rotateJoinCode(db, toActor(member));
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "New link created. Old QR codes no longer work." };
}
