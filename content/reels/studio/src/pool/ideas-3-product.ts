import { CH, CK, CLAIM, COUNT, CTA, DEMO, FLAG, FLIP, GAP, idea, NOTIF, OPEN, PL, RK, SG, ST, T, TIMER, TK, VS } from "./build";
import { PoolReel } from "./types";

// Pillar 3 · Product: SlotBack in action (09:00 or 19:30). Ideas #79–86.
export const product: PoolReel[] = [
  ...idea("79", "Watch me fill a cancelled slot in 30 seconds", [
    ["demo", "Fill a cancelled slot in 30s", [
      T(["Watch me fill", "a cancelled slot", "*in 30 seconds*"], 4),
      NOTIF("0:00", "so sorry, can't come 🙏", "2:10"),
      OPEN("0:05\n*One tap.*"),
      TIMER("0:06–0:28\n*Waitlist racing.*"),
      CLAIM("0:29\n*Claimed.*", "A 3:00 PM slot"),
      T(["29 seconds.", "*Zero calls.*"], 3),
    ], { cta: CTA.demo }],
    ["quickfire", "30-second refill speedrun", [
      TK("Refill time:", ["30s", "20s", "10s", "*Done*"]),
      ...DEMO("A 3:00 PM slot"),
      T(["Faster than", "*finding a phone number.*"], 3),
    ], { cta: CTA.demo }],
    ["versus", "30 seconds vs 40 minutes", [
      T(["Same cancel.", "*Two timelines.*"], 3),
      VS(["Old way", ["40 min of calls", "6 no answers", "~Still empty~"]], ["SlotBack", ["30 seconds", "1 tap", "*Booked*"]]),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["story", "A real-time refill, step by step", [
      T(["A cancel,", "*refilled live.*"], 3, "Real time"),
      GAP("Booked.", "booked"),
      GAP("~Cancelled.~", "broken"),
      OPEN("Tap.\n*Waitlist pinged.*"),
      GAP("*Refilled.*", "refilled"),
    ], { cta: CTA.demo }],
    ["numbers", "Seconds, not minutes", [
      T(["How long does", "*a refill take?*"], 3),
      ST("Owner time spent", 5, "One tap.", "", " sec"),
      ST("Until someone claims", 30, "*Usually.*", "", " sec"),
      ...DEMO(),
    ], { cta: CTA.demo, badge: "Example timing" }],
  ]),

  ...idea("80", "What your client sees when a slot opens", [
    ["demo", "What your client sees", [
      T(["What your client sees", "*when a slot opens*"], 4),
      NOTIF("Their phone.", "A 4:00 PM slot just opened 👀", "3:31", "SlotBack"),
      CLAIM("One tap.\n*Booked.*", "A 4:00 PM slot"),
      T(["No app.", "*No login.*"], 3),
    ], { cta: CTA.demo }],
    ["chat", "The client's side of the story", [
      T(["Your client,", "*3:31 PM*"], 3),
      CH([["i", "A 4:00 PM slot just opened at Glow Studio. Want it? Tap to claim 👇"], ["o", "omg yes"], ["i", "*Booked ✓* See you at 4!"]], 6, "SlotBack"),
      T(["That's the whole", "*experience.*"], 3),
    ], { cta: CTA.demo }],
    ["quickfire", "Ping → tap → booked", [
      TK("Client side:", ["Ping", "Tap", "*Booked*"]),
      CLAIM(),
      T(["Easier than", "*ordering chai.*"], 3),
    ], { cta: CTA.demo }],
    ["checklist", "What the client never has to do", [
      T(["What your client", "*never* has to do"], 3),
      CK(undefined, ["Download an *app*", "Make an *account*", "*Call* you back", "Wait on *hold*"], 7),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["versus", "Owner view vs client view", [
      T(["Same moment.", "*Two screens.*"], 3),
      VS(["Owner", ["Taps “slot free”", "That's it"]], ["Client", ["Gets a link", "Taps claim", "*Booked*"]], undefined),
      OPEN(),
      CLAIM(),
    ], { cta: CTA.demo }],
  ]),

  ...idea("81", "Two clients tap at the same time", [
    ["demo", "Two clients tap. Who wins?", [
      T(["Two clients tap", "*at the same time.*", "Who wins?"], 4),
      VS(["Riya · 3:31:04", ["Taps claim", "~0.4s late~"]], ["Sana · 3:31:03", ["Taps claim", "*First!*"]]),
      CLAIM("Sana\n*gets it.*"),
      T(["Riya sees:", "*“Taken. You're next.”*"], 3),
    ], { cta: CTA.demo }],
    ["chat", "The second tapper", [
      T(["What the *second*", "person sees"], 3),
      CH([["i", "4:00 PM slot open. Tap to claim 👇"], ["o", "tapped!!"], ["i", "So sorry, that slot just got taken 💚 You're first in line for the next one."]], 6),
      T(["No double-booking.", "*No hurt feelings.*"], 3),
    ], { cta: CTA.demo }],
    ["quickfire", "No double-booking, ever", [
      TK("Two taps:", ["Tap", "Tap", "*One winner*"]),
      T(["First tap books.", "*Everyone else is told.*"], 3),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["versus", "WhatsApp group vs claim link", [
      T(["Blast a WhatsApp group?", "*Here's the problem.*"], 4),
      VS(["Group blast", ["5 people reply", "4 feel let down", "~Double-booked~"]], ["Claim link", ["5 people tap", "1 books", "*4 told kindly*"]]),
    ], { cta: CTA.demo }],
    ["poll", "Fair or unfair?", [
      T(["First tap gets the slot.", "*Fair?*"], 3),
      PL("Vote 👇", [["Totally fair", 71], ["Unfair", 12], ["Depends", 17]]),
      T(["Fast and fair:", "*first tap wins.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
  ]),

  ...idea("82", "The link expires. Here's why that's genius", [
    ["story", "Why the link expires", [
      T(["The link expires.", "*Here's why that's genius.*"], 4),
      CLAIM("10-minute\n*countdown.*"),
      T(["Urgency makes", "*people tap.*"], 3),
      T(["And if nobody does,", "*it moves on.*"], 3),
      OPEN("Next person\n*gets a turn.*"),
    ], { cta: CTA.demo }],
    ["quickfire", "Tick tock", [
      TK("Link expires in:", ["10:00", "07:30", "03:12", "*Claimed*"]),
      TIMER(),
      T(["A deadline", "*fills slots.*"], 3),
    ], { cta: CTA.demo }],
    ["versus", "Open-ended vs expiring", [
      T(["“Let me know”", "vs", "*a 10-minute link*"], 4),
      VS(["Open-ended", ["“I'll check”", "Reply in 3 hours", "~Too late~"]], ["Expiring", ["Decide now", "Tap or pass", "*Filled fast*"]]),
    ], { cta: CTA.demo }],
    ["checklist", "What the timer does for you", [
      T(["What the timer", "*does for you*"], 3),
      CK(undefined, ["Makes people *decide*", "Stops *maybe-later* replies", "Moves on *automatically*", "Fills the slot *in time*"], 7),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["numbers", "Why 10 minutes", [
      T(["Why *10 minutes?*"], 3),
      ST("Enough time to tap", 10, "Not enough to forget.", "", " min"),
      TIMER("Then it\n*moves on.*"),
    ], { cta: CTA.demo }],
  ]),

  ...idea("83", "Setting up SlotBack, start to finish", [
    ["steps", "Setup, start to finish", [
      T(["Setting up SlotBack,", "*start to finish*"], 4),
      RK(1, "Add your *services*"),
      RK(2, "Share your *waitlist link*"),
      RK(3, "Mark a cancel *free*"),
      T(["That's it.", "*You're live.*"], 3),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["quickfire", "Setup in 3 taps", [
      TK("Setup:", ["Services", "Link", "*Live*"]),
      CK(undefined, ["Services *added*", "Waitlist link *shared*", "First refill *ready*"], 5),
      OPEN(),
    ], { cta: CTA.demo }],
    ["checklist", "What you need to start", [
      T(["What you need", "*to start*"], 3),
      CK(undefined, ["A *phone*", "Your *services list*", "*5 minutes*", "~No new hardware~"], 6),
      T(["Free demo:", "*we'll set it up with you.*"], 3),
    ], { cta: CTA.demo }],
    ["versus", "What you think vs reality", [
      T(["“Setup sounds", "*complicated.*”"], 3),
      VS(["You think", ["Training", "New system", "~Weeks~"]], ["Reality", ["Add services", "Share a link", "*Minutes*"]]),
    ], { cta: CTA.demo }],
    ["stages", "From zero to first refill", [
      T(["Zero to", "*first refill*"], 3),
      SG(1, 3, "Add", "Your services."),
      SG(2, 3, "Share", "Your waitlist link."),
      SG(3, 3, "Refill", "*Your first cancel.*"),
      CLAIM(),
    ], { cta: CTA.demo }],
  ]),

  ...idea("84", "The notification every owner wants", [
    ["demo", "The notification every owner wants", [
      T(["The notification", "*every owner wants*"], 4),
      NOTIF("3:34 PM.", "Slot filled ✓ Riya claimed 4:00 PM", "3:34", "SlotBack"),
      FLIP("*Filled.*", "4:00 PM", "Filled · Riya", "₹1,200"),
    ], { cta: CTA.demo }],
    ["versus", "Bad ping vs good ping", [
      T(["Two notifications.", "*One makes your day.*"], 3),
      VS(["~3:52 PM~", ["“so sorry can't make it 🙏”"]], ["*3:53 PM*", ["“Slot filled ✓”"]]),
    ], { cta: CTA.demo }],
    ["quickfire", "Ping. Filled.", [
      TK("*ping*", ["Slot filled ✓", "Slot filled ✓", "*Slot filled ✓*"]),
      FLIP("Sounds like\n*money.*", "4:00 PM", "Filled · waitlist", "₹1,200"),
    ], { cta: CTA.demo }],
    ["story", "Bad text, good text", [
      NOTIF("3:52 PM.", "so sorry can't make it 🙏", "3:52"),
      T(["*One tap later…*"], 2),
      NOTIF("3:53 PM.", "Slot filled ✓ Sana claimed 4:00", "3:53", "SlotBack"),
      T(["Best 60 seconds", "*of your day.*"], 3),
    ], { cta: CTA.demo }],
    ["numbers", "Each ping = ₹ kept", [
      T(["Every “slot filled” ping", "is *money kept*"], 4),
      COUNT("Example: ₹1,000 a slot", [[1000, "1 ping"], [4000, "4 pings this week"], [16000, "this month"]], "*Kept.*", 6),
    ], { cta: CTA.demo }],
  ]),

  ...idea("85", "No app for your clients", [
    ["demo", "No app for your clients. Proof.", [
      T(["No app for your clients.", "*Here's proof.*"], 4),
      CLAIM("Tap link →\n*booked.*"),
      CK(undefined, ["No *download*", "No *sign-up*", "No *password*"], 5),
    ], { cta: CTA.demo }],
    ["myth", "Myth: clients need an app", [
      T(["Myth:", "“My clients will", "*need an app.*”"], 4),
      FLAG("red", "Nobody downloads an app *for one haircut.*"),
      FLAG("green", "A *link* works on every phone."),
      CLAIM(),
    ], { cta: CTA.save }],
    ["quickfire", "Downloads needed: zero", [
      TK("Apps to download:", ["3", "2", "1", "*0*"]),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["poll", "Would YOU download a salon app?", [
      T(["Honestly,", "*would you download*", "your salon's app?"], 4),
      PL("Vote 👇", [["Never", 64], ["Maybe", 25], ["Yes", 11]]),
      T(["Exactly.", "*So we use a link.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["versus", "App vs link", [
      T(["App or link?"], 2),
      VS(["App", ["Download", "Sign up", "Password", "~Forget it~"]], ["Link", ["Tap", "*Booked*"]]),
    ], { cta: CTA.demo }],
  ]),

  ...idea("86", "Dashboard tour in 15 seconds", [
    ["demo", "Dashboard tour in 15 seconds", [
      T(["Dashboard tour", "*in 15 seconds*"], 3),
      GAP("Today view.", "booked"),
      OPEN("Cancel?\n*One tap.*"),
      ST("Refilled this week", 6, "", "", " slots"),
      T(["That's the", "*whole tour.*"], 2),
    ], { cta: CTA.demo, badge: "Example data" }],
    ["quickfire", "3 screens, 15 seconds", [
      TK("Screens:", ["Today", "Waitlist", "*Wins*"]),
      GAP("Today", "booked"),
      CLAIM(),
      ST("Kept this month", 18000, "*Example.*"),
    ], { cta: CTA.demo }],
    ["checklist", "What the dashboard shows", [
      T(["What you see", "*every morning*"], 3),
      CK(undefined, ["Today's *bookings*", "Who's on the *waitlist*", "Slots *refilled*", "₹ *kept* this month"], 7),
    ], { cta: CTA.demo }],
    ["numbers", "The number on top", [
      T(["The number", "*you'll check daily*"], 3),
      ST("Kept this month", 24000, "From refilled cancels."),
      T(["Better than", "*any horoscope.*"], 3),
    ], { cta: CTA.demo, badge: "Example data" }],
    ["story", "Morning check, 10 seconds", [
      T(["My morning routine:", "*10 seconds*"], 3),
      GAP("Diary: *full.*", "booked"),
      ST("Waitlist", 23, "*Ready for cancels.*", "", " people"),
      T(["Chai.", "*Then clients.*"], 3),
    ], { cta: CTA.demo, badge: "Example data" }],
  ]),
];
