import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarCheck2, CalendarX2, Clock, MapPin, Phone, TimerOff } from "lucide-react";
import { Skeleton } from "@/components/app/skeleton";
import { ClaimForm } from "@/components/claim/claim-form";
import { Countdown } from "@/components/claim/countdown";
import { formatDate, formatTime } from "@/lib/time";
import { db } from "@/server/db";
import { viewOffer, type OfferView } from "@/server/domain/campaigns";

export const metadata: Metadata = {
  title: "Your opening",
  // Claim links are private: keep them out of search engines and Referer headers.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ClaimPage({ params }: PageProps<"/c/[token]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Claim params={params} />
      </Suspense>
      <p className="mt-auto pt-10 text-center text-xs text-muted">Sent securely by SlotBack on behalf of the business.</p>
    </main>
  );
}

async function Claim({ params }: { params: PageProps<"/c/[token]">["params"] }) {
  const { token } = await params;
  // Offer state depends on the current time, so this always renders per request.
  await connection();
  const view = await viewOffer(db, token);

  if (view.state === "invalid") {
    return (
      <State icon={CalendarX2} title="This link isn't valid" tone="muted">
        It may have been copied incompletely. Please use the link from your message, or contact the business directly.
      </State>
    );
  }

  const when = `${formatDate(view.startAt, view.timezone, { weekday: "long", month: "long" })}`;
  const time = `${formatTime(view.startAt, view.timezone)} – ${formatTime(view.endAt, view.timezone)}`;

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-medium text-muted">{view.businessName}</p>
        {view.state === "available" ? (
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hi {view.customerFirstName}, this opening is yours if you want it.</h1>
        ) : null}
      </header>

      {view.state === "claimed_by_you" ? (
        <State icon={CalendarCheck2} title="You're booked." tone="success">
          The business has been notified. See you there!
        </State>
      ) : null}
      {view.state === "taken" ? (
        <State icon={CalendarX2} title="This opening has just been claimed." tone="muted">
          Someone confirmed a moment before you. You&apos;re still on the waitlist, so we&apos;ll message you about the next one.
        </State>
      ) : null}
      {view.state === "expired" ? (
        <State icon={TimerOff} title="This offer has ended." tone="muted">
          The time to claim it has passed. You&apos;re still on the waitlist for future openings.
        </State>
      ) : null}

      <section className="rounded-[var(--radius-card)] border bg-surface p-5" aria-label="Appointment details">
        <p className="text-lg font-semibold">{view.serviceName}</p>
        <p className="text-sm text-muted">with {view.staffName}</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex gap-3">
            <dt className="sr-only">When</dt>
            <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <dd>
              <span className="font-medium">{when}</span>
              <br />
              {time}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="sr-only">Where</dt>
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <dd>
              {view.locationName}
              {view.address ? (
                <>
                  <br />
                  <span className="text-muted">{view.address}</span>
                </>
              ) : null}
            </dd>
          </div>
        </dl>
      </section>

      {view.state === "available" ? <Available view={view} token={token} /> : null}

      {view.phone ? (
        <a href={`tel:${view.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground">
          <Phone className="size-4" aria-hidden /> Questions? Call {view.businessName}
        </a>
      ) : null}
    </div>
  );
}

function Available({ view, token }: { view: Exclude<OfferView, { state: "invalid" }>; token: string }) {
  return (
    <div className="grid gap-3">
      <p className="flex items-center justify-between rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
        <span>First to confirm gets it.</span>
        <span className="font-medium">
          <Countdown until={view.expiresAt.toISOString()} fallback={`Until ${formatTime(view.expiresAt, view.timezone)}`} />
        </span>
      </p>
      <ClaimForm token={token} />
      <p className="text-center text-xs text-muted">By claiming, you agree to attend or let the business know if plans change.</p>
    </div>
  );
}

function State({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof Clock;
  title: string;
  tone: "success" | "muted";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={
        tone === "success"
          ? "rounded-[var(--radius-card)] border border-success/40 bg-success/10 p-5"
          : "rounded-[var(--radius-card)] border bg-surface p-5"
      }
    >
      <Icon className={tone === "success" ? "size-6 text-success" : "size-6 text-muted"} aria-hidden />
      <h1 className="mt-3 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}
