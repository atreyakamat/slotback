import Link from "next/link";
import { ArrowRight, CalendarX2, MessageCircle, TrendingUp } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  { icon: CalendarX2, title: "A client cancels", body: "Staff taps Cancel. SlotBack checks if the opening can be refilled." },
  {
    icon: MessageCircle,
    title: "Your waitlist hears first",
    body: "Opted-in customers who fit the slot get a secure link on WhatsApp or SMS.",
  },
  { icon: TrendingUp, title: "One taps, you're full again", body: "The first to claim gets it. You see the revenue recovered." },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex h-16 items-center justify-between">
        <Logo />
        <Link href="/login" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16">
        <p className="text-sm font-medium text-accent">Cancellation recovery for salons and clinics</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Make every opening count.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted text-pretty">
          When an appointment gets cancelled, SlotBack offers that opening to the right waitlisted customer, without
          staff calling everyone manually.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Try the live demo <ArrowRight />
          </Link>
        </div>

        <ol className="mt-16 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-[var(--radius-card)] border bg-surface p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <Icon className="size-4 text-foreground" aria-hidden />
                Step {i + 1}
              </div>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </main>

      <footer className="flex h-16 items-center text-xs text-muted">© SlotBack · Made in Goa</footer>
    </div>
  );
}
