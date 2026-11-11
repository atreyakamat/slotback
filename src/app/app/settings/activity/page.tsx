import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/app/skeleton";
import { ActivityFeed } from "@/components/settings/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { requireRole } from "@/server/auth/dal";
import { ACTIVITY_FILTERS, getActivity, parseActivityFilter } from "@/server/queries/activity";

export const metadata: Metadata = { title: "Activity log" };

export default function ActivityPage({ searchParams }: PageProps<"/app/settings/activity">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <ActivityLog searchParams={searchParams} />
    </Suspense>
  );
}

async function ActivityLog({ searchParams }: { searchParams: PageProps<"/app/settings/activity">["searchParams"] }) {
  // The audit trail is for owners and admins.
  const member = await requireRole("OWNER", "ADMIN");
  const params = await searchParams;
  const filter = parseActivityFilter(params.type);
  const cursor = typeof params.after === "string" ? params.after : undefined;
  const activity = await getActivity(member, filter, cursor);

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div>
          <CardTitle>Activity log</CardTitle>
          <CardDescription className="mt-1">
            Every booking change, offer, claim and setting update, with who did it. Message contents and phone numbers are
            never stored here.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <nav aria-label="Filter activity" className="mb-4 flex flex-wrap gap-1.5">
          {Object.entries(ACTIVITY_FILTERS).map(([key, f]) => (
            <Link
              key={key}
              href={key === "all" ? "/app/settings/activity" : `/app/settings/activity?type=${key}`}
              aria-current={key === filter ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium text-muted hover:text-foreground",
                key === filter && "border-foreground bg-foreground text-background hover:text-background",
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        {activity.events.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ActivityFeed activity={activity} tz={member.location.timezone} />
        )}
        <div className="mt-4 flex justify-between gap-3 border-t pt-4 text-sm">
          {cursor ? (
            <Link href={filter === "all" ? "/app/settings/activity" : `/app/settings/activity?type=${filter}`} className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
              ← Newest
            </Link>
          ) : (
            <span />
          )}
          {activity.nextCursor ? (
            <Link
              href={`/app/settings/activity?${new URLSearchParams({ ...(filter === "all" ? {} : { type: filter }), after: activity.nextCursor })}`}
              className="text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              Older →
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
