import type { Metadata } from "next";
import { Suspense } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMember } from "@/server/auth/dal";
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
        <Suspense fallback={<Skeleton className="h-40" />}>
          <Workspace />
        </Suspense>
      </div>
    </>
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
