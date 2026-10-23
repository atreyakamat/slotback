import { CH, CHAIR, CK, CLAIM, COUNT, CTA, DEMO, GAP, GR, idea, NOTIF, OPEN, PL, RATE, SG, ST, T, TIMER, TK, VS } from "./build";
import { PoolReel } from "./types";

// Pillar 6 · Trends and remixes (13:00 slot). Ideas #103–110.
export const trends: PoolReel[] = [
  ...idea("103", "Reacting to ‘just take deposits bro’", [
    ["story", "“Just take deposits bro”", [
      T(["“Just take", "*deposits bro*”"], 3, "Reacting to advice"),
      T(["Okay but…", "*the chair's still empty.*"], 3),
      CHAIR("Deposit kept.\n~Chair empty.~", "₹200"),
      T(["Deposits = *a fee.*", "Refills = *a client.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["quickfire", "Advice I get, ranked", [
      TK("Advice owners get:", ["“Deposits bro”", "“Strict policy”", "“Call them”", "*“Waitlist”*"]),
      T(["Only one", "*fills the chair.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["rank", "Rating bad business advice", [
      T(["Rating", "*owner advice*"], 3, "1 to 10"),
      RATE("“Just take deposits bro”", 5, "Helps. Doesn't refill."),
      RATE("“Charge full fee”", 2, "Clients leave."),
      RATE("“Use a waitlist”", 9, "Fills the chair."),
    ], { cta: CTA.comment }],
    ["versus", "Deposit guy vs waitlist guy", [
      T(["Deposit guy", "vs *waitlist guy*"], 3),
      VS(["Deposit guy", ["₹200 kept", "Client annoyed", "~Chair empty~"]], ["Waitlist guy", ["₹1,000 kept", "Two happy clients", "*Chair full*"]]),
    ], { cta: CTA.comment }],
    ["chat", "The deposit debate", [
      T(["Every owner group", "*has this debate*"], 3),
      CH([["i", "just take deposits bro"], ["i", "clients hate deposits"], ["o", "why not both + a waitlist? 🤷"], ["i", "…ok that's smart"]], 8),
      ...DEMO(),
    ], { cta: CTA.comment }],
  ]),

  ...idea("104", "This or that: owner edition", [
    ["poll", "This or that: owner edition", [
      T(["This or that:", "*owner edition*"], 3),
      PL("Calls or links?", [["Calls 📞", 18], ["Links 🔗", 82]], 4),
      PL("Deposits or waitlist?", [["Deposits", 35], ["Waitlist", 65]], 4),
      PL("Chai or coffee?", [["Chai ☕", 71], ["Coffee", 29]], 4),
    ], { cta: CTA.comment }],
    ["quickfire", "Rapid this or that", [
      TK("Pick fast:", ["calls / links", "remind / hope", "wait / refill", "*chai / chai*"]),
      T(["Your answers", "*in the comments.*"], 3),
    ], { cta: CTA.comment }],
    ["versus", "Calls or links?", [
      T(["This or that:", "*calls or links?*"], 3),
      VS(["Calls", ["One at a time", "Voicemail", "~40 min~"]], ["Links", ["Everyone at once", "Tap to claim", "*40 sec*"]]),
    ], { cta: CTA.comment }],
    ["chat", "Owner this-or-that", [
      T(["Owner", "*this or that*"], 2),
      CH([["i", "walk-ins or waitlist?"], ["o", "*waitlist*"], ["i", "reminders or hope?"], ["o", "*reminders* 😂"]], 7),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["stages", "This or that, round by round", [
      T(["Round", "*by round*"], 2),
      SG(1, 3, "Round 1", "Calls or *links?*"),
      SG(2, 3, "Round 2", "Hope or *reminders?*"),
      SG(3, 3, "Round 3", "Empty or *refilled?*"),
      CLAIM(),
    ], { cta: CTA.comment }],
  ]),

  ...idea("105", "Things that just make sense", [
    ["list", "Things that just make sense", [
      T(["Things that", "*just make sense*"], 3),
      T(["Reminders", "*24h before.*"], 2),
      T(["Asking for the", "*rebook.*"], 2),
      T(["A *waitlist*", "for full days."], 2),
      T(["Claim links", "*for cancels.*"], 2),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["quickfire", "Makes sense ✓", [
      TK("Just makes sense:", ["reminders ✓", "rebooks ✓", "waitlists ✓", "*claim links ✓*"]),
      CLAIM(),
    ], { cta: CTA.save }],
    ["checklist", "Makes-sense checklist", [
      T(["How many do", "*you do?*"], 3),
      CK(undefined, ["24h *reminders*", "Ask for the *rebook*", "Keep a *waitlist*", "Refill with *one link*"], 7),
      T(["4/4?", "*Respect.*"], 2),
    ], { cta: CTA.comment }],
    ["versus", "Makes sense vs doesn't", [
      T(["Makes sense", "vs *doesn't*"], 3),
      VS(["Doesn't", ["Calling 10 people", "Hoping they show", "“No worries!”"]], ["Makes sense", ["One link", "Reminders", "*“Thursday?”*"]]),
    ], { cta: CTA.save }],
    ["pack", "Little things, big difference", [
      T(["Little things,", "*big difference*"], 3),
      GR("Do these", [["⏰", "24h reminder"], ["🔁", "Ask to rebook"], ["📝", "Waitlist"], ["🔗", "Claim link"]], 6),
      ...DEMO(),
    ], { cta: CTA.save }],
  ]),

  ...idea("106", "Expectation vs reality: Saturday diary", [
    ["versus", "Saturday: expectation vs reality", [
      T(["Saturday diary:", "*expectation vs reality*"], 4),
      VS(["Expectation", ["Booked 9 to 7", "Back-to-back", "*Full*"]], ["Reality", ["3 gaps by noon", "1 no-show", "~Holes~"]], "left"),
      T(["Make reality", "*match the plan.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["story", "Saturday, hour by hour", [
      T(["Saturday.", "*Fully booked.*"], 3),
      GAP("9 AM.\n*Perfect.*", "booked"),
      GAP("11 AM.\n~Cancel.~", "broken"),
      T(["Plot twist:", "*waitlist.*"], 2),
      GAP("11:06.\n*Refilled.*", "refilled"),
    ], { cta: CTA.demo }],
    ["quickfire", "Saturday mood swings", [
      TK("Saturday:", ["FULL 😎", "cancel 😐", "cancel 😩", "*refilled 😎*"]),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["numbers", "Saturday gaps, priced", [
      T(["3 Saturday gaps,", "*priced*"], 3),
      COUNT("Example: ₹1,200 a slot", [[1200, "Gap 1"], [2400, "Gap 2"], [3600, "Gap 3"]], "~One Saturday.~", 6),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["poll", "How many gaps last Saturday?", [
      T(["Be honest:", "*gaps last Saturday?*"], 3),
      PL("Vote 👇", [["0 😎", 19], ["1–2", 53], ["3+ 😩", 28]]),
      ...DEMO(),
    ], { cta: CTA.comment }],
  ]),

  ...idea("107", "Get ready with me (to lose ₹2,000 at 4 PM)", [
    ["story", "GRWM to lose ₹2,000 at 4 PM", [
      T(["Get ready with me", "to lose *₹2,000*", "at 4 PM"], 4, "GRWM"),
      TK("Prep:", ["station ✓", "colour mixed ✓", "towels ✓", "playlist ✓"]),
      NOTIF("3:55 PM.", "omg so sorry can't come 🙏", "3:55"),
      T(["~Ready for nothing.~"], 2),
      T(["Next time:", "*ready for the waitlist.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["quickfire", "GRWM speedrun", [
      TK("GRWM:", ["Chair", "Colour", "Towels", "~Cancelled~"]),
      T(["Don't waste the prep.", "*Refill.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["numbers", "What the prep cost", [
      T(["What getting ready", "*actually cost*"], 3),
      ST("Colour mixed (wasted)", 400, ""),
      ST("Slot value", 2000, "~Gone at 3:55.~"),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["stages", "GRWM: the twist", [
      T(["GRWM", "*(with a twist)*"], 3),
      SG(1, 3, "Prep", "Everything ready."),
      SG(2, 3, "3:55", "~Cancelled.~"),
      SG(3, 3, "3:56", "*Waitlist claims it.*"),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["chat", "The 3:55 GRWM ending", [
      T(["GRWM ends", "*like this*"], 3),
      CH([["i", "so sorry!! can't come 😭"], ["o", "no problem! offering it to the waitlist 💚"]], 5),
      CLAIM("And someone\n*walks in at 4.*"),
    ], { cta: CTA.demo }],
  ]),

  ...idea("108", "Starter pack: salon owner", [
    ["pack", "Salon owner starter pack", [
      T(["Starter pack:", "*salon owner*"], 3),
      GR("You have all 6", [["💡", "Ring light"], ["📱", "47 chats"], ["☕", "Cold chai"], ["🪑", "Empty 4 PM"], ["📒", "Paper diary"], ["🙏", "“So sorry” texts"]], 7),
      T(["Swap one:", "*empty 4 PM → full.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["quickfire", "Starter pack items", [
      TK("Starter pack:", ["ring light", "cold chai", "47 chats", "*empty 4 PM*"]),
      T(["Tag an owner", "*who has all four.*"], 3),
    ], { cta: "Tag an owner below 👇" }],
    ["checklist", "Check your starter pack", [
      T(["How many", "*do you have?*"], 3),
      CK(undefined, ["A *ring light*", "*Cold* chai", "A *paper* diary", "An *empty* 4 PM"], 7),
      T(["Let's lose", "*the last one.*"], 3),
    ], { cta: CTA.comment }],
    ["pack", "Clinic owner starter pack", [
      T(["Starter pack:", "*clinic owner*"], 3),
      GR("Clinic edition", [["🩺", "Spare gloves"], ["📋", "Sticky notes"], ["⏰", "Running late"], ["🪑", "Empty 5 PM"]], 6),
      ...DEMO("A 5:00 PM session"),
    ], { cta: CTA.comment }],
    ["versus", "Starter pack vs pro pack", [
      T(["Starter pack", "vs *pro pack*"], 3),
      VS(["Starter", ["Paper diary", "Calling clients", "Empty 4 PM"]], ["Pro", ["Waitlist", "Claim links", "*Full 4 PM*"]]),
    ], { cta: CTA.demo }],
  ]),

  ...idea("109", "Duet this if you had a no-show this week", [
    ["story", "Duet this if you had a no-show", [
      T(["Duet this if you had", "*a no-show this week*"], 4),
      CHAIR("Show us\n*your empty chair.*", "NO-SHOW"),
      T(["Then show us", "*your fix.*"], 3),
      ...DEMO(),
    ], { cta: "Duet this 👇" }],
    ["quickfire", "No-show this week?", [
      TK("No-shows this week:", ["1", "2", "3", "*duet it*"]),
      T(["Let's see", "*your empty chairs.*"], 3),
    ], { cta: "Duet this 👇" }],
    ["poll", "No-shows this week?", [
      T(["How many no-shows", "*this week?*"], 3),
      PL("Vote, then duet", [["0 😇", 22], ["1–2", 51], ["3+ 💀", 27]]),
    ], { cta: "Duet this 👇" }],
    ["chat", "Duet chain", [
      T(["The duet chain", "*starts here*"], 3),
      CH([["i", "had 2 no-shows this week 😩"], ["i", "3 here 💀"], ["i", "1 but it was a 3-hour colour"], ["o", "*duet with your fix*"]], 8),
    ], { cta: "Duet this 👇" }],
    ["stages", "Duet challenge", [
      T(["Duet", "*challenge*"], 2),
      SG(1, 3, "Step 1", "Show your *empty chair.*"),
      SG(2, 3, "Step 2", "Say *the excuse.*"),
      SG(3, 3, "Step 3", "Show *your fix.*"),
      ...DEMO(),
    ], { cta: "Duet this 👇" }],
  ]),

  ...idea("110", "Can we fill this slot before the song ends?", [
    ["demo", "Fill this slot before the song ends", [
      T(["Can we fill this slot", "*before the song ends?*"], 4, "Challenge"),
      NOTIF("Go.", "can't make it sorry", "2:10"),
      OPEN("0:03\n*Sent.*"),
      TIMER("Beat\n*the song.*"),
      CLAIM("*Filled.*", "A 3:00 PM slot"),
    ], { cta: CTA.demo }],
    ["quickfire", "15-second refill challenge", [
      TK("Challenge:", ["15", "10", "5", "*Filled*"]),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["numbers", "Song: 15s. Refill: ?", [
      T(["Song length: *15s*", "Refill time: *?*"], 3),
      ST("Refill time", 12, "*Under the song.*", "", "s"),
      CLAIM(),
    ], { cta: CTA.demo, badge: "Example timing" }],
    ["versus", "Song vs refill", [
      T(["Who wins:", "*the song or the refill?*"], 3),
      VS(["Song", ["15 seconds"]], ["Refill", ["*12 seconds*"]]),
      CLAIM(),
    ], { cta: CTA.demo, badge: "Example timing" }],
    ["stages", "Race the beat", [
      T(["Race", "*the beat*"], 2),
      SG(1, 3, "Drop", "Client cancels."),
      SG(2, 3, "Build", "Waitlist pinged."),
      SG(3, 3, "Hook", "*Slot claimed.*"),
      CLAIM(),
    ], { cta: CTA.demo }],
  ]),
];
