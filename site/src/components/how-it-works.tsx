import { Reveal } from "./reveal";

function StaffTap() {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-sm">
      <div className="flex items-center justify-between">
        <span>
          <span className="block font-medium">10:00 Hair spa</span>
          <span className="block text-xs text-muted">Ananya D. · cancelled</span>
        </span>
        <span className="rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-white">Refill slot</span>
      </div>
    </div>
  );
}

function WhatsAppOffer() {
  return (
    <div className="rounded-xl bg-[#efeae2] p-3 text-sm">
      <div className="max-w-[92%] rounded-lg rounded-tl-none bg-white p-2.5 shadow-sm">
        <p>Hi Priya, a Hair spa slot opened today at 10:00 with Shilpa. Would you like it?</p>
        <p className="mt-2 border-t border-line pt-2 text-center text-xs font-medium text-[#027eb5]">Claim this slot</p>
      </div>
    </div>
  );
}

function Booked() {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-green-soft text-green">✓</span>
        <span>
          <span className="block font-medium">Booked: Priya K.</span>
          <span className="block text-xs text-muted">10:00 Hair spa · others notified</span>
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  { n: "1", title: "A client cancels", body: "Your staff open the appointment and tap Refill slot. No calls, no group messages.", art: <StaffTap /> },
  {
    n: "2",
    title: "Your waitlist is notified",
    body: "Clients who asked for that service and time, and who agreed to messages, get a WhatsApp with a link.",
    art: <WhatsAppOffer />,
  },
  { n: "3", title: "The first to confirm gets it", body: "The slot is booked on your schedule, and everyone else is told it has been taken.", art: <Booked /> },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <li key={s.n}>
          <Reveal delay={i * 0.08} className="flex h-full flex-col rounded-2xl border border-line bg-[#f6f4ee] p-5 sm:p-6">
            <span className="flex size-8 items-center justify-center rounded-full bg-green text-sm font-semibold text-white">{s.n}</span>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-muted">{s.body}</p>
            <div className="mt-auto pt-6">{s.art}</div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
