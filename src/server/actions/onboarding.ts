"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { rupeesToPaise } from "@/lib/money";
import { canManage, requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import type { BusinessHours } from "../domain/catalogue";
import { DomainError } from "../domain/errors";
import { addStarterServices, addStarterStaff, finishOnboarding, setBusinessHours } from "../domain/onboarding";
import { fromError, fromZod, type ActionState } from "./result";

const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

async function requireOwner() {
  const member = await requireMember();
  if (!canManage(member)) throw new DomainError("forbidden", "Only owners and admins can set up the business.");
  return member;
}

export async function saveHoursStepAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireOwner();
    const hours: BusinessHours = {};
    for (let d = 0; d < 7; d++) {
      if (form.get(`open-${d}`) !== "on") {
        hours[String(d)] = [];
        continue;
      }
      const open = hm.safeParse(form.get(`from-${d}`));
      const close = hm.safeParse(form.get(`to-${d}`));
      if (!open.success || !close.success) return { ok: false, message: "Check the opening hours." };
      hours[String(d)] = [{ open: open.data, close: close.data }];
    }
    await setBusinessHours(db, toActor(member), hours);
  } catch (err) {
    return fromError(err);
  }
  redirect("/onboarding?step=services");
}

const serviceRow = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  durationMinutes: z.coerce.number().int().min(5, "At least 5 minutes").max(600),
  priceRupees: z.coerce.number().min(0).max(1_000_000),
});

export async function saveServicesStepAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireOwner();
    const rows = [];
    for (let i = 0; form.has(`svc-${i}-name`); i++) {
      const name = String(form.get(`svc-${i}-name`) ?? "").trim();
      if (form.get(`svc-${i}-on`) !== "on" || !name) continue;
      const parsed = serviceRow.safeParse({ name, durationMinutes: form.get(`svc-${i}-min`), priceRupees: form.get(`svc-${i}-price`) });
      if (!parsed.success) return { ok: false, message: `Check “${name}”: ${parsed.error.issues[0].message}.` };
      rows.push({ name: parsed.data.name, durationMinutes: parsed.data.durationMinutes, pricePaise: rupeesToPaise(parsed.data.priceRupees) });
    }
    await addStarterServices(db, toActor(member), rows);
  } catch (err) {
    return fromError(err);
  }
  redirect("/onboarding?step=staff");
}

export async function saveStaffStepAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireOwner();
    const names = form.getAll("staff").map(String).map((n) => n.trim().slice(0, 80)).filter((n) => n.length >= 2);
    await addStarterStaff(db, toActor(member), names);
  } catch (err) {
    return fromError(err);
  }
  redirect("/onboarding?step=rules");
}

const rulesSchema = z.object({
  offerBatchSize: z.coerce.number().int().min(1).max(50),
  offerTtlMinutes: z.coerce.number().int().min(5, "At least 5 minutes").max(24 * 60),
  minLeadMinutes: z.coerce.number().int().min(0).max(24 * 60),
  quietHoursStart: hm,
  quietHoursEnd: hm,
});

export async function finishOnboardingAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireOwner();
    const parsed = rulesSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fromZod(parsed.error);
    await finishOnboarding(db, toActor(member), parsed.data);
  } catch (err) {
    return fromError(err);
  }
  redirect("/app?welcome=1");
}
