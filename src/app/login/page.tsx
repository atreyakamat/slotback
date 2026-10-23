import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoLogin } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo className="text-lg" />
        </Link>
        <Card className="p-6">
          <h1 className="text-lg font-semibold">Welcome to SlotBack</h1>
          <p className="mt-1 text-sm text-muted">
            Explore a fictional Goa salon with a week of bookings and a ready waitlist. Nothing you do here messages a
            real person.
          </p>
          <form action={demoLogin} className="mt-6">
            <Button type="submit" size="lg" className="w-full">
              <Sparkles /> Try the demo workspace
            </Button>
          </form>
          <p className="mt-6 border-t pt-4 text-xs text-muted">
            Business accounts with email sign-in are being set up for pilot salons and clinics.
          </p>
        </Card>
      </div>
    </main>
  );
}
