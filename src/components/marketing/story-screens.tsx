import { CalendarCheck2, CheckCircle2, Clock, MapPin, MessageCircle, RefreshCcw } from "lucide-react";

/** Step 1: staff cancel and refill in two taps. */
export function StaffScreen() {
  return (
    <div className="flex h-full flex-col p-4 pt-10 text-[12px]">
      <p className="text-[11px] text-brand-ink/65">Appointment</p>
      <p className="mt-0.5 font-display text-lg leading-tight">Divya Parab</p>
      <p className="text-brand-ink/65">Hydrating facial · 2:00 pm · Aisha</p>
      <div className="mt-4 rounded-2xl border border-brand-ink/15 bg-white p-3">
        <p className="font-semibold">Divya can&apos;t make it</p>
        <p className="mt-1 text-brand-ink/65">Offer this opening to the waitlist?</p>
        <div className="mt-3 grid gap-2">
          <span className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-green py-2.5 font-semibold text-brand-cream">
            <RefreshCcw className="size-3.5" aria-hidden /> Cancel and refill
          </span>
          <span className="rounded-xl border border-brand-ink/15 py-2.5 text-center text-brand-ink/65">Cancel without refilling</span>
        </div>
      </div>
      <p className="mt-auto rounded-xl bg-brand-lime/40 p-2.5 text-[11px]">5 waitlisted clients fit this slot.</p>
    </div>
  );
}

/** Step 2: the offer arrives on WhatsApp. */
export function WhatsAppScreen() {
  return (
    <div className="flex h-full flex-col bg-[#ece5dd] pt-8 text-[12px]">
      <div className="flex items-center gap-2 bg-[#075e54] px-3 py-2.5 text-white">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-brand-lime">CV</span>
        <div>
          <p className="font-semibold leading-tight">Casa Verde Salon</p>
          <p className="text-[10px] opacity-80">via SlotBack</p>
        </div>
      </div>
      <div className="m-3 max-w-[88%] rounded-xl rounded-tl-none bg-white p-3 shadow-sm">
        <p>Hi Fatima, an opening just came up at Casa Verde:</p>
        <p className="mt-1.5 font-semibold">Hydrating facial with Aisha, today 2:00 pm.</p>
        <p className="mt-1.5">Tap to claim before 1:00 pm. First to confirm gets it.</p>
        <p className="mt-1.5 break-all text-[#0b6bcb] underline">slotback.app/c/7Hq…</p>
        <p className="mt-1 text-right text-[10px] text-[#667781]">12:24</p>
      </div>
      <div className="mt-auto flex items-center gap-2 p-3 text-[11px] text-brand-ink/65">
        <MessageCircle className="size-3.5" aria-hidden /> Only clients who opted in get offers.
      </div>
    </div>
  );
}

/** Step 3: one tap, booked. */
export function ClaimedScreen() {
  return (
    <div className="flex h-full flex-col p-4 pt-10 text-[12px]">
      <p className="text-[11px] text-brand-ink/65">Casa Verde Salon</p>
      <div className="mt-3 rounded-2xl border border-brand-ink/15 bg-white p-4 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-lime">
          <CheckCircle2 className="size-6 text-brand-ink" aria-hidden />
        </span>
        <p className="mt-3 font-display text-lg leading-tight">You&apos;re booked!</p>
        <p className="mt-1 text-brand-ink/65">See you today, Fatima.</p>
      </div>
      <div className="mt-3 grid gap-2 rounded-2xl border border-brand-ink/15 bg-white p-3 text-[11px]">
        <p className="flex items-center gap-2">
          <CalendarCheck2 className="size-3.5" aria-hidden /> Hydrating facial with Aisha
        </p>
        <p className="flex items-center gap-2">
          <Clock className="size-3.5" aria-hidden /> Today, 2:00 – 3:00 pm
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-3.5" aria-hidden /> Fontainhas, Panaji
        </p>
      </div>
      <p className="mt-auto rounded-xl bg-brand-green p-2.5 text-[11px] text-brand-cream">
        Staff see it on the schedule instantly. <span className="font-semibold text-brand-lime">+₹1,800</span>
      </p>
    </div>
  );
}
