import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { JoinForm } from "@/components/join/join-form";
import { LogoMark } from "@/components/logo";
import { db } from "@/server/db";
import { getJoinPage } from "@/server/domain/waitlist-growth";

export const metadata: Metadata = { title: "Join the waitlist", robots: { index: false, follow: false } };

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <Suspense fallback={<div className="h-96" />}>
        <Join params={params} />
      </Suspense>
      <footer className="mt-auto flex items-center justify-center gap-2 pt-10 text-xs text-muted">
        <LogoMark className="size-4" /> Waitlist by SlotBack
      </footer>
    </main>
  );
}

async function Join({ params }: { params: PageProps<"/join/[code]">["params"] }) {
  await connection();
  const { code } = await params;
  const page = await getJoinPage(db, code);
  if (!page) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl">This link isn&apos;t active</h1>
        <p className="mt-2 text-muted">Ask the business for their latest waitlist link or QR code.</p>
      </div>
    );
  }
  const business = page.organization.name;
  return (
    <>
      <p className="text-sm font-medium text-accent">{page.name}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">Want an earlier slot at {business}?</h1>
      <p className="mt-3 text-muted">Join the waitlist. When someone cancels, you&apos;ll get a message and can grab the slot in one tap.</p>
      <div className="mt-8">
        <JoinForm code={code} business={business} services={page.services} />
      </div>
    </>
  );
}
