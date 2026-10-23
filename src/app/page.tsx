import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellOff,
  CalendarX2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { BookDemoForm } from "@/components/marketing/book-demo-form";
import { HeroDemo } from "@/components/marketing/hero-demo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  {
    icon: CalendarX2,
    title: "A client cancels",
    body: "Staff mark the appointment cancelled and tap “Cancel and refill”. That's the only manual step.",
  },
  {
    icon: MessageCircle,
    title: "Your waitlist hears first",
    body: "Opted-in clients who fit the service, staff member and time get a secure claim link on WhatsApp or SMS.",
  },
  {
    icon: TrendingUp,
    title: "One taps, you're full again",
    body: "The first to confirm gets the slot. It lands on your schedule and in your recovered revenue.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "First to confirm, guaranteed",
    body: "Even if several clients tap at the same second, exactly one gets the slot. No double bookings, no awkward calls.",
  },
  {
    icon: ShieldCheck,
    title: "Only people who said yes",
    body: "Offers go only to clients who opted in, on the channel they agreed to. Opt-outs are honoured instantly.",
  },
  {
    icon: BellOff,
    title: "Quiet hours built in",
    body: "No messages late at night. Offers wait until morning, and stop well before the appointment starts.",
  },
  {
    icon: Smartphone,
    title: "No app for your clients",
    body: "Clients claim from a simple page that opens from the message. Nothing to download, no account to create.",
  },
  {
    icon: BarChart3,
    title: "Honest numbers",
    body: "See recovered revenue, fill rate and time to refill. Estimated value is kept separate from visits that actually happened.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "Claim links are single-use and expire. Your client list stays yours, and every action is logged.",
  },
];

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
    q: "What does it cost?",
    a: "We're running short, assisted pilots with pricing agreed up front. Messaging costs are shown separately, never hidden inside a vague fee.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-transparent bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="SlotBack home">
            <Logo />
          </Link>
          <nav aria-label="Site" className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Sign in
            </Link>
            <a href="#demo" className={buttonVariants({ size: "sm" })}>
              Book a demo
            </a>
          </div>
        </div>
      </header>

      <main className="overflow-x-clip">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div>
            <p className="text-sm font-medium text-accent">Cancellation recovery for salons, spas and clinics</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Make every opening count.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted text-pretty">
              When a client cancels, SlotBack offers that slot to the right person on your waitlist over WhatsApp or SMS.
              The first to confirm gets it, and you see exactly what you got back.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo" className={buttonVariants({ size: "lg" })}>
                Book a demo <ArrowRight />
              </a>
              <Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                Try the live demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">No setup needed for the demo. It’s a sample Goa salon you can click through.</p>
          </div>
          <HeroDemo />
        </section>

        <section className="border-y bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-2xl font-semibold tracking-tight text-balance">A cancelled slot is revenue you already earned.</h2>
            </div>
            <ul className="grid gap-6 text-sm text-muted sm:grid-cols-3 md:col-span-2">
              <li>
                <p className="font-medium text-foreground">The chair sits empty</p>
                <p className="mt-1">A cancellation a few hours out usually stays unfilled, even with clients who’d happily come in.</p>
              </li>
              <li>
                <p className="font-medium text-foreground">Staff work the phones</p>
                <p className="mt-1">The front desk calls and messages one client at a time, between appointments.</p>
              </li>
              <li>
                <p className="font-medium text-foreground">Nobody knows the cost</p>
                <p className="mt-1">Without numbers, it’s hard to tell how much cancellations take from the month.</p>
              </li>
            </ul>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 max-w-xl text-muted">Two taps for your staff. One tap for your client.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-[var(--radius-card)] border bg-surface p-6">
                <div className="flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-surface-raised text-foreground">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  Step {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="scroll-mt-20 border-y bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Built for a busy front desk</h2>
            <p className="mt-2 max-w-xl text-muted">Calm, simple and careful with your clients’ trust.</p>
            <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Icon className="size-5 text-accent" aria-hidden />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="demo" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-sm font-medium text-accent">Now onboarding in Goa</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">See it refill a real cancellation</h2>
            <p className="mt-3 text-muted text-pretty">
              We’re working with a small group of salons and clinics. In a 20-minute walkthrough we’ll show the full loop on
              your own services, and if it fits, set you up the same week.
            </p>
            <ul className="mt-6 grid gap-2 text-sm">
              <li className="flex gap-2">
                <span className="text-success">✓</span> Setup done with you, in an afternoon
              </li>
              <li className="flex gap-2">
                <span className="text-success">✓</span> Short pilot with a clear end date
              </li>
              <li className="flex gap-2">
                <span className="text-success">✓</span> Your client list stays yours
              </li>
            </ul>
          </div>
          <div className="relative rounded-[var(--radius-card)] border bg-surface p-5 sm:p-7">
            <BookDemoForm />
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-t bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
            <div className="mt-8 divide-y border-y">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    {q}
                    <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="text-foreground" />
            <span>Made in Goa</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
