import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Button } from "@/components/ui/button";
import { demoLogin } from "@/server/actions/auth";
import { emailSignInMode } from "@/server/auth/sign-in-links";
import { env } from "@/server/env";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Request a new one below.",
  "demo-disabled": "The demo workspace is switched off on this site.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell>
      <h1 className="font-display text-3xl tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in with the email you used for SlotBack.</p>
      <Suspense fallback={<div className="mt-8 h-40" />}>
        <Body searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Body({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  const emailOn = emailSignInMode() !== null;
  const demoOn = env().DEMO_MODE;

  return (
    <div className="mt-8 grid gap-6">
      {message ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {message}
        </p>
      ) : null}
      {emailOn ? (
        <SignInForm />
      ) : (
        <p className="rounded-lg border bg-surface px-3 py-3 text-sm text-muted">Email sign-in opens for pilot businesses soon.</p>
      )}
      {demoOn ? (
        <div className="grid gap-3 border-t pt-6">
          <p className="text-sm text-muted">Just looking? Explore a sample Goa salon. Nothing you do there messages a real person.</p>
          <form action={demoLogin}>
            <Button type="submit" variant="secondary" size="lg" className="w-full">
              <Sparkles /> Try the demo workspace
            </Button>
          </form>
        </div>
      ) : null}
      {emailOn ? (
        <p className="text-sm text-muted">
          New to SlotBack?{" "}
          <Link href="/signup" className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
            Create an account
          </Link>
        </p>
      ) : null}
    </div>
  );
}
