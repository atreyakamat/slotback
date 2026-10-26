import { SceneId } from "./theme";

// Voiceover lines as spoken. Captions are derived from these, and the
// matching WAVs live in public/audio/vo/<scene>.wav.
export const VO_DELAY = 3;

export const voLines: Record<SceneId, { text: string; seconds: number }> = {
  hook: { text: "Your 4 PM just cancelled.", seconds: 1.49 },
  emptyChair: { text: "And that chair? Empty.", seconds: 1.22 },
  counter: { text: "One cancellation a day costs you about ₹20,000 a month.", seconds: 3.47 },
  calling: { text: "Calling around? Nobody picks up.", seconds: 1.79 },
  logo: { text: "Meet SlotBack.", seconds: 0.83 },
  openSlot: { text: "Mark the slot open. SlotBack texts your waitlist a claim link.", seconds: 3.38 },
  claim: { text: "The link expires fast. First to claim gets the slot.", seconds: 2.77 },
  filled: { text: "Chair filled. Money back.", seconds: 1.14 },
  features: { text: "No app for your clients. Built for salons right here in Goa.", seconds: 3.36 },
  cta: { text: "Book your free demo. Link in bio.", seconds: 1.82 },
};
