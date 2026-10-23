import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { AddWaitlistDialog } from "@/components/waitlist/add-waitlist-dialog";
import { ConsentChips } from "@/components/waitlist/consent-chips";
import { RemoveFromWaitlist } from "@/components/waitlist/remove-button";
import { Card } from "@/components/ui/card";
import type { Channel } from "@/generated/prisma/enums";
import { formatDate } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { getWaitlist } from "@/server/queries/campaigns";

export const metadata: Metadata = { title: "Waitlist" };

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function window(earliest: number, latest: number) {
  if (earliest <= 0 && latest >= 1440) return "Any time";
  const f = (m: number) => {
    const h = Math.floor(m / 60) % 24;
    return `${h % 12 === 0 ? 12 : h % 12}${m % 60 ? `:${String(m % 60).padStart(2, "0")}` : ""}${h >= 12 ? "pm" : "am"}`;
  };
  return `${f(earliest)}–${f(latest)}`;
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px]" />}>
      <Waitlist />
    </Suspense>
  );
}

async function Waitlist() {
  const member = await requireMember();
  const { entries, services, customers } = await getWaitlist(member);
  const consented = entries.filter((e) => e.customer.consents.some((c) => c.status === "GRANTED")).length;

  return (
    <>
      <PageHeader
        title="Waitlist"
        description={`${entries.length} waiting · ${consented} can be messaged`}
        actions={<AddWaitlistDialog services={services} customers={customers} />}
      />
      {entries.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">
          No one is waiting yet. Add customers who want an earlier or more convenient slot.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Wants</th>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Can message on</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e) => {
                const granted = e.customer.consents.filter((c) => c.status === "GRANTED").map((c) => c.channel);
                const reachable: Channel[] = [
                  ...(e.customer.phone ? (["WHATSAPP", "SMS"] as const) : []),
                  ...(e.customer.email ? (["EMAIL"] as const) : []),
                ];
                return (
                  <tr key={e.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{e.customer.name}</p>
                      <p className="text-xs tabular-nums text-muted">{e.customer.phone ?? e.customer.email}</p>
                      {e.notes ? <p className="mt-1 text-xs text-muted">“{e.notes}”</p> : null}
                    </td>
                    <td className="px-4 py-3">{e.service?.name ?? <span className="text-muted">Any service</span>}</td>
                    <td className="px-4 py-3">
                      <p>{e.preferredDays.length ? e.preferredDays.map((d) => DAY[d]).join(", ") : "Any day"}</p>
                      <p className="text-xs text-muted">{window(e.earliestMinute, e.latestMinute)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {reachable.length ? (
                        <ConsentChips customerId={e.customer.id} granted={granted} reachable={reachable} />
                      ) : (
                        <span className="text-xs text-muted">No contact details</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(e.createdAt, member.location.timezone, { weekday: undefined })}</td>
                    <td className="px-2 py-2">
                      <RemoveFromWaitlist entryId={e.id} name={e.customer.name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
