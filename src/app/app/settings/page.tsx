import type { Metadata } from "next";
import { Suspense } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "qrcode";
import { requireMember } from "@/server/auth/dal";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { BookingSettingsForm } from "./booking-settings-form";
import { resetDemo } from "@/server/actions/demo";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Workspace details and personal preferences." />
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription className="mt-1">System follows your device. Your choice is remembered on this device.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Suspense fallback={<Skeleton className="h-72" />}>
          <BookingSettings />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-40" />}>
          <Workspace />
        </Suspense>
      </div>
    </>
  );
}

async function BookingSettings() {
  const member = await requireMember();
  const location = await db.location.findUniqueOrThrow({
    where: { id: member.location.id },
    select: { bookingEnabled: true, bookingSlug: true, reminderOffsetsMinutes: true, quietHoursStart: true, quietHoursEnd: true },
  });
  const appUrl = env().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const canEdit = member.role === "OWNER" || member.role === "ADMIN";
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
        {canEdit ? (
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

async function Workspace() {
  const member = await requireMember();
  const rows = [
    ["Business", member.organization.name],
    ["Location", member.location.name],
    ["Timezone", member.location.timezone],
    ["Currency", member.location.currency],
    ["Your role", member.role.toLowerCase()],
  ];
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      {member.organization.isDemo && member.role === "OWNER" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Reset demo</CardTitle>
              <CardDescription className="mt-1">
                Restore the demo salon and clinic to a fresh week of bookings, reminders and waitlist, timed from now.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form action={resetDemo}>
              <Button type="submit" variant="secondary">
                <RotateCcw /> Reset demo data
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
