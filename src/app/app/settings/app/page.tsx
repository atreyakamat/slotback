import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/app/skeleton";
import { PhoneApp } from "@/components/settings/phone-app";
import { requireMember, toActor } from "@/server/auth/dal";
import { db } from "@/server/db";
import { listDevices } from "@/server/domain/devices";

export const metadata: Metadata = { title: "Phone app" };

export default function PhoneAppPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Devices />
    </Suspense>
  );
}

async function Devices() {
  const member = await requireMember();
  const devices = await listDevices(db, toActor(member));
  return <PhoneApp devices={devices} timezone={member.location.timezone} />;
}
