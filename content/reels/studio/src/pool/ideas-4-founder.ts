import { CH, CHAIR, CK, CLAIM, COUNT, CTA, DEMO, idea, NOTIF, OPEN, PL, RK, SG, ST, T, TK, VS } from "./build";
import { PoolReel } from "./types";

// Pillar 4 · Founder and build-in-public (19:30 slot). Ideas #87–93.
// #94 (first pilot yes) is left out until it really happens.
// Nothing here claims customers, quotes or results we don't have.
export const founder: PoolReel[] = [
  ...idea("87", "I'm building an app for Goa salons. Day 1", [
    ["story", "Building for Goa salons: Day 1", [
      T(["I'm building an app", "for *Goa salons.*"], 4, "Day 1"),
      T(["The problem:", "*last-minute cancels.*"], 3),
      CHAIR("Every week:\n~empty chairs.~", "EMPTY"),
      T(["The idea:", "*your waitlist gets a link.*"], 3),
      ...DEMO(),
      T(["Follow along.", "*Day 2 tomorrow.*"], 3),
    ], { cta: CTA.follow }],
    ["quickfire", "Day 1 in 10 seconds", [
      TK("Day 1:", ["Idea", "Sketch", "Code", "*SlotBack*"]),
      T(["One job:", "*fill cancelled slots.*"], 3),
      OPEN(),
    ], { cta: CTA.follow }],
    ["checklist", "Day 1 to-do list", [
      T(["Startup Day 1", "*to-do list*"], 3),
      CK(undefined, ["Name it: *SlotBack*", "Logo: *✓*", "First demo: *✓*", "First salon visit: *this week*"], 7),
      T(["Want to be", "*the first?*"], 3),
    ], { cta: CTA.demo }],
    ["poll", "Should I build this?", [
      T(["Building an app", "for cancelled slots.", "*Should I?*"], 4),
      PL("Be honest 👇", [["Yes, I need it", 58], ["Maybe", 27], ["No", 15]]),
      T(["Comment why.", "*I read every one.*"], 3),
    ], { cta: CTA.comment, badge: "Poll · tell us below" }],
    ["stages", "From idea to Day 1", [
      T(["How SlotBack", "*started*"], 3),
      SG(1, 3, "Saw it", "An *empty chair* at 4 PM."),
      SG(2, 3, "Asked", "“Does this happen *a lot?*”"),
      SG(3, 3, "Built", "*SlotBack.*"),
      ...DEMO(),
    ], { cta: CTA.follow }],
  ]),

  ...idea("88", "Why I built SlotBack", [
    ["story", "Why I built SlotBack", [
      T(["Why I built", "*SlotBack*"], 3),
      NOTIF("It started with this.", "so sorry can't make it 🙏", "3:52"),
      CHAIR("And this.", "EMPTY"),
      T(["Someone was *waiting*", "for that exact slot."], 3),
      T(["They just", "*never heard.*"], 3),
      ...DEMO(),
    ], { cta: CTA.follow }],
    ["quickfire", "The why, fast", [
      TK("Built it because:", ["empty chairs", "wasted hours", "lost ₹", "*waiting clients*"]),
      T(["Connect the cancel", "*to the waitlist.*"], 3),
      CLAIM(),
    ], { cta: CTA.follow }],
    ["versus", "The gap I saw", [
      T(["The gap", "*I couldn't unsee*"], 3),
      VS(["One side", ["Owner with", "an empty 4 PM"]], ["Other side", ["Client wanting", "*any slot today*"]], undefined),
      T(["They never", "*found each other.*"], 3),
      ...DEMO(),
    ], { cta: CTA.follow }],
    ["numbers", "The maths that convinced me", [
      T(["The maths that", "*made me build this*"], 3),
      COUNT("Example: ₹1,000 a slot", [[1000, "One cancel"], [26000, "One a day, a month"], [312000, "A year"]], "~From one chair.~", 7),
    ], { cta: CTA.follow }],
    ["checklist", "What SlotBack had to be", [
      T(["SlotBack had to be", "*dead simple*"], 3),
      CK(undefined, ["*One tap* for the owner", "*No app* for clients", "*First tap* wins", "Works on *WhatsApp-first* Goa"], 7),
    ], { cta: CTA.demo }],
  ]),

  ...idea("89", "Asking 15 Goa owners about cancellations", [
    ["story", "I'm asking 15 Goa owners", [
      T(["I'm asking", "*15 Goa owners*", "about cancellations"], 4),
      CK("My 3 questions", ["How many cancels *a week?*", "What do you do *right after?*", "How many *get refilled?*"], 7),
      T(["Own a salon or clinic?", "*Be one of the 15.*"], 3),
    ], { cta: "DM “15” to take part" }],
    ["poll", "Answer question 1", [
      T(["Question 1:", "*How many cancels*", "do you get a week?"], 4),
      PL("Owners, vote 👇", [["0–2", 33], ["3–5", 33], ["6+", 34]]),
      T(["I'll share", "*what I learn.*"], 3),
    ], { cta: CTA.comment, badge: "Poll · tell us below" }],
    ["quickfire", "3 questions, 15 owners", [
      TK("Asking owners:", ["How many?", "What then?", "*Refilled?*"]),
      T(["Results soon.", "*Follow along.*"], 3),
    ], { cta: CTA.follow }],
    ["chat", "How I'm asking", [
      T(["How I'm asking", "*owners in Goa*"], 3),
      CH([["o", "Hi! I'm researching last-minute cancellations in Goa. Can I ask you 3 quick questions? ☕"], ["o", "No pitch, promise."]], 5),
      T(["Want to help?", "*DM me.*"], 3),
    ], { cta: "DM “15” to take part" }],
    ["checklist", "What I want to learn", [
      T(["What I want", "*to learn*"], 3),
      CK(undefined, ["Which days are *worst*", "Who *refills* and how", "What owners *already tried*", "What would make it *easy*"], 7),
    ], { cta: CTA.follow }],
  ]),

  ...idea("90", "Things I got wrong building SlotBack", [
    ["list", "Things I got wrong", [
      T(["Things I got wrong", "*building SlotBack*"], 3, "Honest"),
      RK(1, "I thought owners", "*wanted an app.* They want WhatsApp."),
      RK(2, "I thought deposits", "*solved it.* They don't refill."),
      RK(3, "I thought it was", "*a salon thing.* Clinics too."),
      T(["Still learning.", "*Tell me what I'm missing.*"], 3),
    ], { cta: CTA.comment }],
    ["quickfire", "Wrong, wrong, right", [
      TK("My guesses:", ["~wrong~", "~wrong~", "~wrong~", "*right*"]),
      T(["Right one:", "*fill the slot, fast.*"], 3),
      ...DEMO(),
    ], { cta: CTA.follow }],
    ["versus", "What I thought vs what's true", [
      T(["What I thought", "vs *what's true*"], 3),
      VS(["Thought", ["Owners want features", "Clients want apps", "Salons only"]], ["True", ["Owners want *time*", "Clients want *a link*", "*Any appointment*"]]),
    ], { cta: CTA.follow }],
    ["stages", "Lessons, one by one", [
      T(["3 lessons,", "*one week in*"], 3),
      SG(1, 3, "Simple", "One tap beats ten features."),
      SG(2, 3, "Local", "Goa runs on *WhatsApp.*"),
      SG(3, 3, "Listen", "Owners know *best.*"),
    ], { cta: CTA.follow }],
    ["poll", "What should I build next?", [
      T(["What should", "*SlotBack do next?*"], 3),
      PL("Vote 👇", [["Reminders", 41], ["Deposits", 22], ["Reviews", 37]]),
      T(["Comment", "*your idea.*"], 2),
    ], { cta: CTA.comment, badge: "Poll · tell us below" }],
  ]),

  ...idea("91", "Visiting salons in Panaji to show a demo", [
    ["story", "Showing demos in Panaji", [
      T(["This week I'm visiting", "*Panaji salons*", "with a demo"], 4),
      TK("Bringing:", ["laptop", "phone", "flyers", "*chai money*"]),
      ...DEMO(),
      T(["Want me to", "*stop by yours?*"], 3),
    ], { cta: CTA.demo }],
    ["quickfire", "Demo day route", [
      TK("Route:", ["Panaji", "Porvorim", "Mapusa", "*yours?*"]),
      T(["5-minute demo.", "*No pressure.*"], 3),
      OPEN(),
    ], { cta: CTA.demo }],
    ["checklist", "What a demo looks like", [
      T(["What happens in", "*a 5-min demo*"], 3),
      CK(undefined, ["I show *one cancel*", "We *refill it* live", "You ask *anything*", "I leave. *No hard sell.*"], 7),
    ], { cta: CTA.demo }],
    ["chat", "Book a demo visit", [
      T(["Book a", "*demo visit*"], 3),
      CH([["i", "DEMO"], ["o", "Hi! When's a quiet 10 minutes at your salon this week? I'll come by 🛵"], ["i", "thursday 3pm?"], ["o", "*See you Thursday!*"]], 7),
    ], { cta: CTA.demo }],
    ["poll", "Which area next?", [
      T(["Which area", "*should I visit next?*"], 3),
      PL("Vote 👇", [["Margao", 34], ["Mapusa", 30], ["Vasco", 36]]),
      T(["Comment your", "*salon's area.*"], 3),
    ], { cta: CTA.comment, badge: "Poll · tell us below" }],
  ]),

  ...idea("92", "A day building a startup in Goa", [
    ["story", "A day building a startup in Goa", [
      T(["A day building", "*a startup in Goa*"], 3),
      TK("Today:", ["9 AM code", "12 PM calls", "3 PM salon visit", "6 PM sunset", "*9 PM code*"]),
      ...DEMO(),
      T(["Worth it.", "*Every day.*"], 2),
    ], { cta: CTA.follow }],
    ["quickfire", "Startup life, Goa edition", [
      TK("Goa startup life:", ["Beach café wifi", "Scooter meetings", "Power cut", "*Ship anyway*"]),
      T(["Building SlotBack", "*for Goa owners.*"], 3),
    ], { cta: CTA.follow }],
    ["checklist", "Today's to-do", [
      T(["Today's", "*to-do*"], 2),
      CK(undefined, ["Fix the *claim page*", "Visit *2 salons*", "Answer *DMs*", "Watch *the sunset* (mandatory)"], 7),
    ], { cta: CTA.follow }],
    ["versus", "Expectation vs reality", [
      T(["Startup in Goa:", "*expectation vs reality*"], 3),
      VS(["Expectation", ["Beach laptop", "Chill vibes"]], ["Reality", ["Laptop at home", "Owner calls", "*Shipping daily*"]]),
    ], { cta: CTA.follow }],
    ["stages", "Morning to midnight", [
      T(["Morning", "*to midnight*"], 2),
      SG(1, 4, "9 AM", "Code."),
      SG(2, 4, "1 PM", "Salon visits."),
      SG(3, 4, "6 PM", "Sunset break."),
      SG(4, 4, "11 PM", "*Ship it.*"),
    ], { cta: CTA.follow }],
  ]),

  ...idea("93", "You asked: is SlotBack free?", [
    ["chat", "Is SlotBack free?", [
      T(["You asked:", "*is SlotBack free?*"], 3),
      CH([["i", "is slotback free??"], ["o", "The *demo is free*, always. Then you try it with your own cancels before paying anything big 💚"]], 6),
      T(["DM “DEMO”", "*to see it first.*"], 3),
    ], { cta: CTA.demo }],
    ["quickfire", "Free demo, no catch", [
      TK("Demo cost:", ["₹5,000?", "₹500?", "₹50?", "*Free*"]),
      T(["See it refill", "*your* cancels."], 3),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["numbers", "Cost vs what it saves", [
      T(["Think about it", "*this way*"], 3),
      ST("One refilled slot (example)", 1000, "Kept."),
      T(["If it refills *one* slot,", "*it's paid for itself.*"], 4),
    ], { cta: CTA.demo }],
    ["checklist", "What's free", [
      T(["What's", "*free*"], 2),
      CK(undefined, ["The *demo*", "The *Rescue Kit* tools", "Your *questions*", "Pilot details: *in DMs*"], 6),
    ], { cta: CTA.demo }],
    ["poll", "What would you pay?", [
      T(["If it refilled", "*4 slots a month*,", "what's fair?"], 4),
      PL("Vote 👇", [["₹299/mo", 34], ["₹499/mo", 41], ["₹999/mo", 25]]),
      T(["Telling us helps.", "*Comment below.*"], 3),
    ], { cta: CTA.comment, badge: "Poll · tell us below" }],
  ]),
];
