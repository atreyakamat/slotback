import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/app/skeleton";
import { TeamManager } from "@/components/settings/team-manager";
import { requireMember, toActor } from "@/server/auth/dal";
import { db } from "@/server/db";
import { assignableRoles, listTeam } from "@/server/domain/team";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Team />
    </Suspense>
  );
}

async function Team() {
  const member = await requireMember();
  const { members, invites } = await listTeam(db, toActor(member));
  return (
    <TeamManager
      members={members}
      invites={invites}
      me={member.user.id}
      assignable={member.organization.isDemo ? [] : assignableRoles(member.role)}
      timezone={member.location.timezone}
    />
  );
}
