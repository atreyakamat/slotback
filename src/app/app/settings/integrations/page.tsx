import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/app/skeleton";
import { IntegrationsManager } from "@/components/settings/integrations-manager";
import { canManage, requireMember, toActor } from "@/server/auth/dal";
import { db } from "@/server/db";
import { listIntegrations } from "@/server/domain/integrations";
import { env } from "@/server/env";
import { signingSecret } from "@/server/integrations/webhooks";

export const metadata: Metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Integrations />
    </Suspense>
  );
}

async function Integrations() {
  const member = await requireMember();
  const manager = canManage(member);
  const rows = await listIntegrations(db, toActor(member));
  const connections = rows.map((r) => ({
    id: r.id,
    name: r.name,
    keyPrefix: r.keyPrefix,
    webhookUrl: r.webhookUrl,
    autoRefill: r.autoRefill,
    lastUsedAt: r.lastUsedAt,
    createdAt: r.createdAt,
    bookings: r._count.appointments,
    // Staff can see connections exist, but secrets stay with owners and admins.
    signingSecret: manager ? signingSecret(r.id, env().SESSION_SECRET) : "",
    lastDelivery: r.deliveries[0] ?? null,
  }));
  return <IntegrationsManager connections={connections} apiBase={env().NEXT_PUBLIC_APP_URL} canManage={manager} timezone={member.location.timezone} />;
}
