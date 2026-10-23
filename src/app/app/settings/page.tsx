import type { Metadata } from "next";
import { Suspense } from "react";
import { RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/app/skeleton";
import { LocationForm } from "@/components/settings/location-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage, requireMember } from "@/server/auth/dal";
import { resetDemo } from "@/server/actions/demo";
import { getSettingsData } from "@/server/queries/schedule";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
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
      <Suspense fallback={<Skeleton className="h-96" />}>
        <General />
      </Suspense>
    </div>
  );
}

async function General() {
  const member = await requireMember();
  const { location } = await getSettingsData(member);
  return (
    <>
      <LocationForm
        disabled={!canManage(member)}
        location={{
          name: location.name,
          address: location.address,
          phone: location.phone,
          businessHours: location.businessHours as Record<string, { open: string; close: string }[]>,
          minLeadMinutes: location.minLeadMinutes,
          offerTtlMinutes: location.offerTtlMinutes,
          offerBatchSize: location.offerBatchSize,
          quietHoursStart: location.quietHoursStart,
          quietHoursEnd: location.quietHoursEnd,
          autoNextRound: location.autoNextRound,
          maxRounds: location.maxRounds,
        }}
      />
      {member.organization.isDemo && member.role === "OWNER" ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Reset demo</CardTitle>
              <CardDescription className="mt-1">
                Restore the fictional salon to a fresh week of bookings and waitlist, timed from now.
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
