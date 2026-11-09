import type { Metadata } from "next";
import { Suspense } from "react";
import { MessageCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MessagePurpose, MessageStatus } from "@/generated/prisma/enums";
import { maskPhone } from "@/lib/phone";
import { formatDate, formatTime } from "@/lib/time";
import { requireMember } from "@/server/auth/dal";
import { deliverNow } from "@/server/actions/appointments";
import { env } from "@/server/env";
import { getMessageCounts, getMessageLog } from "@/server/queries/appointments";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage(props: PageProps<"/app/messages">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Messages {...props} />
    </Suspense>
  );
}

const PURPOSE: Record<MessagePurpose, string> = {
  OFFER: "Opening offer",
  BOOKING_CONFIRMATION: "Booking confirmation",
  APPOINTMENT_REMINDER: "Reminder",
};

const STATUS: Record<MessageStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }> = {
  QUEUED: { label: "Scheduled", tone: "neutral" },
  SENT: { label: "Sent", tone: "success" },
  DELIVERED: { label: "Delivered", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  CANCELLED: { label: "Withdrawn", tone: "neutral" },
  SUPPRESSED: { label: "Not sent: no consent", tone: "warning" },
};

async function Messages({ searchParams }: PageProps<"/app/messages">) {
  const member = await requireMember();
  const sp = await searchParams;
  const now = new Date();
  const tz = member.location.timezone;
  const [log, counts] = await Promise.all([getMessageLog(member.location.id), getMessageCounts(member.location.id, now)]);
  const canSend = member.role === "OWNER" || member.role === "ADMIN";
  const isMock = env().WHATSAPP_PROVIDER === "mock";

  return (
    <>
      <PageHeader
        title="Messages"
        description={`${counts.scheduled} scheduled · ${counts.due} due now`}
        actions={
          canSend ? (
            <form action={deliverNow}>
              <Button type="submit" variant="secondary" disabled={counts.due === 0}>
                <Send /> Send due messages
              </Button>
            </form>
          ) : null
        }
      />

      {isMock ? (
        <p className="mb-4 rounded-lg border bg-surface-raised px-3 py-2 text-sm text-muted">
          WhatsApp is in test mode. Messages are recorded here but never leave SlotBack.
        </p>
      ) : null}
      {typeof sp.sent === "string" ? (
        <p role="status" className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Sent {sp.sent} message{sp.sent === "1" ? "" : "s"}
          {sp.skipped && sp.skipped !== "0" ? `, ${sp.skipped} held back (quiet hours, consent or cancelled)` : ""}.
        </p>
      ) : null}

      {log.upcoming.length + log.recent.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">No messages yet. Reminders appear here when patients book.</Card>
      ) : (
        <div className="grid gap-6">
          {log.upcoming.length > 0 ? <MessageList title="Coming up" messages={log.upcoming} tz={tz} /> : null}
          {log.recent.length > 0 ? <MessageList title="Recent" messages={log.recent} tz={tz} /> : null}
        </div>
      )}
    </>
  );
}

type LogMessage = Awaited<ReturnType<typeof getMessageLog>>["recent"][number];

function MessageList({ title, messages, tz }: { title: string; messages: LogMessage[]; tz: string }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <Card>
        <ul className="divide-y">
          {messages.map((m) => {
            const s = STATUS[m.status];
            const at = m.sentAt ?? m.nextAttemptAt;
            return (
              <li key={m.id} className="grid gap-2 p-4 sm:grid-cols-[11rem_1fr] sm:gap-4">
                <div className="text-sm">
                  <p className="font-medium">{m.appointment?.customer?.name ?? maskPhone(m.toAddress)}</p>
                  <p className="text-xs text-muted">
                    {PURPOSE[m.purpose]} · {formatDate(at, tz)}, {formatTime(at, tz)}
                  </p>
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <MessageCircle className="size-3" aria-hidden /> {m.channel.toLowerCase()} · {maskPhone(m.toAddress)}
                    </span>
                  </div>
                  <p className="rounded-lg bg-surface-raised px-3 py-2 text-sm break-words">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
