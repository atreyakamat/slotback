import { CALLS, CARD, CH, CK, CLAIM, COUNT, CTA, DEMO, FLAG, FLIP, GAP, GR, idea, NOTIF, OPEN, PL, RK, SG, ST, T, TIMER, TK, VS } from "./build";
import { PoolReel } from "./types";

// Pillar 2 · Education: run a tighter appointment business (09:00 slot). Ideas #67–78.
export const education: PoolReel[] = [
  ...idea("67", "3 cancellation policies that don't scare clients", [
    ["list", "3 policies that don't scare clients", [
      T(["3 cancellation policies", "that *don't scare*", "clients"], 4, "Save this"),
      RK(1, "The *24-hour* window", "Cancel 24h ahead, no fee."),
      RK(2, "The *one free pass*", "First late cancel? On us."),
      RK(3, "*Refill = refund*", "If we refill it, no fee."),
      T(["Fair to them.", "*Fair to you.*"], 3),
      OPEN("Then refill\n*the gap.*"),
    ], { cta: CTA.kit }],
    ["versus", "Scary policy vs fair policy", [
      T(["Your policy:", "~scary~ or *fair?*"], 3),
      VS(["Scary", ["“Full fee, no excuses”", "ALL CAPS", "~Clients go elsewhere~"]], ["Fair", ["24h notice", "One free pass", "*Clients respect it*"]]),
      CARD(["“Please give us 24h notice.", "If we refill your slot,", "*no fee.*”"], 5, "Copy this"),
    ], { cta: CTA.save }],
    ["checklist", "Write your policy in 4 lines", [
      T(["Write your policy", "in *4 lines*"], 3),
      CK(undefined, ["Pick *one* notice window", "Say it *before* they book", "Keep the fee *simple*", "Waive it if you *refill*"], 7),
      T(["Free policy writer:", "*link in bio.*"], 3),
    ], { cta: CTA.kit }],
    ["poll", "Which policy would you sign?", [
      T(["If you were the client,", "*which would you accept?*"], 4),
      PL("Pick one", [["Full fee, always", 9], ["50% after 24h", 37], ["Fee unless refilled", 54]]),
      T(["Clients pick", "*the fair one.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment, badge: "Just for fun" }],
    ["quickfire", "Policy rules in 10 seconds", [
      TK("Good policy is:", ["Short", "Clear", "Early", "*Fair*"]),
      T(["24h notice.", "*One free pass.*"], 3),
      T(["Refilled?", "*No fee.*"], 3),
      OPEN(),
    ], { cta: CTA.save }],
  ]),

  ...idea("68", "Stop saying ‘no worries!’", [
    ["chat", "Stop saying “no worries!”", [
      T(["Stop saying", "*“no worries!”*"], 3, "When someone cancels"),
      CH([["i", "so sorry, can't come today 🙏"], ["o", "no worries! 😊"]], 4),
      T(["That reply", "~ends the conversation.~"], 3),
      CH([["i", "so sorry, can't come today 🙏"], ["o", "No problem! Want *Thursday 5 PM* instead? I'll also offer today to our waitlist 💚"]], 6, "Say this instead"),
      FLIP("Rebooked +\n*refilled.*", "4:00 PM", "Filled · waitlist"),
    ], { cta: CTA.save }],
    ["versus", "‘No worries’ vs the better reply", [
      T(["Two replies.", "*One wins.*"], 3),
      VS(["“No worries!”", ["Slot stays empty", "Client drifts away", "~₹0~"]], ["“Thursday 5?”", ["Client rebooked", "Slot offered out", "*₹ kept twice*"]]),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["checklist", "3 things to say instead", [
      T(["Say these", "*instead of “no worries”*"], 3),
      CK(undefined, ["“Want *another day* this week?”", "“I'll hold *your best time.*”", "“I'll offer today to *the waitlist.*”"], 7),
      T(["Friendly.", "*And it fills the slot.*"], 3),
    ], { cta: CTA.save }],
    ["quickfire", "Two words that cost you", [
      TK("“No worries” costs:", ["the rebook", "the slot", "the client", "*₹1,000*"]),
      T(["Ask one question:", "*“Thursday?”*"], 3),
      CLAIM("And refill\n*today's slot.*"),
    ], { cta: CTA.save }],
    ["numbers", "The rebook you didn't ask for", [
      T(["Asking for the rebook", "*changes the maths*"], 4),
      ST("If you just say “no worries”", 0, "~Nothing rebooked.~"),
      ST("If you ask “Thursday?”", 1000, "*One booking back.*"),
      OPEN(),
    ], { cta: CTA.save }],
  ]),

  ...idea("69", "Build a waitlist in 7 days", [
    ["steps", "Build a waitlist in 7 days", [
      T(["Build a waitlist", "in *7 days*"], 3, "No ads needed"),
      CK("Days 1–7", ["Day 1: *QR at reception*", "Day 2: *ask at checkout*", "Day 3: *Story sticker*", "Day 4: *bio link*", "Day 5: *ask regulars*"], 8),
      T(["Day 7:", "*20+ people waiting.*"], 3),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["quickfire", "Where waitlists come from", [
      TK("Waitlist sources:", ["Reception QR", "Checkout ask", "IG Story", "Bio link", "*Regulars*"]),
      GR("Easiest 4", [["🔳", "QR at the desk"], ["💬", "“Want earlier slots?”"], ["📸", "Story sticker"], ["🔗", "Bio link"]], 6),
      OPEN("Next cancel?\n*They get it first.*"),
    ], { cta: CTA.save }],
    ["chat", "The checkout question", [
      T(["One question", "at *checkout*", "builds your waitlist"], 4),
      CH([["o", "Want me to add you to our waitlist? If an earlier slot opens, you'll get it first 💚"], ["i", "yes please!!"], ["i", "add my sister too 😂"]], 7),
      T(["2 names.", "*10 seconds.*"], 3),
      CLAIM(),
    ], { cta: CTA.save }],
    ["numbers", "Waitlist growth, one week", [
      T(["How fast can", "*a waitlist grow?*"], 3),
      ST("Clients asked per day", 5, "Just at checkout.", "", ""),
      ST("Say yes (about 60%)", 21, "*In one week.*", "", " people"),
      T(["21 people", "*ready for every cancel.*"], 3),
      OPEN(),
    ], { cta: CTA.save }],
    ["stages", "Waitlist: day 1 vs day 7", [
      T(["Day 1:", "*0 names*"], 2),
      SG(1, 3, "Day 1", "QR at the desk."),
      SG(2, 3, "Day 4", "Asking at checkout."),
      SG(3, 3, "Day 7", "*A real waitlist.*"),
      ...DEMO(),
    ], { cta: CTA.save }],
  ]),

  ...idea("70", "The 24-hour reminder that cuts no-shows", [
    ["chat", "The reminder that cuts no-shows", [
      T(["The 24-hour reminder", "that *cuts no-shows*"], 4, "Screenshot this"),
      CH([["o", "Hi Riya! See you *tomorrow at 4 PM* 💇‍♀️"], ["o", "Can't make it? Just reply and we'll give it to our waitlist 💚"], ["i", "thanks for reminding!! see you 🙌"]], 7),
      T(["Easy “out”", "= *early cancels.*"], 3),
      T(["Early cancel", "= *refillable slot.*"], 3),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["versus", "Bad reminder vs good reminder", [
      T(["Your reminder", "is *half the job*"], 3),
      VS(["Bad", ["“Appointment tmrw”", "No way to cancel", "~Silent no-show~"]], ["Good", ["Name + time", "“Just reply to cancel”", "*Early heads-up*"]]),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["checklist", "4 parts of a great reminder", [
      T(["A great reminder", "has *4 parts*"], 3),
      CK(undefined, ["Their *name*", "Day + *exact time*", "An easy *“reply to cancel”*", "Why: *“so someone else can come”*"], 7),
      T(["Send it", "*24h before.*"], 2),
    ], { cta: CTA.save }],
    ["quickfire", "When to send reminders", [
      TK("Send reminders:", ["1 week? no", "3 days? meh", "*24 hours ✓*"]),
      T(["24h gives you", "*time to refill.*"], 3),
      OPEN(),
    ], { cta: CTA.save }],
    ["numbers", "Late cancel vs early cancel", [
      T(["Why timing", "*changes everything*"], 3),
      ST("Hours to refill (early cancel)", 24, "*Easy to fill.*", "", "h"),
      ST("Minutes to refill (no-show)", 0, "~Impossible.~", "", " min"),
      T(["Reminders turn no-shows", "into *early cancels.*"], 4),
    ], { cta: CTA.save }],
  ]),

  ...idea("71", "Why your Tuesday 2 PM is always empty", [
    ["story", "Why Tuesday 2 PM is always empty", [
      T(["Why is Tuesday 2 PM", "*always empty?*"], 4),
      GAP("Tuesday.\n~2 PM gap.~", "broken"),
      T(["People *want* slots.", "Just not *that one.*"], 3),
      T(["Fix: offer it", "*to the waitlist first.*"], 3),
      ...DEMO("A Tuesday 2:00 PM slot"),
    ], { cta: CTA.save }],
    ["poll", "Your deadest slot?", [
      T(["Which slot is", "*always empty?*"], 3),
      PL("Vote 👇", [["Tue 2 PM", 38], ["Mon 11 AM", 29], ["Wed 3 PM", 33]]),
      T(["Fill it with people", "*who wanted any time.*"], 3),
      OPEN(),
    ], { cta: CTA.comment }],
    ["checklist", "Fill your off-peak slots", [
      T(["Fill off-peak slots", "*without discounts*"], 3),
      CK(undefined, ["Offer them to the *waitlist first*", "Tag “*flexible*” clients", "Suggest them at *checkout*", "Refill cancels *in one tap*"], 7),
      GAP("Tuesday 2 PM.\n*Booked.*", "refilled"),
    ], { cta: CTA.save }],
    ["numbers", "What dead slots cost", [
      T(["One dead slot", "*every week*"], 3),
      COUNT("Example: ₹800 a slot", [[800, "One week"], [3200, "One month"], [38400, "One year"]], "~Just Tuesdays.~", 6),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["quickfire", "Tuesday 2 PM energy", [
      TK("Tuesday 2 PM:", ["Empty", "Quiet", "Sleepy", "*Booked?*"]),
      T(["Your waitlist", "*doesn't mind Tuesdays.*"], 3),
      CLAIM("Tuesday 2 PM\n*claimed.*", "A Tuesday 2:00 PM slot"),
    ], { cta: CTA.demo }],
  ]),

  ...idea("72", "Deposits: yes or no?", [
    ["versus", "Deposits: yes or no?", [
      T(["Deposits:", "*yes or no?*"], 3),
      VS(["Deposits", ["Fewer no-shows", "Some clients push back", "~Slot still empty~"]], ["+ Waitlist", ["Fewer no-shows", "Cancels get refilled", "*Slot earns twice*"]]),
      T(["Best answer:", "*both.*"], 3),
    ], { cta: CTA.save }],
    ["numbers", "What a deposit actually covers", [
      T(["A ₹200 deposit", "on a *₹1,000 slot*"], 3),
      ST("Deposit kept", 200, "Better than nothing…"),
      ST("Still lost", 800, "~Unless you refill.~"),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["poll", "Do you take deposits?", [
      T(["Owners:", "*do you take deposits?*"], 3),
      PL("Be honest", [["Always", 22], ["Only new clients", 41], ["Never", 37]]),
      T(["Either way,", "*refill the cancel.*"], 3),
      OPEN(),
    ], { cta: CTA.comment }],
    ["myth", "Myth: deposits fix cancellations", [
      T(["Myth:", "“Deposits fix", "*cancellations.*”"], 4),
      FLAG("red", "Deposits stop *some* no-shows."),
      FLAG("green", "Refills put *a client back* in the chair."),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["checklist", "If you do take deposits", [
      T(["If you take deposits,", "*do it right*"], 3),
      CK(undefined, ["Keep it *small* (₹100–300)", "Say it *before* booking", "Refund if *refilled*", "Still keep a *waitlist*"], 7),
    ], { cta: CTA.save }],
  ]),

  ...idea("73", "Do this the moment a client cancels", [
    ["steps", "Do this the moment someone cancels", [
      T(["Do this", "*the moment*", "a client cancels"], 4),
      RK(1, "*Mark* the slot free"),
      RK(2, "*Message* your waitlist"),
      RK(3, "*Confirm* the first reply"),
      T(["3 steps.", "*Under a minute.*"], 3),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["quickfire", "Cancel → refill in 3 taps", [
      NOTIF("Cancelled.", "sorry can't make it", "2:10"),
      TK("Now:", ["Mark", "Send", "*Done*"]),
      ...DEMO("A 3:00 PM slot"),
    ], { cta: CTA.demo }],
    ["versus", "First 60 seconds after a cancel", [
      T(["The first 60 seconds", "*after a cancel*"], 3),
      VS(["Most owners", ["Sigh", "Open WhatsApp", "Scroll contacts", "~Call one by one~"]], ["Smart owners", ["Mark it free", "One link out", "Wait 30s", "*Booked*"]]),
      TIMER(),
    ], { cta: CTA.demo }],
    ["checklist", "The 1-minute refill", [
      T(["The *1-minute*", "refill"], 3),
      CK(undefined, ["0:00 · *Mark* it free", "0:10 · *Send* to waitlist", "0:45 · *First reply* wins", "0:50 · *Confirm*"], 7),
      CLAIM(),
    ], { cta: CTA.save }],
    ["story", "What not to do after a cancel", [
      T(["Client cancelled.", "*Don't do this.*"], 3),
      CALLS("~Calling 6 people~", ["Riya", "Sana", "Meera"]),
      T(["Do this:", "*one message, everyone.*"], 3),
      ...DEMO(),
    ], { cta: CTA.save }],
  ]),

  ...idea("74", "How much one empty slot costs you a year", [
    ["numbers", "One empty slot, one year", [
      T(["How much does", "*one empty slot*", "cost you a year?"], 4),
      COUNT("Example: ₹1,000 slot, 1 a week", [[1000, "One week"], [4330, "One month"], [48000, "48 working weeks"]], "~₹48,000.~", 7),
      T(["From *one* slot", "*a week.*"], 3),
      ...DEMO(),
    ], { cta: CTA.kit }],
    ["quickfire", "Do the maths in 5 seconds", [
      TK("Your maths:", ["Slot price", "× cancels/week", "× 48 weeks", "*= ?*"]),
      ST("Example: ₹800 × 2 × 48", 76800, "*Per year.*"),
      T(["Free calculator:", "*link in bio.*"], 3),
    ], { cta: CTA.kit }],
    ["poll", "Guess the yearly cost", [
      T(["₹1,000 slot.", "1 cancel a week.", "*Guess the yearly loss.*"], 4),
      PL("Guess 👇", [["₹12,000", 31], ["₹24,000", 38], ["₹48,000", 31]]),
      ST("Answer", 48000, "*Most guess too low.*"),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["versus", "Refill half, keep half", [
      T(["What if you refill", "*just half?*"], 3),
      VS(["Refill 0", ["₹48,000 lost", "Every year", "~Gone~"]], ["Refill half", ["₹24,000 back", "Same clients", "*Same chairs*"]]),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["story", "The calculator that shocked an owner", [
      T(["Put your numbers", "*into this*"], 3, "Free tool"),
      ST("Lost per year (example)", 144000, "~₹1,000 × 3 a week × 48~"),
      T(["Now imagine", "*getting half back.*"], 3),
      ST("Back if you refill half", 72000, "*That's the point.*"),
    ], { cta: CTA.kit }],
  ]),

  ...idea("75", "The WhatsApp message that fills a slot", [
    ["chat", "The message that fills a slot", [
      T(["The WhatsApp message", "that *fills a slot*", "in minutes"], 4, "Save this"),
      CH([["o", "Hi! A *4:30 PM* slot just opened today. Want it? First reply gets it 🙌"], ["i", "YES 🙋‍♀️"], ["i", "omg me!!"], ["o", "Riya got it first! You're next on the list 💚"]], 8),
      T(["Short. Urgent.", "*First reply wins.*"], 3),
    ], { cta: CTA.save }],
    ["checklist", "Why this message works", [
      T(["Why this message", "*works*"], 3),
      CK(undefined, ["*Exact* time", "*Today* (urgency)", "*First reply* wins", "No *guilt*, no begging"], 7),
      CLAIM(),
    ], { cta: CTA.save }],
    ["versus", "Weak message vs strong message", [
      T(["Which one", "*fills the slot?*"], 3),
      VS(["Weak", ["“Hi, any chance you're free sometime?”", "~Vague~"]], ["Strong", ["“4:30 today. First reply gets it 🙌”", "*Clear*"]]),
      T(["Or send it", "*to everyone at once.*"], 3),
      OPEN(),
    ], { cta: CTA.save }],
    ["quickfire", "Copy, paste, filled", [
      TK("Message:", ["Time", "Today", "First reply", "*Filled*"]),
      CARD(["“A 4:30 slot just opened.", "Want it? *First reply*", "*gets it* 🙌”"], 5, "Copy this"),
      ...DEMO("A 4:30 PM slot"),
    ], { cta: CTA.save }],
    ["story", "One message, 3 replies, 1 booking", [
      T(["One message.", "*3 replies.*", "1 booking."], 4),
      OPEN("Sent to\n*the whole waitlist.*"),
      TIMER(),
      CLAIM("Riya\n*got there first.*", "A 4:30 PM slot"),
      T(["The others?", "*Next cancel's theirs.*"], 3),
    ], { cta: CTA.demo }],
  ]),

  ...idea("76", "Overbooking vs waitlist", [
    ["versus", "Overbooking vs waitlist", [
      T(["Overbooking", "vs", "*waitlist*"], 3, "Which is smarter?"),
      VS(["Overbook", ["Two clients, one chair", "Someone waits angry", "~Bad reviews~"]], ["Waitlist", ["One client per slot", "Refill only on cancel", "*Everyone happy*"]]),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["poll", "Have you ever overbooked?", [
      T(["Owners:", "*ever double-booked*", "on purpose?"], 4),
      PL("Be honest 😅", [["Yes, often", 24], ["Once. Never again", 47], ["Never", 29]]),
      T(["There's a", "*calmer way.*"], 3),
      OPEN(),
    ], { cta: CTA.comment }],
    ["story", "The overbooking disaster", [
      T(["4 PM.", "*Both clients showed up.*"], 3),
      CH([["i", "hi I'm here for 4!"], ["i", "hi I'm also here for 4??"]], 5, "Reception"),
      T(["~Awkward.~"], 2),
      T(["Waitlists only fill", "*empty slots.*"], 3),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["quickfire", "Overbook = gamble", [
      TK("Overbooking is:", ["a bet", "a risk", "a fight", "*unnecessary*"]),
      T(["Book once.", "*Refill on cancel.*"], 3),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["checklist", "Why waitlists beat overbooking", [
      T(["Why waitlists", "*beat overbooking*"], 3),
      CK(undefined, ["No *double* clients", "No *awkward* waits", "Only fills *real gaps*", "Clients feel *lucky*, not rushed"], 7),
    ], { cta: CTA.save }],
  ]),

  ...idea("77", "3 numbers every appointment business should track", [
    ["list", "3 numbers to track", [
      T(["3 numbers every", "appointment business", "*should track*"], 4),
      RK(1, "*Fill rate*", "Booked slots ÷ open slots"),
      RK(2, "*No-show rate*", "No-shows ÷ bookings"),
      RK(3, "*Refill rate*", "Cancels refilled ÷ cancels"),
      T(["Track these.", "*Fix the lowest.*"], 3),
    ], { cta: CTA.save }],
    ["numbers", "Your refill rate, explained", [
      T(["The number nobody tracks:", "*refill rate*"], 4),
      ST("Cancels this month (example)", 20, "", "", ""),
      ST("Refilled", 4, "~That's 20%.~", "", ""),
      T(["Get it to *70%*", "and the year changes."], 3),
      OPEN(),
    ], { cta: CTA.save }],
    ["quickfire", "Fill · No-show · Refill", [
      TK("Track:", ["Fill rate", "No-show rate", "*Refill rate*"]),
      CK(undefined, ["Fill rate: *how full?*", "No-show rate: *how flaky?*", "Refill rate: *how fast you recover*"], 6),
    ], { cta: CTA.save }],
    ["poll", "Which do you track?", [
      T(["Which number", "*do you track?*"], 3),
      PL("Vote 👇", [["Fill rate", 46], ["No-show rate", 39], ["Refill rate", 15]]),
      T(["Refill rate is", "*the one that pays.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["checklist", "Monday numbers check", [
      T(["Every Monday,", "*check 3 numbers*"], 3),
      CK(undefined, ["Last week's *fill rate*", "Last week's *no-shows*", "How many cancels *you refilled*"], 6),
      T(["5 minutes.", "*Big difference.*"], 3),
    ], { cta: CTA.save }],
  ]),

  ...idea("78", "How to reply to ‘can I come earlier?’", [
    ["chat", "“Can I come earlier?”", [
      T(["“Can I come", "*earlier?*”"], 3, "Best reply"),
      CH([["i", "hey, can I come earlier this week?"], ["o", "Fully booked right now, but I'll put you on our *waitlist*. If anything opens, you get it first 💚"], ["i", "perfect!!"]], 7),
      T(["That's a", "*waitlist sign-up.*"], 3),
      CLAIM("Thursday:\n*it opened.*", "A Thursday 3:00 PM slot"),
    ], { cta: CTA.save }],
    ["versus", "“Sorry, full” vs the waitlist reply", [
      T(["Two replies to", "*“any earlier?”*"], 3),
      VS(["“Sorry, full”", ["Conversation ends", "They book elsewhere", "~Lost~"]], ["“Waitlist?”", ["They say yes", "You fill next cancel", "*Won*"]]),
    ], { cta: CTA.save }],
    ["quickfire", "Every “earlier?” is a gift", [
      TK("“Can I come earlier?” =", ["a request", "a lead", "*a refill*"]),
      T(["Never say just", "~“sorry, full.”~"], 3),
      OPEN("Next cancel?\n*They're first.*"),
    ], { cta: CTA.save }],
    ["numbers", "Earlier-requests are money", [
      T(["How many people ask", "*“any earlier?”*"], 3),
      ST("Per week (example)", 6, "", "", " people"),
      ST("Cancels you could refill", 6, "*That's your waitlist.*", "", ""),
      ...DEMO(),
    ], { cta: CTA.save }],
    ["checklist", "Turn requests into sign-ups", [
      T(["Turn “earlier?” into", "*a waitlist*"], 3),
      CK(undefined, ["Say *yes* to the list", "Note their *flexible days*", "Ping them *the moment* a slot opens"], 6),
      CLAIM(),
    ], { cta: CTA.save }],
  ]),
];
