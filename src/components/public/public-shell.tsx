import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

/** Frame for patient-facing pages: the clinic's name first, SlotBack quietly in the footer. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:py-12">{children}</main>
      <footer className="border-t py-5 text-center text-xs text-muted">
        <Link href="/" className="inline-flex items-center gap-1.5">
          Bookings by <Logo className="text-xs [&_svg]:size-4" />
        </Link>
      </footer>
    </div>
  );
}
