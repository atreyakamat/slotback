"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseHm } from "@/lib/time";
import { requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { normalizeIndianPhone } from "../domain/customers";
import { addToWaitlist, removeFromWaitlist, setConsent } from "../domain/waitlist";
import { fromError, fromZod, type ActionState } from "./result";

const channel = z.enum(["WHATSAPP", "SMS", "EMAIL"]);
const hm = z.string().regex(/^\d{2}:\d{2}$/);

const addSchema = z
  .object({
    customerMode: z.enum(["existing", "new"]),
    customerId: z.string().optional(),
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
    preferredChannel: channel.default("WHATSAPP"),
    serviceId: z.string().optional(),
    from: hm,
    to: hm,
    notes: z.string().trim().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.customerMode === "existing" && !v.customerId) ctx.addIssue({ code: "custom", path: ["customerId"], message: "Choose a customer" });
    if (v.customerMode === "new") {
      if (!v.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Enter a name" });
      if (v.phone && !normalizeIndianPhone(v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a 10-digit Indian mobile number" });
      if (!v.phone && !v.email) ctx.addIssue({ code: "custom", path: ["phone"], message: "Add a mobile number or email" });
    }
    if (v.from >= v.to) ctx.addIssue({ code: "custom", path: ["to"], message: "Must be after the earliest time" });
  });

export async function addWaitlistAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const parsed = addSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const consentChannels = form.getAll("consent").map(String).filter((c): c is "WHATSAPP" | "SMS" | "EMAIL" => channel.safeParse(c).success);
  try {
    await addToWaitlist(db, toActor(member), {
      customerId: v.customerMode === "existing" ? v.customerId : undefined,
      newCustomer:
        v.customerMode === "new"
          ? {
              name: v.name!,
              phone: v.phone ? normalizeIndianPhone(v.phone) : null,
              email: v.email || null,
              preferredChannel: v.preferredChannel,
              consentChannels,
              consentSource: `front desk, recorded by ${member.user.name}`,
            }
          : undefined,
      serviceId: v.serviceId || null,
      preferredDays: form.getAll("days").map(Number).filter((d) => Number.isInteger(d)),
      earliestMinute: parseHm(v.from),
      latestMinute: v.to === "23:59" ? 1440 : parseHm(v.to),
      notes: v.notes || null,
      expiresAt: null,
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Added to the waitlist." };
}

export async function removeWaitlistAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  try {
    await removeFromWaitlist(db, toActor(member), String(form.get("entryId")));
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Removed from the waitlist." };
}

const consentSchema = z.object({ customerId: z.string().min(1), channel, granted: z.enum(["true", "false"]) });

export async function setConsentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const parsed = consentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await setConsent(db, toActor(member), {
      customerId: parsed.data.customerId,
      channel: parsed.data.channel,
      granted: parsed.data.granted === "true",
      source: `updated by ${member.user.name}`,
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true };
}
