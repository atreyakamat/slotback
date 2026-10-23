"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { rupeesToPaise } from "@/lib/money";
import { canManage, requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import {
  saveResource,
  saveService,
  setResourceActive,
  setServiceActive,
  updateLocationSettings,
  type BusinessHours,
} from "../domain/catalogue";
import { DomainError } from "../domain/errors";
import { fromError, fromZod, type ActionState } from "./result";

async function requireManager() {
  const member = await requireMember();
  if (!canManage(member)) throw new DomainError("forbidden", "Only owners and admins can change settings.");
  return member;
}

const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm");

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a service name").max(80),
  durationMinutes: z.coerce.number().int().min(5, "At least 5 minutes").max(600, "At most 10 hours"),
  priceRupees: z.coerce.number().min(0, "Can't be negative").max(1_000_000),
});

export async function saveServiceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireManager();
    const parsed = serviceSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fromZod(parsed.error);
    await saveService(db, toActor(member), {
      id: parsed.data.id || undefined,
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      pricePaise: rupeesToPaise(parsed.data.priceRupees),
      resourceIds: form.getAll("resourceIds").map(String),
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Service saved." };
}

export async function toggleServiceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireManager();
    await setServiceActive(db, toActor(member), String(form.get("id")), form.get("active") === "true");
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true };
}

const resourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a name").max(80),
});

export async function saveResourceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireManager();
    const parsed = resourceSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fromZod(parsed.error);
    await saveResource(db, toActor(member), {
      id: parsed.data.id || undefined,
      name: parsed.data.name,
      serviceIds: form.getAll("serviceIds").map(String),
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Staff member saved." };
}

export async function toggleResourceAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireManager();
    await setResourceActive(db, toActor(member), String(form.get("id")), form.get("active") === "true");
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true };
}

const locationSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a location name").max(80),
    address: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(30).optional(),
    minLeadMinutes: z.coerce.number().int().min(0).max(24 * 60),
    offerTtlMinutes: z.coerce.number().int().min(5, "At least 5 minutes").max(24 * 60),
    offerBatchSize: z.coerce.number().int().min(1).max(50),
    quietHoursStart: hm,
    quietHoursEnd: hm,
  })
  .strip();

export async function updateLocationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const member = await requireManager();
    const parsed = locationSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fromZod(parsed.error);

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

    await updateLocationSettings(db, toActor(member), {
      ...parsed.data,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      businessHours: hours,
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Settings saved." };
}
