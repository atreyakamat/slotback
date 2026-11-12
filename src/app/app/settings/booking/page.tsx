import type { Metadata } from "next";
import { Suspense } from "react";
import QRCode from "qrcode";
import { Skeleton } from "@/components/app/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage, requireMember } from "@/server/auth/dal";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { BookingSettingsForm } from "./booking-settings-form";

export const metadata: Metadata = { title: "Booking & reminders" };

export default function BookingSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72" />}>
      <BookingSettings />
    </Suspense>
  );
}

async function BookingSettings() {
  const member = await requireMember();
  const location = await db.location.findUniqueOrThrow({
    where: { id: member.location.id },
    select: { bookingEnabled: true, bookingSlug: true, reminderOffsetsMinutes: true, quietHoursStart: true, quietHoursEnd: true },
  });
  const appUrl = env().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const suggestedSlug =
    location.bookingSlug ??
    member.location.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
  const link = location.bookingSlug ? `${appUrl}/book/${location.bookingSlug}` : null;
  const qr = link && location.bookingEnabled ? await QRCode.toString(link, { type: "svg", margin: 1 }) : null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Online booking and reminders</CardTitle>
          <CardDescription className="mt-1">
            Patients book from your link and get WhatsApp reminders with one-tap confirm or cancel. Quiet hours:{" "}
            {location.quietHoursStart}–{location.quietHoursEnd}.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1fr_auto]">
        {canManage(member) ? (
          <BookingSettingsForm
            appUrl={appUrl}
            bookingEnabled={location.bookingEnabled}
            bookingSlug={suggestedSlug}
            reminderOffsets={location.reminderOffsetsMinutes}
          />
        ) : (
          <p className="text-sm text-muted">Only owners and admins can change booking settings.</p>
        )}
        {qr && link ? (
          <figure className="flex flex-col items-center gap-2 text-center">
            <div
              className="size-36 rounded-lg border bg-white p-1.5 [&_svg]:size-full"
              role="img"
              aria-label="QR code for your booking link"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <figcaption className="max-w-40 text-xs text-muted">
              Print for reception.{" "}
              <a href={link} target="_blank" rel="noreferrer" className="text-accent">
                Open booking page
              </a>
            </figcaption>
          </figure>
        ) : null}
      </CardContent>
    </Card>
  );
}
