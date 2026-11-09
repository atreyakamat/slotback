"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import {
  bookOnline,
  cancelAppointment,
  confirmAppointment,
  hashToken,
  stopWhatsAppReminders,
} from "../appointments/core";
import { db } from "../db";
import { env } from "../env";

export type BookingFormState = { error?: string; fields?: { name: string; phone: string } };

const bookingSchema = z.object({
  slug: z.string().min(1).max(64),
  serviceId: z.string().min(1).max(64),
  startAt: z.iso.datetime(),
  name: z.string().max(200),
  phone: z.string().max(32),
  whatsappConsent: z.literal("on").optional(),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
});

const ERRORS: Record<string, string> = {
  "not-found": "This booking link is no longer available.",
  "invalid-phone": "Enter a 10-digit Indian mobile number.",
  "invalid-name": "Enter your name.",
  "slot-unavailable": "Sorry, that time was just taken. Please pick another.",
  "too-many-bookings": "You already have several upcoming bookings here. Please call the clinic to book more.",
};

/** Public booking form submit. Redirects to the patient's manage page on success. */
export async function submitBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  const fields = { name: String(formData.get("name") ?? ""), phone: String(formData.get("phone") ?? "") };
  if (!parsed.success) return { error: "Please check your details and try again.", fields };

  const result = await bookOnline(
    db,
    {
      slug: parsed.data.slug,
      serviceId: parsed.data.serviceId,
      startAt: new Date(parsed.data.startAt),
      name: parsed.data.name,
      phone: parsed.data.phone,
      whatsappConsent: parsed.data.whatsappConsent === "on",
    },
    { now: new Date(), baseUrl: env().NEXT_PUBLIC_APP_URL },
  );
  if (!result.ok) return { error: ERRORS[result.error], fields };
  redirect(`/a/${result.token}?booked=1`);
}

const tokenSchema = z.string().min(20).max(64).regex(/^[A-Za-z0-9_-]+$/);

function tokenFrom(formData: FormData): string {
  const parsed = tokenSchema.safeParse(formData.get("token"));
  if (!parsed.success) redirect("/");
  return parsed.data;
}

export async function confirmByToken(formData: FormData) {
  const token = tokenFrom(formData);
  const tokenHash = hashToken(token);
  const appt = await db.appointment.findUnique({ where: { manageTokenHash: tokenHash }, select: { customerId: true } });
  await confirmAppointment(db, { tokenHash }, { type: "CUSTOMER", id: appt?.customerId ?? null }, new Date());
  refresh();
}

export async function cancelByToken(formData: FormData) {
  const token = tokenFrom(formData);
  const tokenHash = hashToken(token);
  const reason = z.string().max(200).optional().catch(undefined).parse(formData.get("reason") ?? undefined);
  const appt = await db.appointment.findUnique({ where: { manageTokenHash: tokenHash }, select: { customerId: true } });
  await cancelAppointment(db, { tokenHash }, { type: "CUSTOMER", id: appt?.customerId ?? null }, new Date(), reason || null);
  redirect(`/a/${token}`);
}

export async function stopRemindersByToken(formData: FormData) {
  const token = tokenFrom(formData);
  await stopWhatsAppReminders(db, hashToken(token), new Date());
  redirect(`/a/${token}?stopped=1`);
}
