import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/app/skeleton";
import { ServicesManager } from "@/components/settings/services-manager";
import { canManage, requireMember } from "@/server/auth/dal";
import { getSettingsData } from "@/server/queries/schedule";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Services />
    </Suspense>
  );
}

async function Services() {
  const member = await requireMember();
  const { services, resources } = await getSettingsData(member);
  return (
    <ServicesManager
      canEdit={canManage(member)}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        pricePaise: s.pricePaise,
        active: s.active,
        resourceIds: s.resources.map((r) => r.id),
      }))}
      resources={resources.map((r) => ({ id: r.id, name: r.name, active: r.active }))}
    />
  );
}
