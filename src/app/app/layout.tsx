import { Suspense } from "react";
import Link from "next/link";
import { AccountCard } from "@/components/app/account-card";
import { NavLinks } from "@/components/app/nav-links";
import { Logo } from "@/components/logo";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-surface lg:flex lg:flex-col lg:gap-6 lg:p-4">
        <Link href="/app" className="px-2 pt-1">
          <Logo />
        </Link>
        <NavLinks />
        <div className="mt-auto">
          <Suspense fallback={<div className="h-[62px] rounded-lg border bg-surface" />}>
            <AccountCard />
          </Suspense>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link href="/app">
          <Logo />
        </Link>
        <NavLinks orientation="horizontal" />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
    </div>
  );
}
