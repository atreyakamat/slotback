import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" aria-label="SlotBack home">
        <Logo />
      </Link>
      <h1 className="mt-10 font-display text-3xl tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-muted">Plain-language summary for the SlotBack pilot.</p>

      <div className="mt-8 grid gap-6 text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_p]:mt-1.5 [&_p]:text-muted">
        <section>
          <h2>Demo requests</h2>
          <p>
            When you book a demo we keep your name, business, contact details and message so we can arrange it. We use
            them only for that conversation and follow-ups about SlotBack, and delete them on request.
          </p>
        </section>
        <section>
          <h2>Businesses using SlotBack</h2>
          <p>
            Each business owns its client list. SlotBack stores clients’ names, contact details, waitlist preferences and
            messaging consent so it can offer openings on the business’s behalf. We don’t sell or share this data.
          </p>
        </section>
        <section>
          <h2>Clients on a waitlist</h2>
          <p>
            You’re only contacted if you agreed to hear about openings, and only on the channel you chose. Reply STOP or
            ask the business to remove you at any time. Claim links are single-use and expire.
          </p>
        </section>
        <section>
          <h2>Security</h2>
          <p>
            Data is encrypted in transit and stored with a managed database provider. Claim links are stored only as
            one-way hashes, and the activity log never records message contents or phone numbers.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>Questions or deletion requests: reply to any message from the SlotBack team, or use the demo form.</p>
        </section>
      </div>
    </div>
  );
}
