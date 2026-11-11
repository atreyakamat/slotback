import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { emailSignInMode } from "@/server/auth/sign-in-links";

export const metadata: Metadata = { title: "Create your account" };

const POINTS = ["Set up in about 10 minutes", "Your client list stays yours", "Clients never install anything"];

function Aside() {
  return (
    <>
      <p className="font-display text-4xl leading-[1.05] tracking-tight">Your next cancellation is already a booking.</p>
      <ul className="mt-8 grid gap-3">
        {POINTS.map((p) => (
          <li key={p} className="flex items-center gap-3 text-brand-cream/85">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand-lime text-brand-ink">
              <Check className="size-3.5" aria-hidden />
            </span>
            {p}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function SignUpPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell aside={<Aside />}>
      <h1 className="font-display text-3xl tracking-tight">Create your SlotBack account</h1>
      <p className="mt-2 text-muted">Tell us about your business. We&apos;ll email you a link to finish setting up.</p>
      <Suspense fallback={<div className="mt-8 h-96" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Body({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const { error } = await searchParams;
  if (emailSignInMode() === null) {
    return (
      <p className="mt-8 rounded-lg border bg-surface px-3 py-3 text-sm text-muted">
        Sign-up opens for pilot businesses soon.{" "}
        <Link href="/#demo" className="font-medium text-accent underline underline-offset-4">
          Book a demo
        </Link>{" "}
        and we&apos;ll set you up.
      </p>
    );
  }
  return (
    <div className="mt-8 grid gap-6">
      {error === "no-account" ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          There&apos;s no SlotBack account for that email yet. Create one below, or ask your owner to invite you.
        </p>
      ) : null}
      <SignUpForm />
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
