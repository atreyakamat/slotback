import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo";
import { PrintOnLoad } from "@/components/waitlist/print-on-load";
import { requireMember } from "@/server/auth/dal";
import { getJoinLink } from "@/server/queries/join";

export const metadata: Metadata = { title: "Waitlist poster", robots: { index: false } };

/** A printable A5/A4 poster with the join QR code. Opens the print dialog automatically. */
export default function PosterPage() {
  return (
    <Suspense fallback={null}>
      <Poster />
    </Suspense>
  );
}

async function Poster() {
  const member = await requireMember();
  const { svg } = await getJoinLink(member);
  return (
    <main className="mx-auto flex min-h-dvh max-w-[148mm] flex-col items-center justify-center bg-white px-8 py-12 text-center text-brand-ink print:min-h-0">
      <PrintOnLoad />
      <p className="text-sm font-semibold tracking-wide uppercase">{member.organization.name}</p>
      <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight">Want an earlier slot?</h1>
      <p className="mt-4 max-w-sm text-lg">Scan to join our waitlist. When someone cancels, we&apos;ll message you first.</p>
      <div className="mt-8 size-64 rounded-2xl border-4 border-brand-ink p-3 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="mt-6 text-sm">Takes 30 seconds. No app needed.</p>
      <p className="mt-10 flex items-center gap-2 text-xs text-brand-ink/60">
        <LogoMark className="size-4" /> Powered by SlotBack
      </p>
    </main>
  );
}
