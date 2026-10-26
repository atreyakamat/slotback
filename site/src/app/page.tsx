import { ArrowDown, ArrowRight } from "lucide-react";
import { DemoForm } from "@/components/demo-form";
import { Faq } from "@/components/faq";
import { Header } from "@/components/header";
import { HowItWorks } from "@/components/how-it-works";
import { LiveBoard } from "@/components/live-board";
import { Logo } from "@/components/logo";
import { RecoveryCalc } from "@/components/recovery-calc";
import { ScrollStretch } from "@/components/scroll-stretch";
import { Spotlight } from "@/components/spotlight";
import { StretchHeadline } from "@/components/stretch-headline";
import { Ticker } from "@/components/ticker";
import { Verticals } from "@/components/verticals";

const INSTAGRAM = "https://instagram.com/slotback.app";

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs tracking-widest text-lime uppercase">{children}</p>;
}

const RULES = [
  ["Only people who said yes.", "Clients join your waitlist and agree to messages. Nobody else is ever contacted, and every message has an opt-out."],
  ["First tap wins.", "One slot, one booking. The moment someone claims it, everyone else is told it's gone. No double bookings."],
  ["Your clients stay yours.", "Your list is never shared or sold, and never messaged for anyone else. Export it any time."],
  ["Works with your tools.", "Use the simple built-in schedule, or connect the booking tool you already have."],
];

const PILOT = [
  ["Week 1", "Set up in an afternoon", "We add your services, staff and hours with you, and print a QR poster for your front desk."],
  ["Week 2", "Your waitlist fills up", "Clients scan the poster or tap a link to say which slots they'd jump at."],
  ["Week 3", "Cancellations get refilled", "Every cancellation goes out to the right people. You watch the board fill back up."],
  ["Week 4", "Your numbers, your call", "You see exactly what was won back. Keep going, or walk away. No lock-in."],
];

export default function Home() {
  return (
    <>
      <Header />
      <main id="top" className="overflow-x-clip">
        {/* Hero */}
        <section className="grain relative isolate min-h-dvh overflow-hidden pt-28 pb-16 sm:pt-32">
          <div className="grid-lines absolute inset-0 -z-10" aria-hidden />
          <div className="absolute -top-48 -right-40 -z-10 size-[42rem] rounded-full bg-lime/15 blur-[120px]" aria-hidden />
          <div className="absolute -bottom-64 -left-48 -z-10 size-[40rem] rounded-full bg-green-light/70 blur-[120px]" aria-hidden />
          <Spotlight />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-ink/40 px-3 py-1.5 font-mono text-[11px] tracking-wide text-cream/80 uppercase backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-lime" aria-hidden />
                Now onboarding pilots in Goa
              </p>
              <StretchHeadline
                className="mt-7 text-[clamp(3.4rem,14vw,7rem)] leading-[0.86] tracking-tight"
                lines={[{ text: "Cancelled?" }, { text: "Refilled.", className: "text-lime" }]}
              />
              <p className="mt-8 max-w-lg text-lg text-cream/75 sm:text-xl">
                When a client cancels, SlotBack offers the slot to your waitlist on WhatsApp. The first to tap gets it. You get the money back.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="#demo"
                  className="group inline-flex h-14 items-center gap-2 rounded-full bg-lime px-8 font-semibold text-ink shadow-[0_0_60px_-10px_rgba(198,244,50,0.6)] transition-transform hover:scale-105"
                >
                  Book a demo <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </a>
                <a href="#how" className="inline-flex h-14 items-center gap-2 rounded-full border border-cream/20 px-7 font-medium transition-colors hover:border-lime hover:text-lime">
                  See how it works <ArrowDown className="size-4" />
                </a>
              </div>
            </div>
            <LiveBoard />
          </div>
          <ul className="relative mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-4 px-4 sm:mt-20 sm:px-8">
            {[
              ["2 taps", "for staff to refill a slot"],
              ["1 tap", "for a client to claim it"],
              ["0 apps", "for clients to install"],
            ].map(([n, l]) => (
              <li key={n} className="border-t border-cream/15 pt-4">
                <p className="stretch text-3xl text-lime [--wdth:130] sm:text-5xl">{n}</p>
                <p className="mt-1 text-xs text-cream/60 sm:text-sm">{l}</p>
              </li>
            ))}
          </ul>
        </section>

        <Ticker />

        {/* Statement */}
        <section className="mx-auto max-w-6xl px-4 py-32 sm:px-8 sm:py-48">
          <ScrollStretch className="text-[clamp(2.2rem,8.5vw,8rem)] leading-[0.9]">
            An empty chair <span className="text-lime">still pays rent.</span>
          </ScrollStretch>
          <p className="mt-10 max-w-xl text-lg text-cream/70 sm:text-xl">
            A cancelled slot is money you’d already earned. Right now it sits empty while your front desk works the phones. SlotBack wins it back in minutes, without a single call.
          </p>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-cream/10 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <Kicker>How it works</Kicker>
            <h2 className="stretch mt-4 max-w-3xl text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-7xl sm:[--wdth:120]">Three steps. No phone calls.</h2>
            <div className="mt-16 lg:mt-4">
              <HowItWorks />
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section id="who" className="scroll-mt-20 border-t border-cream/10">
          <Verticals />
        </section>

        {/* Rules */}
        <section className="bg-cream text-ink">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
            <p className="font-mono text-xs tracking-widest text-green uppercase">The rules we play by</p>
            <h2 className="stretch mt-4 max-w-3xl text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-7xl sm:[--wdth:120]">Careful with your clients’ trust.</h2>
            <ul className="mt-16 grid gap-px overflow-hidden rounded-[32px] border border-ink/10 bg-ink/10 sm:grid-cols-2">
              {RULES.map(([t, b], i) => (
                <li key={t} className="group relative bg-cream p-8 transition-colors duration-300 hover:bg-ink hover:text-cream sm:p-10">
                  <span className="font-mono text-xs opacity-50">0{i + 1}</span>
                  <h3 className="stretch mt-6 text-3xl leading-none transition-[--wdth] duration-500 [--wdth:100] group-hover:[--wdth:130] group-hover:text-lime sm:text-4xl">{t}</h3>
                  <p className="mt-4 max-w-sm opacity-70">{b}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Numbers */}
        <section id="numbers" className="scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <Kicker>Your numbers</Kicker>
            <h2 className="stretch mt-4 max-w-3xl text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-7xl sm:[--wdth:120]">What are cancellations costing you?</h2>
            <p className="mt-6 max-w-xl text-lg text-cream/70">Move the sliders to match a normal week.</p>
            <div className="mt-12">
              <RecoveryCalc />
            </div>
          </div>
        </section>

        {/* Pilot */}
        <section className="border-t border-cream/10 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <Kicker>How a pilot works</Kicker>
            <h2 className="stretch mt-4 max-w-3xl text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-7xl sm:[--wdth:120]">Four weeks. Then you decide.</h2>
            <ol className="mt-16 border-t border-cream/15">
              {PILOT.map(([w, t, b]) => (
                <li key={w} className="group grid gap-2 border-b border-cream/15 py-8 transition-colors hover:bg-green/40 sm:grid-cols-[10rem_1fr_1.2fr] sm:items-baseline sm:gap-8 sm:px-4">
                  <span className="font-mono text-sm text-lime">{w}</span>
                  <span className="stretch text-3xl leading-none transition-[--wdth] duration-500 [--wdth:100] group-hover:[--wdth:125] sm:text-4xl">{t}</span>
                  <span className="text-cream/70">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="scroll-mt-20 px-4 py-12 sm:px-8 sm:py-20">
          <div className="grain relative mx-auto grid max-w-6xl gap-12 overflow-hidden rounded-[40px] border border-cream/10 bg-green p-5 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="absolute -top-40 -left-40 size-[30rem] rounded-full bg-lime/15 blur-[100px]" aria-hidden />
            <div className="relative min-w-0">
              <Kicker>Book a demo</Kicker>
              <h2 className="stretch mt-4 text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-6xl sm:[--wdth:120]">See it refill a real cancellation.</h2>
              <p className="mt-6 text-lg text-cream/70">20 minutes, on your own services. If it fits, we set you up the same week.</p>
              <ul className="mt-8 grid gap-3">
                {["Set up with you, in an afternoon", "Short pilot with a clear end date", "Your client list stays yours"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
              <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-2 text-sm text-cream/70 underline-offset-4 hover:text-lime hover:underline">
                <InstagramGlyph /> Rather DM? Find us at @slotback.app
              </a>
            </div>
            <div className="relative min-w-0 rounded-[28px] border border-cream/10 bg-ink/50 p-5 backdrop-blur sm:p-8">
              <DemoForm />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-8">
            <Kicker>Questions</Kicker>
            <h2 className="stretch mt-4 text-[2.5rem] leading-[0.95] [--wdth:105] sm:text-7xl sm:[--wdth:120]">Fair questions.</h2>
            <div className="mt-12">
              <Faq />
            </div>
          </div>
        </section>
      </main>

      <footer className="overflow-hidden border-t border-cream/10 pt-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-cream/60">
            <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="hover:text-lime">
              Instagram
            </a>
            <a href="#demo" className="hover:text-lime">
              Book a demo
            </a>
            <span>Made in Goa</span>
          </div>
        </div>
        <ScrollStretch className="mt-10 -mb-[0.18em] text-center text-[clamp(4rem,19vw,17rem)] leading-none text-lime select-none" from={50} to={130}>
          <span aria-hidden>SLOTBACK</span>
        </ScrollStretch>
      </footer>
    </>
  );
}
