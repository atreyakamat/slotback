import { CALLS, CARD, CH, CHAIR, CK, CLAIM, COUNT, CTA, DEMO, GR, idea, NOTIF, OPEN, PL, RK, SG, ST, T, TK, VS } from "./build";
import { PoolReel } from "./types";

// Pillar 8 · Borrowed from competitors. C1–C14, minus C4 and C6,
// which need real pilot numbers.
export const borrowed: PoolReel[] = [
  ...idea("C1", "A barber's worst Tuesday", [
    ["story", "A barber's worst Tuesday", [
      T(["A barber's", "*worst Tuesday*"], 3, "POV"),
      NOTIF("10:02 AM.", "bro can't come today", "10:02"),
      NOTIF("12:40 PM.", "something came up 🙏", "12:40"),
      NOTIF("3:15 PM.", "next week pakka", "3:15"),
      CHAIR("Three chairs.\n~Three gaps.~", "TUESDAY"),
      ...DEMO("A 3:30 PM fade"),
    ], { cta: CTA.share }],
    ["quickfire", "Tuesday, cancel by cancel", [
      TK("Tuesday:", ["10 AM ✕", "12 PM ✕", "3 PM ✕", "*refilled ✓*"]),
      CLAIM("3 PM\n*refilled.*", "A 3:00 PM fade"),
    ], { cta: CTA.demo }],
    ["numbers", "The worst Tuesday, priced", [
      T(["The worst Tuesday,", "*priced*"], 3),
      COUNT("Example: ₹400 a cut", [[400, "Cancel 1"], [800, "Cancel 2"], [1200, "Cancel 3"]], "~One Tuesday.~", 6),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["chat", "The barber's Tuesday DMs", [
      T(["The barber's", "*Tuesday DMs*"], 3),
      CH([["i", "bro can't come today"], ["i", "bro sorry"], ["i", "bro next week pakka"], ["o", "bro 💀"]], 7),
      ...DEMO("A 3:30 PM fade"),
    ], { cta: CTA.share }],
    ["stages", "Barber Tuesday stages", [
      T(["Barber Tuesday", "*in 3 stages*"], 3),
      SG(1, 3, "Morning", "~First cancel.~"),
      SG(2, 3, "Lunch", "~Second cancel.~"),
      SG(3, 3, "Evening", "*Refilled all three.*"),
      CLAIM(),
    ], { cta: CTA.demo }],
  ]),

  ...idea("C2", "Your bookings happen at 11 PM", [
    ["story", "Your bookings happen at 11 PM", [
      T(["Your bookings", "happen at *11 PM.*"], 4),
      T(["Your front desk", "~doesn't.~"], 3),
      CH([["i", "hi! any slot tomorrow morning?"], ["i", "hello?"], ["i", "ok will try elsewhere"]], 6, "11:04 PM"),
      T(["A link", "*never sleeps.*"], 3),
      CLAIM("11:05 PM\n*Booked.*", "A 10:00 AM slot tomorrow"),
    ], { cta: CTA.demo }],
    ["quickfire", "When clients actually book", [
      TK("Clients message at:", ["7 AM", "1 PM", "11 PM", "*2 AM*"]),
      T(["Be bookable", "*while you sleep.*"], 3),
    ], { cta: CTA.demo }],
    ["versus", "Front desk vs link", [
      T(["11 PM request.", "*Who answers?*"], 3),
      VS(["Front desk", ["Asleep", "Replies at 10 AM", "~Client gone~"]], ["Link", ["Awake", "Instant", "*Booked*"]]),
    ], { cta: CTA.demo }],
    ["numbers", "The after-hours DMs", [
      T(["How many DMs", "*after closing?*"], 3),
      ST("After-hours requests a week", 9, "~Most lost by morning.~", "", ""),
      CLAIM(),
    ], { cta: CTA.demo, badge: "Example numbers" }],
    ["chat", "The 11 PM DM", [
      T(["The DM you", "*see at 9 AM*"], 3),
      CH([["i", "11:02 PM · any cancellation tomorrow?"], ["o", "9:14 AM · sorry, just saw this!"], ["i", "already booked elsewhere 😕"]], 6),
      T(["Let the waitlist", "*answer for you.*"], 3),
    ], { cta: CTA.demo }],
  ]),

  ...idea("C3", "Front desk on the phone for 40 minutes", [
    ["story", "Front desk on the phone for 40 minutes", [
      T(["Front desk:", "*on the phone*", "for 40 minutes"], 4),
      CALLS("Minute 1–15", ["Riya", "Sana", "Meera"]),
      CALLS("Minute 16–40", ["Kavya", "Tara", "Neha"]),
      T(["Meanwhile at the desk:", "~3 walk-ins waiting.~"], 3),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["numbers", "40 minutes, priced", [
      T(["40 minutes of calls", "*costs more than you think*"], 4),
      ST("Phone minutes per cancel", 40, "", "", " min"),
      ST("× cancels a week", 5, "*= 3+ hours.*", "", ""),
      ...DEMO(),
    ], { cta: CTA.demo, badge: "Example numbers" }],
    ["quickfire", "Ring ring ring", [
      TK("Front desk:", ["ring", "ring", "voicemail", "ring", "*enough*"]),
      OPEN("One tap.\n*Phone down.*"),
    ], { cta: CTA.demo }],
    ["versus", "Receptionist: before vs after", [
      T(["Your receptionist", "*before vs after*"], 3),
      VS(["Before", ["40 min calling", "Stressed", "~Slot empty~"]], ["After", ["1 tap", "Greets walk-ins", "*Slot full*"]]),
    ], { cta: CTA.demo }],
    ["stages", "The 40-minute call marathon", [
      T(["The call", "*marathon*"], 2),
      SG(1, 4, "Min 5", "No answer."),
      SG(2, 4, "Min 15", "“Call you back.”"),
      SG(3, 4, "Min 30", "Voicemail full."),
      SG(4, 4, "Min 40", "~Gave up.~"),
      ...DEMO(),
    ], { cta: CTA.demo }],
  ]),

  ...idea("C5", "Bring a salon friend", [
    ["story", "Know an owner who needs this?", [
      T(["Know an owner who", "*loses slots to cancels?*"], 4),
      T(["Send them", "*this reel.*"], 3),
      ...DEMO(),
      T(["They'll thank you", "*at 4 PM.*"], 3),
    ], { cta: CTA.share }],
    ["quickfire", "Tag a friend", [
      TK("Tag an owner who:", ["calls 10 people", "hates 3:52 PM", "has empty Tuesdays", "*needs this*"]),
    ], { cta: "Tag an owner below 👇" }],
    ["chat", "Send this to a friend", [
      T(["Owners helping", "*owners*"], 3),
      CH([["o", "saw this, thought of your 4 PM cancels 😂"], ["i", "LOL how did you know"], ["i", "sending to my sister's salon too"]], 6),
      ...DEMO(),
    ], { cta: CTA.share }],
    ["checklist", "Send this to someone who…", [
      T(["Send this to", "*someone who…*"], 3),
      CK(undefined, ["Owns a *salon or clinic*", "Complains about *no-shows*", "Has a *waitlist* they never use", "Deserves *full chairs*"], 7),
    ], { cta: CTA.share }],
    ["poll", "Who do you know?", [
      T(["Who do you know", "*who needs this?*"], 3),
      PL("Pick one", [["A salon owner", 46], ["A clinic owner", 31], ["Me, it's me", 23]]),
    ], { cta: CTA.share }],
  ]),

  ...idea("C7", "Free toolkit for Goa owners", [
    ["demo", "Free toolkit for Goa owners", [
      T(["Free toolkit", "for *Goa owners*"], 3, "No sign-up"),
      GR("What's inside", [["🧮", "Cost calculator"], ["💬", "Message templates"], ["📜", "Policy writer"], ["✅", "Weekly checklist"]], 6),
      T(["All free.", "*Link in bio.*"], 3),
    ], { cta: CTA.kit }],
    ["numbers", "Calculator preview", [
      T(["Try the", "*cost calculator*"], 3),
      ST("Lost per year (example)", 144000, "₹1,000 × 3 a week × 48 weeks"),
      ST("Back if you refill half", 72000, "*Try your numbers.*"),
    ], { cta: CTA.kit }],
    ["chat", "Templates preview", [
      T(["Copy-paste messages", "*that win slots back*"], 3),
      CH([["o", "Hi! A 4:30 PM slot just opened today. Want it? First reply gets it 🙌"], ["o", "Can't make it? Just reply and we'll give it to our waitlist 💚"]], 6),
      T(["5 templates.", "*Free.*"], 3),
    ], { cta: CTA.kit }],
    ["checklist", "The Monday reset", [
      T(["The Monday", "*no-show reset*"], 3, "Free checklist"),
      CK(undefined, ["Check last week's *no-shows*", "Message *flaky* clients", "Top up your *waitlist*", "Send *tomorrow's reminders*"], 7),
    ], { cta: CTA.kit }],
    ["quickfire", "4 tools, 0 rupees", [
      TK("Free tools:", ["calculator", "templates", "policy", "checklist", "*₹0*"]),
      T(["Link", "*in bio.*"], 2),
    ], { cta: CTA.kit }],
  ]),

  ...idea("C8", "Owner tip of the week", [
    ["list", "Owner tip: ask for the rebook", [
      T(["Owner tip", "*of the week*"], 3, "Tip #1"),
      T(["When someone cancels,", "*ask for the rebook.*"], 3),
      CH([["i", "sorry can't make it"], ["o", "No problem! *Thursday 5 PM* instead?"]], 5),
      T(["Every Monday.", "*Follow for #2.*"], 3),
    ], { cta: CTA.follow }],
    ["quickfire", "Tip: remind 24h before", [
      T(["Owner tip", "*of the week*"], 2, "Tip #2"),
      TK("Remind:", ["1 week? no", "3 days? meh", "*24h ✓*"]),
      T(["Early cancels", "*are refillable.*"], 3),
    ], { cta: CTA.follow }],
    ["checklist", "Tip: the 15-minute rule", [
      T(["Owner tip", "*of the week*"], 2, "Tip #3"),
      CK("The 15-minute rule", ["Late 15 min? *Slot goes to the waitlist.*", "Tell clients *before* they book", "Be *kind* about it"], 6),
    ], { cta: CTA.follow }],
    ["numbers", "Tip: know your refill rate", [
      T(["Owner tip", "*of the week*"], 2, "Tip #4"),
      ST("Cancels refilled (example)", 20, "~Most owners: 20%.~", "", "%"),
      T(["Aim for", "*70%.*"], 2),
    ], { cta: CTA.follow }],
    ["story", "Tip: build the waitlist at checkout", [
      T(["Owner tip", "*of the week*"], 2, "Tip #5"),
      T(["Ask at checkout:", "*“Want earlier slots?”*"], 3),
      CLAIM(),
    ], { cta: CTA.follow }],
  ]),

  ...idea("C9", "Live with a Goa salon owner", [
    ["story", "Going live with a Goa owner", [
      T(["Going *Live*", "with a Goa salon owner"], 4, "Coming soon"),
      CK("We'll talk about", ["Their *worst* cancel story", "How they *handle* no-shows", "Your *questions*"], 6),
      T(["Drop your questions", "*below.*"], 3),
    ], { cta: CTA.comment }],
    ["quickfire", "Live: save the date", [
      TK("Instagram Live:", ["owner stories", "no-show fixes", "your Qs", "*20 min*"]),
      T(["Turn on", "*notifications.*"], 3),
    ], { cta: CTA.follow }],
    ["chat", "Questions for the Live", [
      T(["Questions for", "*the Live*"], 3),
      CH([["i", "how do you handle repeat no-shows?"], ["i", "do deposits work in Goa?"], ["i", "how do you build a waitlist?"]], 6),
      T(["Ask yours", "*below 👇*"], 3),
    ], { cta: CTA.comment }],
    ["poll", "What should the Live cover?", [
      T(["Next Live:", "*what should we cover?*"], 3),
      PL("Vote 👇", [["No-shows", 41], ["Pricing", 27], ["Staff", 32]]),
    ], { cta: CTA.comment }],
    ["checklist", "Owners: want to join a Live?", [
      T(["Own a salon in Goa?", "*Join our Live.*"], 3),
      CK(undefined, ["*20 minutes*", "Share *your* story", "No *selling*", "Shout-out for *your salon*"], 6),
    ], { cta: "DM “LIVE” to join" }],
  ]),

  ...idea("C10", "The 3 messages I'd send if I owned a salon", [
    ["chat", "3 messages I'd send", [
      T(["3 messages I'd send", "*if I owned a salon*"], 4),
      CH([["o", "1 · “See you tomorrow at 4! Can't make it? Just reply 💚”"], ["o", "2 · “A 4:30 slot opened. First reply gets it 🙌”"], ["o", "3 · “No problem! Thursday 5 PM instead?”"]], 8),
      T(["Save it.", "*Use it today.*"], 3),
    ], { cta: CTA.save }],
    ["list", "Message 1, 2, 3", [
      T(["3 messages", "*that fill chairs*"], 3),
      RK(1, "The *reminder*", "24h before, with an easy out."),
      RK(2, "The *offer*", "To the waitlist, first reply wins."),
      RK(3, "The *rebook*", "To whoever cancelled."),
    ], { cta: CTA.save }],
    ["quickfire", "Remind · Offer · Rebook", [
      TK("Send:", ["Remind", "Offer", "*Rebook*"]),
      T(["Free templates:", "*link in bio.*"], 3),
    ], { cta: CTA.kit }],
    ["versus", "What most send vs what works", [
      T(["What most owners send", "vs *what works*"], 3),
      VS(["Most", ["“Appointment tmrw”", "“No worries!”", "Nothing"]], ["Works", ["*Reminder + easy out*", "*“Thursday?”*", "*Waitlist offer*"]]),
    ], { cta: CTA.save }],
    ["checklist", "Copy these today", [
      T(["Copy these", "*today*"], 2),
      CK(undefined, ["The *24h reminder*", "The *slot offer*", "The *rebook* reply"], 6),
      ...DEMO(),
    ], { cta: CTA.save }],
  ]),

  ...idea("C11", "Creator takeover: a stylist runs our Stories", [
    ["story", "A stylist takes over our Stories", [
      T(["A Goa stylist", "*takes over our Stories*"], 4, "Coming soon"),
      TK("For one day:", ["their clients", "their chaos", "their cancels", "*their fix*"]),
      T(["Want it to be", "*you?*"], 3),
    ], { cta: "DM “TAKEOVER”" }],
    ["checklist", "Takeover: what you'd do", [
      T(["Our Stories,", "*your day*"], 3),
      CK(undefined, ["Show a *normal day*", "Share a *cancel story*", "Try *SlotBack* live", "Shout-out for *your salon*"], 7),
    ], { cta: "DM “TAKEOVER”" }],
    ["quickfire", "Stylists of Goa, apply", [
      TK("We want:", ["stylists", "nail techs", "lash artists", "*you*"]),
      T(["One day.", "*Our Stories.*"], 3),
    ], { cta: "DM “TAKEOVER”" }],
    ["poll", "Who should take over?", [
      T(["Who should take over", "*our Stories?*"], 3),
      PL("Vote 👇", [["A stylist", 38], ["A nail tech", 33], ["A physio", 29]]),
    ], { cta: CTA.comment }],
    ["chat", "Takeover DM", [
      T(["How to apply", "*in one DM*"], 3),
      CH([["i", "TAKEOVER"], ["o", "Yay! Tell us your salon name and your best cancel story 😂"]], 5),
    ], { cta: "DM “TAKEOVER”" }],
  ]),

  ...idea("C12", "What your Instagram bio should say", [
    ["checklist", "What your bio should say", [
      T(["What your Instagram bio", "*should say*"], 4, "Owners"),
      CK(undefined, ["*What* you do", "*Where* (area in Goa)", "*How* to book (one link)", "A *waitlist* line"], 7),
      T(["Check yours", "*now.*"], 2),
    ], { cta: CTA.save }],
    ["versus", "Bad bio vs good bio", [
      T(["Bad bio", "vs *good bio*"], 3),
      VS(["Bad", ["✨ Beauty ✨", "DM for details", "~No link~"]], ["Good", ["Hair + skin · Panaji", "Book: link below", "*Waitlist for cancels*"]]),
    ], { cta: CTA.save }],
    ["quickfire", "Bio in 4 lines", [
      TK("Bio:", ["what", "where", "book", "*waitlist*"]),
      CARD(["Hair & skin · Panaji", "Book below 👇", "*Join the waitlist* for", "last-minute slots"], 5, "Example"),
    ], { cta: CTA.save }],
    ["story", "Fix your bio in 30 seconds", [
      T(["Fix your bio", "*in 30 seconds*"], 3),
      T(["Line 1:", "*what + where.*"], 2),
      T(["Line 2:", "*how to book.*"], 2),
      T(["Line 3:", "*join the waitlist.*"], 2),
      T(["Cancels now", "*have somewhere to go.*"], 3),
    ], { cta: CTA.save }],
    ["poll", "Does your bio have a booking link?", [
      T(["Does your bio have", "*a booking link?*"], 3),
      PL("Be honest", [["Yes", 42], ["No", 35], ["“DM to book”", 23]]),
      T(["Add a *waitlist* too.", "Fill your cancels."], 3),
    ], { cta: CTA.comment }],
  ]),

  ...idea("C13", "Free vs paid booking tools", [
    ["versus", "Free vs paid booking tools", [
      T(["Free vs paid", "*booking tools*"], 3, "Honest take"),
      VS(["Free tools", ["Take bookings", "Basic reminders", "Fine to start"]], ["Paid tools", ["More features", "Marketing", "Higher cost"]], undefined),
      T(["Neither refills", "*your cancels.*"], 3),
      T(["That's the", "*gap SlotBack fills.*"], 3),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["checklist", "What actually matters", [
      T(["Picking a booking tool?", "*What matters*"], 4),
      CK(undefined, ["Easy for *clients*", "Reminders *built in*", "Works with *WhatsApp*", "Refills *cancellations*"], 7),
    ], { cta: CTA.save }],
    ["quickfire", "Tools vs the real problem", [
      TK("Booking tools do:", ["calendars", "reminders", "payments", "~refills?~"]),
      T(["SlotBack works", "*next to them.*"], 3),
      OPEN(),
    ], { cta: CTA.demo }],
    ["poll", "What do you use now?", [
      T(["What do you use", "*for bookings now?*"], 3),
      PL("Vote 👇", [["WhatsApp + diary", 52], ["A free app", 29], ["A paid system", 19]]),
      T(["Any of them +", "*SlotBack for cancels.*"], 3),
    ], { cta: CTA.comment }],
    ["story", "Keep your tool, fix the cancels", [
      T(["Keep your", "*booking tool.*"], 3),
      T(["Just add", "*a refill button.*"], 3),
      ...DEMO(),
    ], { cta: CTA.demo }],
  ]),

  ...idea("C14", "Is a waitlist worth it?", [
    ["numbers", "Is a waitlist worth it?", [
      T(["Is a waitlist", "*worth it?*"], 3, "Example maths"),
      ST("Cancels a month", 12, "", "", ""),
      ST("Refilled with a waitlist (half)", 6, "", "", ""),
      ST("Kept at ₹1,000 each", 6000, "*Every month.*"),
    ], { cta: CTA.demo }],
    ["versus", "No waitlist vs waitlist", [
      T(["No waitlist", "vs *waitlist*"], 3),
      VS(["No waitlist", ["Cancel = empty", "Calls, maybe", "~₹0~"]], ["Waitlist", ["Cancel = offer", "First tap", "*₹ kept*"]]),
    ], { cta: CTA.demo }],
    ["quickfire", "Worth it? Yes.", [
      TK("Waitlist effort:", ["one QR", "one question", "one link", "*worth it*"]),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["poll", "Do you keep a waitlist?", [
      T(["Do you keep", "*a waitlist?*"], 3),
      PL("Vote 👇", [["Yes, I use it", 18], ["In my head 😅", 49], ["No", 33]]),
      T(["“In my head”", "*doesn't refill slots.*"], 3),
    ], { cta: CTA.comment }],
    ["checklist", "Start a waitlist today", [
      T(["Start a waitlist", "*today*"], 3),
      CK(undefined, ["Add a *QR* at the desk", "Ask at *checkout*", "Put the *link* in your bio", "Use it for *every cancel*"], 7),
      ...DEMO(),
    ], { cta: CTA.save }],
  ]),
];
