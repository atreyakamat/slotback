import { Plus } from "lucide-react";

const FAQ = [
  ["Do my clients need to install an app?", "No. They get a WhatsApp message with a link, see the opening, and confirm with one tap."],
  ["Do I have to change my booking software?", "No. You can use SlotBack's simple schedule, or connect the booking tool you already use."],
  ["Will my clients feel spammed?", "Only clients who joined your waitlist and agreed to messages are contacted, and only for openings that match what they asked for. Every message includes an opt-out."],
  ["How do you measure what I get back?", "A refilled slot counts at the price you set for that service. Messages sent are never counted as revenue."],
  ["What does it cost?", "A simple, fixed monthly price, agreed with you before the pilot starts. WhatsApp messaging costs are shown separately, never hidden."],
  ["Who is behind SlotBack?", "A small team based in Panjim, Goa. We set up every pilot business with you, in person or on a call."],
];

export function Faq() {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group px-5 py-4 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-1 font-medium [&::-webkit-details-marker]:hidden">
            {q}
            <Plus className="size-4 shrink-0 text-muted transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <p className="mt-2 max-w-2xl pb-1 text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
