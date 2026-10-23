import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { CostCalculator } from "@/components/resources/cost-calculator";
import { MessageTemplates } from "@/components/resources/message-templates";
import { PolicyWriter } from "@/components/resources/policy-writer";
import { WeeklyChecklist } from "@/components/resources/weekly-checklist";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Empty Slot Rescue Kit",
  description:
    "Free tools for salons, clinics and studios: work out what cancellations cost you, copy messages that win slots back, write a fair cancellation policy and run a weekly no-show reset.",
  alternates: { canonical: "/resources" },
};

const TOOLS = [
  { href: "#calculator", label: "Cost calculator" },
  { href: "#messages", label: "Message templates" },
  { href: "#policy", label: "Policy writer" },
  { href: "#checklist", label: "Weekly checklist" },
];

export default function ResourcesPage() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-brand-ink text-brand-cream">
      {/* Brand glow behind the frosted cards. Decorative only. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[36rem] rounded-full bg-brand-lime/25 blur-[120px]" />
        <div className="absolute top-[30rem] -right-48 size-[40rem] rounded-full bg-[#1a6e48]/60 blur-[120px]" />
        <div className="absolute top-[85rem] -left-32 size-[32rem] rounded-full bg-brand-lime/15 blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="SlotBack home">
          <Logo className="text-brand-cream" />
        </Link>
        <Link href="/#demo" className={buttonVariants({ variant: "brand", size: "sm" })}>
          Book a demo
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid max-w-3xl gap-7 px-4 pt-8 pb-20 sm:px-6">
        <div className="grid gap-4">
          <p className="text-sm font-semibold text-brand-cream/70">Free toolkit · no sign-up</p>
          <h1 className="font-display text-5xl leading-[0.98] tracking-tight text-balance sm:text-6xl">
            Empty Slot <span className="text-brand-lime">Rescue Kit</span>
          </h1>
          <p className="max-w-[60ch] text-lg text-brand-cream/80 text-pretty">
            Free tools for salons, clinics and studios that lose money to last-minute cancellations. Work out what they cost you, copy messages
            that win slots back, and set a fair policy.
          </p>
          <nav aria-label="Tools" className="flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-bold hover:border-brand-lime hover:text-brand-lime focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-lime"
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>

        <CostCalculator />
        <MessageTemplates />
        <PolicyWriter />
        <WeeklyChecklist />

        <section aria-labelledby="cta-title" className="grid gap-4 rounded-[28px] bg-gradient-to-br from-[#d6ff5a] to-brand-lime p-6 text-brand-green sm:p-8">
          <h2 id="cta-title" className="font-display text-3xl leading-tight tracking-tight text-balance">
            Want this done for you, automatically?
          </h2>
          <p className="max-w-[60ch] font-medium">
            SlotBack sends your waitlist a claim link the moment someone cancels. The first to tap gets the slot. Built in Goa for salons, clinics
            and studios.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/#demo" className={cn(buttonVariants({ size: "lg" }), "bg-brand-green text-brand-lime hover:bg-brand-green/90")}>
              Book a free demo <ArrowRight aria-hidden />
            </Link>
            <a
              href="https://ig.me/m/slotback.app"
              target="_blank"
              rel="noopener"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-brand-green hover:bg-brand-green/10 hover:text-brand-green")}
            >
              DM “DEMO” on Instagram
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-brand-cream/60 sm:px-6">
          <span>Free to use and share · Made in Goa</span>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-brand-cream">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-brand-cream">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
