/** Copy for the free Empty Slot Rescue Kit (/resources). Pure functions so the wording is unit-tested. */

export type TemplateInput = { business: string; slot: string };

export type MessageTemplate = {
  key: string;
  title: string;
  when: string;
  render: (input: TemplateInput) => string;
};

const fallback = (input: TemplateInput) => ({
  business: input.business.trim() || "our studio",
  slot: input.slot.trim() || "today",
});

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "offer",
    title: "Offer the open slot to your waitlist",
    when: "Send the moment someone cancels",
    render: (i) => {
      const { business, slot } = fallback(i);
      return `Hi! A slot just opened at ${business}: ${slot}. Want it? Reply YES and it's yours. First reply gets it 🙌`;
    },
  },
  {
    key: "rebook",
    title: "Reply to a client who cancels",
    when: "Keep it warm and rebook them",
    render: () =>
      "No problem at all, thanks for letting us know! Shall I put you on our waitlist for an earlier slot this week, or book your next visit now?",
  },
  {
    key: "reminder",
    title: "24-hour reminder",
    when: "Cuts no-shows the day before",
    render: (i) => {
      const { business } = fallback(i);
      return `Hi! Just a reminder of your appointment at ${business} tomorrow. Reply 1 to confirm or 2 if you need to change it, so we can offer the slot to someone else 🙏`;
    },
  },
  {
    key: "join",
    title: "Ask clients to join your waitlist",
    when: "Say it at checkout or post it on Stories",
    render: (i) => {
      const { business } = fallback(i);
      return `Want an earlier appointment if one opens up? Join the ${business} waitlist and we'll message you first when a slot frees up.`;
    },
  },
  {
    key: "taken",
    title: "Slot taken (to everyone else)",
    when: "So nobody feels ignored",
    render: (i) => {
      const { slot } = fallback(i);
      return `That ${slot} slot has just been taken, sorry! You're still on our waitlist and we'll message you first next time.`;
    },
  },
];

export const NOTICE_OPTIONS = [4, 12, 24, 48] as const;
export type Notice = (typeof NOTICE_OPTIONS)[number];
export type LateRule = "none" | "deposit" | "half" | "full";
export type Tone = "friendly" | "firm";

export const LATE_RULE_LABELS: Record<LateRule, string> = {
  none: "Nothing, just a request",
  deposit: "Deposit is kept",
  half: "50% charge",
  full: "Full charge",
};

export function cancellationPolicy({ notice, rule, tone }: { notice: Notice; rule: LateRule; tone: Tone }): string {
  const friendly = tone === "friendly";
  const lead = friendly
    ? `We keep your time just for you, so we kindly ask for at least ${notice} hours' notice if you need to cancel or reschedule.`
    : `Please give at least ${notice} hours' notice to cancel or reschedule your appointment.`;
  const why = friendly
    ? " That way we can offer the slot to someone on our waitlist."
    : " Late cancellations stop us offering the slot to other clients.";
  const late = `Cancellations with less than ${notice} hours' notice, and no-shows,`;
  const consequence: Record<LateRule, string> = {
    none: friendly
      ? " We don't charge for late cancellations, but we really appreciate the heads-up."
      : " Repeated late cancellations may mean we ask for a deposit next time.",
    deposit: ` ${late} will lose their deposit.`,
    half: ` ${late} will be charged 50% of the service.`,
    full: ` ${late} will be charged the full service price.`,
  };
  const close = friendly
    ? "\n\nRunning late? Message us and we'll do our best to fit you in. Thank you for understanding!"
    : "\n\nIf you're running late, let us know. We may need to shorten your service to stay on time.";
  return lead + why + consequence[rule] + close;
}

export const WEEKLY_CHECKLIST = [
  "Check this week's diary for gaps and quiet slots",
  "Send 24-hour reminders for tomorrow's bookings",
  "Ask every client at checkout if they want to join the waitlist",
  "Post a Story offering any open slots this week",
  "Reply to every cancellation with a rebooking offer",
  "Count last week's late cancellations and no-shows",
  "Tidy the waitlist: remove anyone who no longer wants slots",
  "Thank a regular who gave you good notice",
] as const;
