import { CH, CHAIR, CK, CLAIM, COUNT, CTA, DEMO, FLIP, GR, idea, OPEN, PL, RK, SG, ST, T, TK, VS } from "./build";
import { PoolReel } from "./types";

// Pillar 5 · Goa local (13:00 slot). Ideas #95–102.
export const goa: PoolReel[] = [
  ...idea("95", "Panaji vs Margao: who cancels more?", [
    ["poll", "Panaji vs Margao: who cancels more?", [
      T(["Panaji vs Margao:", "*who cancels more?*"], 4, "Goa debate"),
      PL("Vote 👇", [["Panaji", 48], ["Margao", 52]]),
      T(["Comment your city.", "*Settle it.*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["versus", "Panaji excuses vs Margao excuses", [
      T(["Cancellation excuses:", "*North vs South*"], 4),
      VS(["Panaji", ["“Traffic at Patto”", "“No parking”", "“Meeting ran late”"]], ["Margao", ["“Market day”", "“Train got late”", "“Lunch went long”"]], undefined),
      T(["Same empty chair.", "*Same fix.*"], 3),
      OPEN(),
    ], { cta: CTA.comment, badge: "Just for fun" }],
    ["quickfire", "Goa city cancel ranking", [
      TK("Who cancels most?", ["Panaji", "Margao", "Mapusa", "Vasco", "*You tell us*"]),
      T(["Comment your city", "*👇*"], 3),
    ], { cta: CTA.comment }],
    ["rank", "Ranking Goa cities by excuses", [
      T(["Ranking Goa cities", "*by best excuse*"], 3, "Just for fun"),
      RK(3, "Vasco", "“Ship came in.”", 5),
      RK(2, "Mapusa", "“Friday market.”", 7),
      RK(1, "Panaji", "“Couldn't find parking.”", 9),
      T(["Your city?", "*Comment below.*"], 3),
    ], { cta: CTA.comment }],
    ["chat", "Group chat argument", [
      T(["Owners' group chat,", "*right now*"], 3),
      CH([["i", "panaji clients cancel the most 😤"], ["i", "nah margao is worse"], ["i", "mapusa on fridays tho 💀"], ["o", "just refill them all 🙃"]], 8),
      ...DEMO(),
    ], { cta: CTA.comment, badge: "Just for fun" }],
  ]),

  ...idea("96", "Goa's best salon streets (and their empty 4 PMs)", [
    ["story", "Goa's salon streets at 4 PM", [
      T(["Goa's best", "*salon streets*"], 3),
      TK("At 4 PM:", ["18th June Rd", "MG Road", "Calangute", "*empty chairs*"]),
      CHAIR("Every street,\n~same 4 PM gap.~", "EMPTY"),
      ...DEMO(),
    ], { cta: CTA.demo }],
    ["quickfire", "Salon street tour", [
      TK("Salon street tour:", ["Panaji", "Porvorim", "Mapusa", "Margao", "*yours?*"]),
      T(["Tag your street.", "*We'll visit.*"], 3),
    ], { cta: CTA.comment }],
    ["poll", "Best salon area in Goa?", [
      T(["Best salon area", "*in Goa?*"], 3),
      PL("Vote 👇", [["Panaji", 36], ["Porvorim", 28], ["Margao", 36]]),
      T(["Owners there:", "*DM “DEMO”.*"], 3),
    ], { cta: CTA.comment }],
    ["checklist", "On every salon street", [
      T(["On every salon street", "*you'll find*"], 3),
      CK(undefined, ["A *ring light* in the window", "A *full* Saturday", "An *empty* Tuesday", "A *waitlist* nobody uses"], 7),
      OPEN(),
    ], { cta: CTA.demo }],
    ["numbers", "One street, one week of gaps", [
      T(["One street.", "*One week.*"], 3),
      COUNT("Example: 8 salons, ₹900 slots", [[900, "One gap"], [7200, "One gap each"], [28800, "4 gaps each"]], "~One street.~", 6),
    ], { cta: CTA.demo }],
  ]),

  ...idea("97", "Susegad time vs appointment time", [
    ["versus", "Susegad time vs appointment time", [
      T(["Susegad time", "vs", "*appointment time*"], 4),
      VS(["Appointment", ["10:00 AM"]], ["Susegad", ["*10:45-ish*"]], undefined),
      T(["Love the vibe.", "*Protect the diary.*"], 3),
      OPEN("45 min late?\n*Waitlist takes it.*"),
    ], { cta: CTA.comment }],
    ["quickfire", "10 AM Goa time", [
      TK("10 AM Goa time =", ["10:15", "10:30", "10:45", "*“on the way”*"]),
      T(["Have a backup", "*on the waitlist.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["chat", "“5 min, coming”", [
      T(["“5 min,", "*coming*”"], 3, "Goa classic"),
      CH([["i", "5 min, coming!"], ["i", "just leaving now"], ["i", "ok actually just woke up 😅"], ["i", "tomorrow?"]], 8),
      T(["Susegad is a vibe.", "~Not a booking.~"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["stages", "The susegad scale", [
      T(["The *susegad*", "scale"], 3),
      SG(1, 4, "On time", "*Rare.*"),
      SG(2, 4, "+15", "Normal."),
      SG(3, 4, "+45", "Very Goa."),
      SG(4, 4, "Tomorrow?", "~Legendary.~"),
      OPEN(),
    ], { cta: CTA.comment }],
    ["poll", "How late is “on time” in Goa?", [
      T(["How late counts as", "*on time* in Goa?"], 3),
      PL("Vote 👇", [["5 min", 21], ["15 min", 46], ["30 min 😅", 33]]),
      T(["Set a *15-minute rule.*", "Then refill."], 3),
    ], { cta: CTA.comment }],
  ]),

  ...idea("98", "Tourist season = last-minute bookings", [
    ["story", "Tourist season = last-minute bookings", [
      T(["Tourist season", "= *last-minute bookings*"], 4, "Nov–Feb"),
      CH([["i", "hi! any slot today? leaving tomorrow"], ["i", "anything this evening?? 🙏"]], 5),
      T(["They want *today.*", "You have *cancels.*"], 3),
      T(["Match them.", "*Waitlist.*"], 3),
      ...DEMO("A 6:00 PM slot"),
    ], { cta: CTA.demo }],
    ["checklist", "Get ready for Nov–Feb", [
      T(["Tourist season", "*prep list*"], 3),
      CK(undefined, ["Add *tourists* to the waitlist", "Keep the link in your *bio*", "Reply to *“any slot today?”* fast", "Refill cancels *in minutes*"], 7),
    ], { cta: CTA.save }],
    ["numbers", "Tourists want today", [
      T(["How many tourists ask", "*“any slot today?”*"], 3),
      ST("Per week, peak season", 15, "", "", " asks"),
      ST("Your cancels per week", 5, "*Perfect match.*", "", ""),
      ...DEMO(),
    ], { cta: CTA.demo, badge: "Example numbers" }],
    ["versus", "Locals vs tourists", [
      T(["Locals vs", "*tourists*"], 3),
      VS(["Locals", ["Book ahead", "Sometimes cancel"]], ["Tourists", ["Want *today*", "*Fill those cancels*"]]),
      CLAIM(),
    ], { cta: CTA.demo }],
    ["quickfire", "Season mode: on", [
      TK("Season mode:", ["Tourists", "Walk-ins", "Last-minute", "*Waitlist*"]),
      CLAIM("Tourist claims\n*tonight's cancel.*", "A 7:00 PM slot"),
    ], { cta: CTA.demo }],
  ]),

  ...idea("99", "Shout-out to Goa's hardest-working owners", [
    ["story", "To Goa's hardest-working owners", [
      T(["To Goa's", "*hardest-working*", "salon owners"], 4),
      TK("You:", ["open at 9", "skip lunch", "close at 9", "*do it again*"]),
      T(["You deserve", "*full chairs.*"], 3),
      ...DEMO(),
    ], { cta: CTA.share }],
    ["quickfire", "Tag an owner who never stops", [
      TK("Owner life:", ["clients", "staff", "stock", "WhatsApp", "*no break*"]),
      T(["Tag one who", "*never stops* 👇"], 3),
    ], { cta: "Tag an owner below 👇" }],
    ["checklist", "Things owners do nobody sees", [
      T(["What owners do", "*that nobody sees*"], 3),
      CK(undefined, ["Reply to DMs at *midnight*", "Cover for *sick staff*", "Chase *no-shows*", "Still smile at *4 PM*"], 7),
      T(["Let us take", "*one job off you.*"], 3),
    ], { cta: CTA.share }],
    ["chat", "A message for owners", [
      T(["A message for", "*every Goa owner*"], 3),
      CH([["o", "You built something real. 💚"], ["o", "We just want to fill *your* empty slots."]], 5),
      ...DEMO(),
    ], { cta: CTA.share }],
    ["poll", "Hardest part of owning a salon?", [
      T(["Hardest part of", "*owning a salon?*"], 3),
      PL("Vote 👇", [["Staff", 34], ["Cancellations", 39], ["Marketing", 27]]),
      T(["We can help", "*with one.*"], 3),
    ], { cta: CTA.comment }],
  ]),

  ...idea("100", "Konkani phrase of the day: ‘cancel zalem’", [
    ["story", "Konkani phrase of the day", [
      T(["Konkani phrase", "*of the day*"], 3),
      T(["*“Cancel zalem.”*"], 3),
      T(["Meaning:", "~“It got cancelled.”~"], 3),
      T(["Owner translation:", "*“Refill it.”*"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["quickfire", "Cancel zalem → refill zalem", [
      TK("Today's phrase:", ["Cancel zalem", "Cancel zalem", "*Refill zalem*"]),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["chat", "“Cancel zalem” in the wild", [
      T(["Spotted in", "*a Goa WhatsApp*"], 3),
      CH([["i", "sorry baba, cancel zalem 🙏"], ["o", "no problem! *refill zatta* 😄"]], 5),
      FLIP("*Refilled.*", "4:00 PM", "Filled · waitlist"),
    ], { cta: CTA.comment }],
    ["poll", "Your favourite Konkani owner phrase?", [
      T(["Your favourite", "*owner phrase?*"], 3),
      PL("Vote 👇", [["“Cancel zalem”", 44], ["“Yeta, yeta”", 31], ["“Faleam”", 25]]),
      T(["Teach us more", "*in the comments.*"], 3),
    ], { cta: CTA.comment }],
    ["stages", "From cancel zalem to refill zalem", [
      T(["Two phrases,", "*one tap apart*"], 3),
      SG(1, 2, "Cancel zalem", "~Slot empty.~"),
      SG(2, 2, "Refill zalem", "*Slot full.*"),
      ...DEMO(),
    ], { cta: CTA.demo }],
  ]),

  ...idea("101", "Rain, traffic, fish curry nap: Goa reasons", [
    ["rank", "Goa cancellation reasons, ranked", [
      T(["Goa cancellation reasons,", "*ranked*"], 4, "Just for fun"),
      RK(4, "Rain 🌧️", "Every monsoon.", 6),
      RK(3, "Traffic at the bridge 🚗", "Every evening.", 7),
      RK(2, "“Feast in the village” ⛪", "Every Sunday.", 8),
      RK(1, "Fish curry nap 🐟😴", "Undefeated.", 10),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["pack", "Goa cancel bingo", [
      T(["Goa cancel", "*bingo*"], 3),
      GR("How many this week?", [["🌧️", "Rain"], ["🚗", "Bridge traffic"], ["🐟", "Fish curry nap"], ["⛪", "Village feast"], ["🛵", "Scooter puncture"], ["🏖️", "“Beach day”"]], 7),
      T(["Full card?", "*Refill them all.*"], 3),
    ], { cta: CTA.comment }],
    ["quickfire", "Reasons in 5 seconds", [
      TK("Why they cancelled:", ["rain", "traffic", "feast", "*fish curry nap*"]),
      T(["Can't fix the nap.", "*Can fill the slot.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["poll", "Most Goan excuse?", [
      T(["Most *Goan*", "cancel excuse?"], 3),
      PL("Vote 👇", [["Fish curry nap", 47], ["Rain", 29], ["Feast", 24]]),
      T(["Comment the one", "*you heard this week.*"], 3),
    ], { cta: CTA.comment }],
    ["chat", "The fish curry nap", [
      T(["Real ones know", "*this message*"], 3),
      CH([["i", "sorry I'll have to skip"], ["i", "had fish curry rice"], ["i", "can't move 😴🐟"]], 6),
      T(["Respect.", "*Now refill it.*"], 3),
      ...DEMO("A 3:00 PM slot"),
    ], { cta: CTA.comment }],
  ]),

  ...idea("102", "Every Goa owner knows this WhatsApp: ‘bhai aaj nahi’", [
    ["chat", "“Bhai aaj nahi”", [
      T(["Every Goa owner", "knows *this message*"], 4),
      CH([["i", "bhai aaj nahi ho payega 🙏"], ["i", "kal pakka"]], 5),
      T(["“Kal pakka”", "~(it's never kal)~"], 3),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["quickfire", "Aaj nahi, kal pakka", [
      TK("Client says:", ["aaj nahi", "kal pakka", "parso?", "*…*"]),
      T(["Don't wait for kal.", "*Refill aaj.*"], 3),
      CLAIM(),
    ], { cta: CTA.comment }],
    ["stages", "The ‘kal pakka’ journey", [
      T(["The *“kal pakka”*", "journey"], 3),
      SG(1, 3, "Day 1", "“Aaj nahi.”"),
      SG(2, 3, "Day 2", "“Kal pakka.”"),
      SG(3, 3, "Day 3", "~Seen. No reply.~"),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["poll", "How often is it really ‘kal pakka’?", [
      T(["When they say *“kal pakka”*,", "how often do they come?"], 4),
      PL("Be honest", [["Always", 8], ["Sometimes", 39], ["Never 💀", 53]]),
      ...DEMO(),
    ], { cta: CTA.comment }],
    ["versus", "Wait for kal vs refill aaj", [
      T(["Wait for kal,", "or *refill aaj?*"], 3),
      VS(["Wait", ["Empty today", "Maybe tomorrow", "~Probably not~"]], ["Refill", ["Waitlist today", "*Full chair*", "Kal is a bonus"]]),
    ], { cta: CTA.demo }],
  ]),
];
