"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { parseHm, zonedToUtc } from "@/lib/time";
import { requireMember, toActor } from "../auth/dal";
import { db } from "../db";
import { changeAppointmentStatus, createAppointment, rescheduleAppointment } from "../domain/appointments";
import { createCustomer, normalizeIndianPhone } from "../domain/customers";
import { fromError, fromZod, type ActionState } from "./result";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const hm = z.string().regex(/^\d{2}:\d{2}$/, "Pick a time");

const createSchema = z
  .object({
    customerMode: z.enum(["existing", "new", "walkin"]),
    customerId: z.string().optional(),
    newName: z.string().trim().optional(),
    newPhone: z.string().trim().optional(),
    serviceId: z.string().min(1, "Choose a service"),
    resourceId: z.string().min(1, "Choose a staff member"),
    date: dateKey,
    time: hm,
  })
  .superRefine((v, ctx) => {
    if (v.customerMode === "existing" && !v.customerId) {
      ctx.addIssue({ code: "custom", path: ["customerId"], message: "Choose a customer" });
    }
    if (v.customerMode === "new") {
      if (!v.newName) ctx.addIssue({ code: "custom", path: ["newName"], message: "Enter a name" });
      if (!v.newPhone || !normalizeIndianPhone(v.newPhone)) {
        ctx.addIssue({ code: "custom", path: ["newPhone"], message: "Enter a 10-digit Indian mobile number" });
      }
    }
  });

export async function createAppointmentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const parsed = createSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const actor = toActor(member);

  try {
    await db.$transaction(async (tx) => {
      let customerId: string | null = null;
      if (v.customerMode === "existing") customerId = v.customerId!;
      if (v.customerMode === "new") {
        const customer = await createCustomer(tx, actor, {
          name: v.newName!,
          phone: normalizeIndianPhone(v.newPhone!),
          email: null,
          preferredChannel: "WHATSAPP",
          consentChannels: [],
          consentSource: "front desk",
        });
        customerId = customer.id;
      }
      await createAppointment(tx, actor, {
        customerId,
        serviceId: v.serviceId,
        resourceId: v.resourceId,
        startAt: zonedToUtc(v.date, parseHm(v.time), actor.timezone),
      });
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Appointment booked." };
}

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  resourceId: z.string().min(1, "Choose a staff member"),
  date: dateKey,
  time: hm,
});

export async function rescheduleAppointmentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const parsed = rescheduleSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  const actor = toActor(member);
  try {
    await rescheduleAppointment(db, actor, {
      appointmentId: parsed.data.appointmentId,
      resourceId: parsed.data.resourceId,
      startAt: zonedToUtc(parsed.data.date, parseHm(parsed.data.time), actor.timezone),
    });
  } catch (err) {
    return fromError(err);
  }
  refresh();
  return { ok: true, message: "Appointment moved." };
}

const statusSchema = z.object({
  appointmentId: z.string().min(1),
  to: z.enum(["CANCELLED", "COMPLETED", "NO_SHOW"]),
  reason: z.string().trim().max(200).optional(),
});

export async function changeStatusAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const member = await requireMember();
  const parsed = statusSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await changeAppointmentStatus(db, toActor(member), parsed.data);
  } catch (err) {
    return fromError(err);
  }
  refresh();
  const labels = { CANCELLED: "Appointment cancelled.", COMPLETED: "Marked as completed.", NO_SHOW: "Marked as no-show." };
  return { ok: true, message: labels[parsed.data.to] };
}
