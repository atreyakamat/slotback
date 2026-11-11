"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { REMINDER_OFFSET_CHOICES } from "@/lib/reminders";
import { cancelAppointment, confirmAppointment } from "../appointments/core";
import { requireMember, requireRole, toActor } from "../auth/dal";
import { db } from "../db";
import { changeAppointmentStatus } from "../domain/appointments";
import { DomainError } from "../domain/errors";
import { processOutbox } from "../messaging/outbox";

const idSchema = z.string().min(1).max(64);

/** Staff action on one appointment. Ids come from the form; the location always comes from the session. */
async function withAppointment(formData: FormData) {
  const member = await requireMember();
  const id = idSchema.parse(formData.get("appointmentId"));
  return { member, ref: { id, locationId: member.location.id }, actor: { type: "USER" as const, id: member.user.id } };
}

export async function staffConfirm(formData: FormData) {
  const { ref, actor } = await withAppointment(formData);
  await confirmAppointment(db, ref, actor, new Date());
  refresh();
}

/** Cancels, withdraws queued reminders and drafts a refill campaign when there is still time. */
export async function staffCancel(formData: FormData) {
  const { ref, actor } = await withAppointment(formData);
  await cancelAppointment(db, ref, actor, new Date(), "Cancelled by staff");
  refresh();
}

async function recordOutcome(formData: FormData, to: "COMPLETED" | "NO_SHOW") {
  const { member, ref } = await withAppointment(formData);
  try {
    await changeAppointmentStatus(db, toActor(member), { appointmentId: ref.id, to });
  } catch (err) {
    // Someone else already recorded it, or it was cancelled: the refreshed board shows the truth.
    if (!(err instanceof DomainError)) throw err;
  }
  refresh();
}

export async function staffMarkCompleted(formData: FormData) {
  await recordOutcome(formData, "COMPLETED");
}

export async function staffMarkNoShow(formData: FormData) {
  await recordOutcome(formData, "NO_SHOW");
}

/** Delivers this location's due messages now, through the same pipeline as the scheduled job. */
export async function deliverNow() {
  const member = await requireRole("OWNER", "ADMIN");
  const report = await processOutbox(db, new Date(), 200, { locationId: member.location.id });
  redirect(`/app/reminders/messages?sent=${report.sent}&skipped=${report.skipped + report.deferred + report.retrying + report.failed}`);
}

const settingsSchema = z.object({
  bookingEnabled: z.literal("on").optional(),
  bookingSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens")
    .min(3)
    .max(48),
  reminderOffsets: z.array(z.coerce.number().pipe(z.union(REMINDER_OFFSET_CHOICES.map((n) => z.literal(n))))).max(3),
});

export type BookingSettingsState = { error?: string; saved?: boolean };

export async function updateBookingSettings(_prev: BookingSettingsState, formData: FormData): Promise<BookingSettingsState> {
  const member = await requireRole("OWNER", "ADMIN");
  const parsed = settingsSchema.safeParse({
    bookingEnabled: formData.get("bookingEnabled") ?? undefined,
    bookingSlug: formData.get("bookingSlug"),
    reminderOffsets: formData.getAll("reminderOffsets"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.path[0] === "reminderOffsets" ? "Choose up to three reminder times." : `Booking link: ${first?.message}` };
  }
  const taken = await db.location.findFirst({
    where: { bookingSlug: parsed.data.bookingSlug, id: { not: member.location.id } },
    select: { id: true },
  });
  if (taken) return { error: "That booking link is already taken. Try adding your area, e.g. -panaji." };

  await db.$transaction([
    db.location.update({
      where: { id: member.location.id },
      data: {
        bookingEnabled: parsed.data.bookingEnabled === "on",
        bookingSlug: parsed.data.bookingSlug,
        reminderOffsetsMinutes: [...parsed.data.reminderOffsets].sort((a, b) => b - a),
      },
    }),
    db.auditEvent.create({
      data: {
        organizationId: member.organization.id,
        actorType: "USER",
        actorId: member.user.id,
        entityType: "location",
        entityId: member.location.id,
        action: "location.booking_settings_updated",
        metadata: { bookingEnabled: parsed.data.bookingEnabled === "on", reminderOffsets: parsed.data.reminderOffsets },
      },
    }),
  ]);
  refresh();
  return { saved: true };
}
