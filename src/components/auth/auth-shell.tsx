import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

/** Two-panel frame for sign-in, sign-up and setup: brand on the left (hidden on phones), the task on the right. */
export function AuthShell({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside className="grain relative hidden overflow-hidden bg-brand-green p-10 text-brand-cream lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-brand-lime/10 blur-3xl" aria-hidden />
        <Link href="/" aria-label="SlotBack home" className="relative">
          <Logo />
        </Link>
        <div className="relative mt-auto max-w-md">
          {aside ?? (
            <>
              <p className="font-display text-4xl leading-[1.05] tracking-tight">Make every opening count.</p>
              <p className="mt-4 text-brand-cream/75">
                When a client cancels, SlotBack offers the slot to your waitlist and the first to tap gets it.
              </p>
            </>
          )}
        </div>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-10">
        <Link href="/" aria-label="SlotBack home" className="mb-10 lg:hidden">
          <Logo />
        </Link>
        <div className="m-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
