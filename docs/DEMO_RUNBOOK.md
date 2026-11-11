# Demo runbook

A 10-minute walkthrough for a salon or clinic owner. Works on the production URL or locally.

## Before the meeting (2 minutes)

1. Open the app, click **Try the live demo → Try the demo workspace**.
2. **Settings → Reset demo data.** This gives you a clean salon with today's bookings and a month of history.
3. Keep your phone unlocked. You'll scan a QR code with it.
4. If it's after 11 pm or before 7 am, offers will be held for quiet hours. Change quiet hours in **Settings → General** first, or demo during the day.

## The story

### 1. "This is what cancellations cost you" (1 min)

- **Today** opens on recovered revenue for the last 30 days, fill rate and how fast openings were refilled.
- Point out the two numbers: *recovered* (claimed openings at your service price) vs *completed* (visits that actually happened). We never count a message as money.

### 2. "A client just cancelled" (3 min)

1. **Schedule** → tomorrow → open any afternoon appointment.
2. **Cancel appointment → Cancel and refill.**
3. The campaign page shows who will get the offer and why, in order: people who asked for this exact service first, then whoever joined the waitlist earliest. Open **"not offered, and why"** to show consent and time preferences are respected.
4. Show the exact WhatsApp/SMS text in the preview.
5. Click **Launch: offer to N customers**.

### 3. "Your client's phone buzzes" (2 min)

1. In the **Demo inbox**, open **Open on a phone** and have the owner scan the QR code (or scan it yourself and hand over the phone).
2. They see the opening, the countdown and one button. Tap **Claim this slot**.
3. Back on the laptop, the campaign flips to **Refilled** within a few seconds. Open the appointment: it's on the schedule.
4. Optional: open a second claim link. It says the opening has just been claimed. Only one person can ever win.

### 4. "And you can see it all" (2 min)

- **Analytics**: daily recovered revenue, funnel from cancellation to completed visit, CSV export for their accountant.
- **Settings → Activity**: who did what and when.
- **Settings → General**: lead time, offer window, batch size and quiet hours are theirs to set.

### 5. Close (1 min)

Book a short pilot. Next steps: their services and staff, a starting waitlist (from their regulars), and a date to review results.

## If something goes wrong

| Symptom | Fix |
| --- | --- |
| "No matching customers" on the campaign | Pick a different appointment, or use **Waitlist → Add to waitlist** for a customer who fits. |
| Offers stuck on "Queued" | Quiet hours are active, or the scheduled job isn't running (check `CRON_SECRET`). Click **Offer to next** again during allowed hours. |
| QR code says "localhost" | Set `NEXT_PUBLIC_APP_URL` to the public URL and redeploy. |
| Numbers look odd after lots of practice runs | **Settings → Reset demo data.** |
