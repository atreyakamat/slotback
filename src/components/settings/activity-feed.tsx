import Link from "next/link";
import { Bot, CalendarClock, RefreshCcw, Settings2, UserRound, Users } from "lucide-react";
import { formatDate, formatTime } from "@/lib/time";
import type { Activity } from "@/server/queries/activity";

type Event = Activity["events"][number];

const VERBS: Record<string, string> = {
  "appointment.created": "booked",
  "appointment.rescheduled": "rescheduled",
  "appointment.cancelled": "cancelled",
  "appointment.completed": "marked completed",
  "appointment.no_show": "marked as a no-show",
  "appointment.booked": "reopened",
  "campaign.created": "opened a refill for",
  "campaign.launched": "sent offers for",
  "campaign.round_sent": "sent more offers for",
  "campaign.auto_round_sent": "Next round of offers went out for",
  "campaign.stopped": "stopped offering",
  "campaign.claimed": "claimed",
  "campaign.expired": "Offers expired for",
  "campaign.closed_slot_booked_manually": "Offers closed (booked by hand) for",
  "waitlist.added": "added to the waitlist:",
  "waitlist.removed": "removed from the waitlist:",
  "consent.granted": "recorded consent for",
  "consent.revoked": "recorded an opt-out for",
  "customer.created": "added customer",
  "service.created": "added service",
  "service.updated": "updated service",
  "service.archived": "archived service",
  "service.restored": "restored service",
  "resource.created": "added staff member",
  "resource.updated": "updated staff member",
  "resource.archived": "archived staff member",
  "resource.restored": "restored staff member",
  "location.settings_updated": "updated business settings",
  "waitlist.self_joined": "joined the waitlist from the QR link:",
  "waitlist.self_updated": "updated their waitlist preferences:",
  "waitlist.imported": "imported clients to the waitlist",
  "waitlist.join_link_reset": "reset the waitlist join link",
  "organization.created": "created the business",
  "organization.onboarded": "finished setting up the business",
  "demo.seeded": "Demo workspace was reset",
  "member.invited": "invited someone to the team",
  "member.invite_revoked": "cancelled a team invite",
  "member.joined": "joined the team",
  "member.role_changed": "changed a team member's role",
  "member.removed": "removed someone from the team",
};

function iconFor(e: Event) {
  if (e.actorType === "SYSTEM") return Bot;
  if (e.actorType === "CUSTOMER") return UserRound;
  if (e.entityType === "campaign") return RefreshCcw;
  if (e.entityType === "appointment") return CalendarClock;
  if (e.entityType === "waitlist_entry" || e.entityType === "customer") return Users;
  return Settings2;
}

function describe(e: Event, l: Activity["lookup"], tz: string) {
  const actor =
    e.actorType === "SYSTEM"
      ? null
      : e.actorType === "USER"
        ? (l.users.get(e.actorId ?? "")?.name ?? "A team member")
        : (l.customers.get(e.actorId ?? "")?.name ?? "A customer");
  const verb = VERBS[e.action] ?? e.action.replace(/[._]/g, " ");

  let subject: string | null = null;
  let href: string | null = null;
  if (e.entityType === "campaign") {
    const c = l.campaigns.get(e.entityId);
    subject = c ? `${c.service.name}, ${formatDate(c.startAt, tz)} ${formatTime(c.startAt, tz)}` : "a campaign";
    href = c ? `/app/campaigns/${c.id}` : null;
  } else if (e.entityType === "appointment") {
    const a = l.appointments.get(e.entityId);
    subject = a
      ? `${a.customer?.name ?? "Walk-in"} · ${a.service.name}, ${formatDate(a.startAt, tz)} ${formatTime(a.startAt, tz)}`
      : "an appointment";
    href = a ? `/app/appointments/${a.id}` : null;
  } else if (e.entityType === "service") subject = l.services.get(e.entityId)?.name ?? null;
  else if (e.entityType === "resource") subject = l.resources.get(e.entityId)?.name ?? null;
  else if (e.entityType === "waitlist_entry") subject = l.waitlist.get(e.entityId)?.customer.name ?? "a customer";
  else if (e.entityType === "customer") {
    subject = l.customers.get(e.entityId)?.name ?? "a customer";
    const channel = (e.metadata as { channel?: string } | null)?.channel;
    if (channel) subject += ` (${channel.toLowerCase()})`;
  }

  return { actor, verb, subject, href };
}

export function ActivityFeed({ activity, tz }: { activity: Activity; tz: string }) {
  const days = activity.events.map((e) => formatDate(e.createdAt, tz, { weekday: "long", month: "long" }));
  return (
    <ol className="grid">
      {activity.events.map((e, i) => {
        const { actor, verb, subject, href } = describe(e, activity.lookup, tz);
        const Icon = iconFor(e);
        const day = days[i];
        const showDay = i === 0 || day !== days[i - 1];
        return (
          <li key={e.id}>
            {showDay ? <p className="mt-4 mb-1 text-xs font-medium text-muted first:mt-0">{day}</p> : null}
            <div className="flex items-start gap-3 py-2">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <p className="min-w-0 flex-1 text-sm">
                {actor ? <span className="font-medium">{actor} </span> : null}
                {verb}{" "}
                {subject ? (
                  href ? (
                    <Link href={href} className="font-medium hover:underline">
                      {subject}
                    </Link>
                  ) : (
                    <span className="font-medium">{subject}</span>
                  )
                ) : null}
              </p>
              <time dateTime={e.createdAt.toISOString()} className="shrink-0 text-xs tabular-nums text-muted">
                {formatTime(e.createdAt, tz)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
