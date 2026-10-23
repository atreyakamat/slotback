import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { emailSignInMode } from "@/server/auth/sign-in-links";
import { db } from "@/server/db";
import { viewInvite } from "@/server/domain/team";

export const metadata: Metadata = { title: "Join your team", robots: { index: false, follow: false } };

const ROLE: Record<string, string> = { ADMIN: "an admin", STAFF: "a team member" };

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-60" />}>
        <Invite params={params} />
      </Suspense>
    </AuthShell>
  );
}

async function Invite({ params }: { params: PageProps<"/invite/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  const invite = await viewInvite(db, token);

  if (invite.state !== "valid") {
    const message =
      invite.state === "used"
        ? "This invite was already used. Sign in with the email it was sent to."
        : invite.state === "expired"
          ? `This invite has expired. Ask ${invite.businessName} to send a new one.`
          : "This invite link isn't valid. It may have been cancelled or replaced by a newer one.";
    return (
      <>
        <h1 className="font-display text-3xl tracking-tight">{invite.state === "used" ? "Already joined" : "This link isn't active"}</h1>
        <p className="mt-3 text-muted">{message}</p>
        <Link href="/login" className="mt-8 inline-block text-sm font-medium underline underline-offset-4">
          Go to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Join {invite.businessName}</h1>
      <p className="mt-2 text-muted">
        Hi {invite.name.split(" ")[0]}, you&apos;ve been invited as {ROLE[invite.role] ?? "a team member"}. We&apos;ll email a sign-in link to
        confirm it&apos;s you.
      </p>
      <div className="mt-8">
        {emailSignInMode() !== null ? (
          <SignInForm email={invite.email} submitLabel="Email me a link to join" />
        ) : (
          <p className="rounded-lg border bg-surface px-3 py-3 text-sm text-muted">Email sign-in isn&apos;t switched on for this site yet.</p>
        )}
      </div>
    </>
  );
}
