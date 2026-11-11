import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/app/skeleton";
import { CopyLink, PrintPoster, ResetLink } from "@/components/waitlist/share-tools";
import { Card } from "@/components/ui/card";
import { canManage, requireMember } from "@/server/auth/dal";
import { getJoinLink } from "@/server/queries/join";

export const metadata: Metadata = { title: "Share your waitlist" };

export default function SharePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px]" />}>
      <Share />
    </Suspense>
  );
}

async function Share() {
  const member = await requireMember();
  const { url, svg } = await getJoinLink(member);
  return (
    <>
      <PageHeader
        title="Grow your waitlist"
        description="Clients join by scanning a QR code at the counter or opening your link. They choose what they want and agree to messages themselves."
        actions={
          <Link href="/app/waitlist" className="text-sm text-accent underline underline-offset-4">
            Back to waitlist
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="grid justify-items-center gap-3 p-6">
          <div role="img" aria-label="QR code for your waitlist join link" className="size-56 rounded-xl border bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="text-xs text-muted">Scan with a phone camera to try it.</p>
        </Card>
        <Card className="grid content-start gap-5 p-6">
          <div>
            <p className="text-sm font-medium">Your join link</p>
            <p className="mt-2 rounded-lg border bg-surface-raised px-3 py-2 font-mono text-sm break-all">{url}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyLink url={url} />
            <PrintPoster />
          </div>
          <ul className="grid gap-2 text-sm text-muted">
            <li>Put the poster at the front desk and in the waiting area.</li>
            <li>Add the link to your Instagram bio and WhatsApp Business profile.</li>
            <li>Send it to regulars who often ask for earlier slots.</li>
          </ul>
          {canManage(member) ? (
            <div className="border-t pt-4">
              <p className="mb-2 text-sm text-muted">Link shared somewhere it shouldn&apos;t be? Resetting it stops the old link and old posters working.</p>
              <ResetLink />
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
