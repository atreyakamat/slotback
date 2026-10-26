const FAQ = [
  ["Do my clients need an app?", "No. They get a WhatsApp or SMS message with a link, see the opening, and confirm with one tap."],
  ["Do I have to change my booking software?", "No. SlotBack can connect to the booking tool you already use, or you can use its simple schedule during the pilot."],
  ["Won't clients feel spammed?", "Only clients who joined your waitlist and agreed to messages are contacted, and only for openings that match what they asked for. Every message has an easy opt-out."],
  ["How do you count what I win back?", "A refilled slot counts at the price you set for that service. We never count a message sent as money earned."],
  ["What does it cost?", "We're running short, assisted pilots with the price agreed up front. Messaging costs are shown separately, never hidden in a vague fee."],
  ["Where are you based?", "Panjim, Goa. We set up every pilot business in person or on a call, in an afternoon."],
];

export function Faq() {
  return (
    <div className="divide-y divide-cream/10 border-y border-cream/10">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium sm:text-xl [&::-webkit-details-marker]:hidden">
            {q}
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-cream/20 text-xl text-lime transition-transform duration-300 group-open:rotate-45 group-open:bg-lime group-open:text-ink" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-4 max-w-2xl text-cream/70">{a}</p>
        </details>
      ))}
    </div>
  );
}
