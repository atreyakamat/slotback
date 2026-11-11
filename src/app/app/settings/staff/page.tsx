import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/app/skeleton";
import { StaffManager } from "@/components/settings/staff-manager";
import { canManage, requireMember } from "@/server/auth/dal";
import { getSettingsData } from "@/server/queries/schedule";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Staff />
    </Suspense>
  );
}

async function Staff() {
  const member = await requireMember();
  const { services, resources } = await getSettingsData(member);
  return (
    <StaffManager
      canEdit={canManage(member)}
      staff={resources.map((r) => ({ id: r.id, name: r.name, active: r.active, serviceIds: r.services.map((s) => s.id) }))}
      services={services.map((s) => ({ id: s.id, name: s.name, active: s.active }))}
    />
  );
}
