import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { BeforeAfter } from "@/components/marketing/before-after";
import { Bento } from "@/components/marketing/bento";
import { BookDemoForm } from "@/components/marketing/book-demo-form";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { DevicePreview } from "@/components/marketing/device-preview";
import { KineticHeadline } from "@/components/marketing/kinetic-headline";
import { Marquee } from "@/components/marketing/marquee";
import { MobileCta } from "@/components/marketing/mobile-cta";
import { PilotTimeline } from "@/components/marketing/pilot-timeline";
import { PinnedStory } from "@/components/marketing/pinned-story";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import { ScrollBand } from "@/components/marketing/scroll-band";
import { ScrollRevealText } from "@/components/marketing/scroll-reveal-text";
import { SlotBoard } from "@/components/marketing/slot-board";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FAQ = [
  {
    q: "Do my clients need to install anything?",
    a: "No. They get a WhatsApp or SMS message with a link, see the opening, and confirm with one tap.",
  },
  {
    q: "Do I have to change my booking software?",
    a: "Not to try it. SlotBack includes a simple schedule for the pilot. Connections to the tools you already use will be built around what pilot businesses need most.",
  },
  {
    q: "Won't clients feel spammed?",
    a: "Only clients who joined your waitlist and agreed to messages are contacted, and only for openings that match what they asked for. Every message has an easy opt-out.",
  },
  {
    q: "How do you count recovered revenue?",
    a: "A refilled opening counts at the value you set for that service, shown as an estimate. Once the visit is marked completed, it moves into completed revenue. We never count a message sent as money earned.",
  },
  {
    q: "Is there an app?",
    a: "Your team can use SlotBack in any browser today. A staff app for iPhone and Android, with the same settings and numbers, is in development. Your clients never need an app.",
  },
  {
    q: "What does it cost?",
    a: "We're running short, assisted pilots with pricing agreed up front. Messaging costs are shown separately, never hidden inside a vague fee.",
  },
];

function SectionIntro({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-accent">{kicker}</p>
      <h2 className="wipe mt-3 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-lg text-muted text-pretty">{body}</p> : null}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-brand-green/90 text-brand-cream backdrop-blur-md">
        <span className="scroll-progress absolute inset-x-0 bottom-0 hidden h-0.5 bg-brand-lime motion-reduce:hidden supports-[animation-timeline:view()]:block" aria-hidden />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="SlotBack home">
            <Logo />
          </Link>
          <nav aria-label="Site" className="hidden items-center gap-7 text-sm text-brand-cream/70 md:flex">
            <a href="#how" className="hover:text-brand-cream">
              How it works
            </a>
            <a href="#roi" className="hover:text-brand-cream">
              What you get back
            </a>
            <a href="#features" className="hover:text-brand-cream">
              Features
            </a>
            <a href="#pilot" className="hover:text-brand-cream">
              Pilot
            </a>
            <a href="#faq" className="hover:text-brand-cream">
              FAQ
            </a>
            <Link href="/resources" className="hover:text-brand-cream">
              Free toolkit
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden h-8 items-center rounded-lg px-3 text-sm font-medium text-brand-cream/80 hover:text-brand-cream sm:inline-flex">
              Sign in
            </Link>
            <a href="#demo" className={buttonVariants({ variant: "brand", size: "sm" })}>
              Book a demo
            </a>
          </div>
        </div>
      </header>

      <main className="overflow-x-clip">
        <section id="hero" className="grain relative bg-brand-green text-brand-cream">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -top-40 -right-40 size-[36rem] rounded-full bg-brand-lime/10 blur-3xl" />
            <div className="absolute -bottom-56 -left-40 size-[30rem] rounded-full bg-brand-green-light/60 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-20">
            <div className="drift-out">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-cream/15 px-3 py-1 text-xs font-medium text-brand-lime">
                <span className="size-1.5 rounded-full bg-brand-lime" aria-hidden /> Now onboarding salons and clinics in Goa
              </p>
              <KineticHeadline
                text="Make every opening count."
                className="mt-6 font-display text-5xl leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem]"
              />
              <p className="mt-6 max-w-xl text-lg text-brand-cream/80 text-pretty">
                When a client cancels, SlotBack offers the slot to the right person on your waitlist over WhatsApp or SMS.
                The first to confirm gets it, and you see exactly what you got back.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#demo" className={cn(buttonVariants({ variant: "brand", size: "lg" }), "beam")}>
                  Book a demo <ArrowRight />
                </a>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "border-brand-cream/30 bg-transparent text-brand-cream hover:bg-brand-green-light",
                  )}
                >
                  Try the live demo
                </Link>
              </div>
              <p className="mt-4 text-sm text-brand-muted">No sign-up. It’s a sample Goa salon you can click through.</p>
            </div>
            <div className="drift-out-far">
              <SlotBoard />
            </div>
          </div>
          <ul className="relative mx-auto grid max-w-6xl grid-cols-3 gap-4 border-t border-brand-cream/10 px-4 py-8 sm:px-6">
            {[
              ["2 taps", "for your staff to refill a slot"],
              ["1 tap", "for a client to claim it"],
              ["0 apps", "for clients to install"],
            ].map(([n, label]) => (
              <li key={n}>
                <p className="font-display text-2xl text-brand-lime sm:text-4xl">{n}</p>
                <p className="mt-1 text-xs text-brand-cream/70 sm:text-sm">{label}</p>
              </li>
            ))}
          </ul>
        </section>

        <Marquee />

        <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-40">
          <ScrollRevealText text="A cancelled slot is revenue you already earned. Today it sits empty while your front desk works the phones. SlotBack gets it back in minutes." />
        </section>

        <section id="problem" className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
          <SectionIntro
            kicker="The problem"
            title="The same cancellation, two ways."
            body="Refilling a slot by phone eats your front desk’s afternoon and usually fails. Here’s the difference on a normal Saturday."
          />
          <div className="mt-12">
            <BeforeAfter />
          </div>
        </section>

        <section id="how" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionIntro kicker="How it works" title="Two taps for your staff. One tap for your client." />
          </div>
          <div className="mt-12 md:mt-0">
            <PinnedStory />
          </div>
        </section>

        <section id="roi" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-28 sm:px-6">
          <SectionIntro
            kicker="What you get back"
            title="Put your own numbers in."
            body="Move the sliders to match a normal week. We'd rather show you a careful estimate than a big promise."
          />
          <div className="mt-12">
            <RoiCalculator />
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-y bg-surface-raised/40">
          <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
            <SectionIntro kicker="Features" title="Built for a busy front desk." body="Calm, simple, and careful with your clients’ trust." />
            <div className="mt-12">
              <Bento />
            </div>
          </div>
        </section>

        <ScrollBand />

        <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
          <SectionIntro
            kicker="Web and app"
            title="One setup. Every screen."
            body="Set your rules once and they apply everywhere: the web console today, and the staff app for iPhone and Android that's in development."
          />
          <div className="mt-16 pb-6">
            <DevicePreview />
          </div>
        </section>

        <section id="pilot" className="scroll-mt-16 border-t">
          <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
            <SectionIntro
              kicker="How a pilot works"
              title="Four weeks. Your numbers. Your call."
              body="A short, assisted pilot with a clear end date, so you judge SlotBack on what it recovered for you."
            />
            <div className="mt-12">
              <PilotTimeline />
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-16 border-t bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <SectionIntro
                kicker="Book a demo"
                title="See it refill a real cancellation."
                body="In 20 minutes we'll run the full loop on your own services. If it fits, we'll set you up the same week."
              />
              <ul className="mt-8 grid gap-3 text-sm">
                {["Setup done with you, in an afternoon", "Short pilot with a clear end date", "Your client list stays yours"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex size-5 items-center justify-center rounded-full bg-highlight text-[11px] font-bold text-highlight-foreground">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-[2rem] border bg-background p-5 sm:p-8">
              <BookDemoForm />
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 border-t">
          <div className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">Questions</h2>
            <div className="mt-10 divide-y border-y">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                    {q}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <ClosingCta />
      </main>

      <footer className="bg-brand-ink text-brand-cream/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="text-brand-cream" />
            <span>Made in Goa</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/resources" className="hover:text-brand-cream">
              Free toolkit
            </Link>
            <Link href="/privacy" className="hover:text-brand-cream">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-brand-cream">
              Sign in
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </footer>
      <MobileCta />
    </div>
  );
}
