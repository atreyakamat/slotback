import { ArrowRight, BarChart3, CalendarCheck, Clock, Link2, MessageCircle, ShieldCheck, Smartphone, Users } from "lucide-react";
import { DemoForm } from "@/components/demo-form";
import { Faq } from "@/components/faq";
import { Header } from "@/components/header";
import { HowItWorks } from "@/components/how-it-works";
import { Logo } from "@/components/logo";
import { ProductPreview } from "@/components/product-preview";
import { RecoveryCalc } from "@/components/recovery-calc";
import { Reveal } from "@/components/reveal";

const INSTAGRAM = "https://instagram.com/slotback.app";

const VERTICALS = ["Skin & aesthetic clinics", "Physiotherapy", "Nail & lash studios", "Dental clinics", "Salons & spas"];

const FEATURES = [
  { icon: MessageCircle, title: "WhatsApp offers", body: "Openings go out as a short WhatsApp message with a one-tap claim link." },
  { icon: Users, title: "Smart waitlist", body: "Clients choose the services and times they want. Only matching clients are offered a slot." },
  { icon: Clock, title: "First come, first served", body: "One slot, one booking. Once it's claimed, everyone else is told it's gone." },
  { icon: ShieldCheck, title: "Consent built in", body: "Only clients who opted in are messaged, and every message has an opt-out." },
  { icon: Link2, title: "Works with your tools", body: "Use the built-in schedule, or connect the booking software you already use." },
  { icon: BarChart3, title: "Clear reporting", body: "See every refilled slot and its value, so you know exactly what you got back." },
];

const PILOT = [
  ["Week 1", "Setup", "We add your services, staff and hours with you, and give you a QR poster for your front desk."],
  ["Week 2", "Build your waitlist", "Clients scan the poster or tap a link to say which slots they'd like."],
  ["Weeks 3–4", "Refill cancellations", "Each cancellation is offered to the right clients. You track the results."],
  ["Review", "Decide", "We go through the numbers together. Continue on a monthly plan, or stop. No lock-in."],
];

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-sm font-semibold text-green">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-lg text-muted text-pretty">{body}</p> : null}
    </Reveal>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">
              <span className="size-2 rounded-full bg-lime ring-2 ring-green/20" aria-hidden />
              Now running pilots in Goa
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Fill last-minute cancellations automatically.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted text-pretty">
              When a client cancels, SlotBack offers the slot to your waitlist on WhatsApp. The first person to confirm gets it, and the booking lands on your schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo" className="inline-flex h-12 items-center gap-2 rounded-lg bg-green px-6 font-semibold text-white transition-colors hover:bg-[#1a4434]">
                Book a free demo <ArrowRight className="size-4" />
              </a>
              <a href="#how" className="inline-flex h-12 items-center rounded-lg border border-line bg-surface px-6 font-semibold transition-colors hover:border-ink/30">
                See how it works
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["No app for your clients", "Set up in an afternoon", "No long contracts"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CalendarCheck className="size-4 text-green" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <ProductPreview />
          </Reveal>
        </section>

        {/* Who it's for */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:gap-10">
            <p className="shrink-0 text-sm font-medium text-muted">Built for appointment businesses</p>
            <ul className="flex flex-wrap gap-2">
              {VERTICALS.map((v) => (
                <li key={v} className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm">
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <SectionHead
              eyebrow="The problem"
              title="A late cancellation usually means an empty chair."
              body="Your front desk calls a few regulars, sends some messages, and often runs out of time. The slot stays empty and the revenue is lost."
            />
            <Reveal delay={0.1} className="grid gap-4 self-end sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface p-6">
                <p className="text-sm font-semibold text-red">Without SlotBack</p>
                <ul className="mt-3 grid gap-2 text-muted">
                  <li>Phone calls one by one</li>
                  <li>Messages sent by hand</li>
                  <li>Slot often stays empty</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-green/20 bg-green-soft p-6">
                <p className="text-sm font-semibold text-green">With SlotBack</p>
                <ul className="mt-3 grid gap-2">
                  <li>Two taps to start</li>
                  <li>Waitlist notified at once</li>
                  <li>First to confirm is booked</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <SectionHead eyebrow="How it works" title="Three steps, done in minutes." body="Your staff start it with two taps. Your clients claim the slot with one." />
            <div className="mt-12">
              <HowItWorks />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead eyebrow="Features" title="Everything you need to refill a slot, nothing you don't." />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="bg-surface p-6 sm:p-7">
                <span className="flex size-10 items-center justify-center rounded-lg bg-green-soft text-green">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Calculator */}
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <SectionHead eyebrow="Estimate" title="What could you recover each month?" body="Adjust the numbers to match a typical week at your business." />
            <Reveal delay={0.1} className="mt-12">
              <RecoveryCalc />
            </Reveal>
          </div>
        </section>

        {/* Pilot */}
        <section id="pilot" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead
            eyebrow="Pilot"
            title="Start with a four-week pilot."
            body="A short, assisted trial with a fixed monthly price agreed up front. You decide at the end, based on your own results."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-4">
            {PILOT.map(([when, title, body], i) => (
              <li key={when}>
                <Reveal delay={i * 0.06} className="h-full rounded-2xl border border-line bg-surface p-6">
                  <p className="text-sm font-medium text-green">{when}</p>
                  <h3 className="mt-2 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.6fr]">
            <SectionHead eyebrow="FAQ" title="Common questions" body="Can't find what you're looking for? Ask us during your demo." />
            <Reveal delay={0.1}>
              <Faq />
            </Reveal>
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="scroll-mt-20 bg-green text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <Reveal>
              <p className="text-sm font-semibold text-lime">Book a demo</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">See SlotBack working with your own services.</h2>
              <p className="mt-4 text-lg text-white/75">A 20-minute call. We&apos;ll show you the full flow and answer your questions. No obligation.</p>
              <ul className="mt-8 grid gap-3 text-white/90">
                {["Set up with you, in an afternoon", "Four-week pilot with a clear end date", "Your client list always stays yours"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <CalendarCheck className="size-5 text-lime" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-white/70">
                <Smartphone className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
                Prefer to message? Reach us on Instagram at{" "}
                <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="font-medium text-white underline underline-offset-4">
                  @slotback.app
                </a>
              </p>
            </Reveal>
            <Reveal delay={0.1} className="rounded-2xl bg-surface p-6 text-ink shadow-xl sm:p-8">
              <DemoForm />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-bg">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">Fills last-minute cancellations for salons and clinics. Based in Panjim, Goa.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              <li>
                <a href="#how" className="hover:text-ink">
                  How it works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-ink">
                  Features
                </a>
              </li>
              <li>
                <a href="#pilot" className="hover:text-ink">
                  Pilot
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              <li>
                <a href="#demo" className="hover:text-ink">
                  Book a demo
                </a>
              </li>
              <li>
                <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-ink">
                  <InstagramIcon /> @slotback.app
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">© 2026 SlotBack. Made in Goa.</p>
        </div>
      </footer>
    </>
  );
}
