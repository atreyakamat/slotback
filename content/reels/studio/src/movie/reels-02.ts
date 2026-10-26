import { MovieReel } from "./reels";

// Movie-dialogue batch 2 (m05-m14): ten more lines, using the motion-graphics
// layers from fx.tsx. Subtitle marks: *lime*, ~strike~, _circle_, ^underline^.

const DEMO = "DM “DEMO” for a free demo";
const STRUCT = { file: "music/struct-slowed.mp3", name: "STRUCT (Slowed)", bpm: 117.5 };
const PAIXAO = { file: "music/paixao-sped-up.mp3", name: "PAIXÃO (Sped Up)", bpm: 136 };
const CAVUCA = { file: "music/cavuca-funk.mp3", name: "Cavuca Funk", bpm: 129 };
const WINDOWS = { file: "music/windows-in-brazil.mp3", name: "WINDOWS IN BRAZIL", bpm: 86 }; // half-time of 172

export const movieReels02: MovieReel[] = [
  {
    id: "m05-bade-bade-salons-mein",
    title: "Bade bade salons mein…",
    film: "Dilwale Dulhania Le Jayenge (1995)",
    tag: "DDLJ, salon edition",
    cta: DEMO,
    song: { ...STRUCT, drop: 49.7, dropScene: 1 },
    scenes: [
      { clip: "7754397", sec: 2.2, from: 3, mood: "cold", notif: ["Client", "Sorry yaar, 4 baje nahi aa paungi"] },
      { clip: "7148117", sec: 3.0, from: 1, zoom: "in", leak: true, big: "Bade bade salons mein\naisi *chhoti chhoti*\nbaatein hoti rehti hain" },
      { clip: "8134512", sec: 2.4, from: 2, mood: "cold", sub: ["Owner", "Chhoti baat? ~₹1,200~ ka slot tha!"] },
      { clip: "7682763", sec: 2.4, from: 1, focus: 40, sub: ["", "SlotBack ne _waitlist_ ko ping kiya."] },
      { clip: "7592117", sec: 2.2, from: 2, chip: "4:00 PM claimed ✅" },
      { clip: "7148117", sec: 2.6, from: 5, zoom: "out", sub: ["", "Chhoti baat. *Chhota sa fix.*"] },
    ],
  },
  {
    id: "m06-mere-paas-waitlist-hai",
    title: "Mere paas waitlist hai",
    film: "Deewaar (1975)",
    tag: "Deewaar, salon edition",
    cta: DEMO,
    song: { ...CAVUCA, drop: 51.6, dropScene: 2 },
    scenes: [
      { clip: "7033786", sec: 2.2, from: 8, title: ["Two salon owners", "One empty 4\u00A0PM"] },
      { clip: "7924462", sec: 3.0, from: 1, sub: ["Owner 1", "Mere paas ^Instagram^ hai, ^WhatsApp^ hai, ^diary^ hai… tumhare paas kya hai?"] },
      { clip: "7550915", sec: 2.4, from: 1, zoom: "in", leak: true, big: "Mere paas\n*waitlist* hai." },
      { clip: "7924462", sec: 3.0, from: 4, split: { b: "5450148", fromB: 2, labels: ["Calling 10 people", "One tap"], win: 1 } },
      { clip: "8627656", sec: 2.4, from: 10, zoom: "out", sub: ["", "Empty chair? *Filled.*"] },
    ],
  },
  {
    id: "m07-naam-hai-slotback",
    title: "Naam hai SlotBack",
    film: "Shahenshah (1988)",
    tag: "Shahenshah, salon edition",
    cta: DEMO,
    song: { ...WINDOWS, drop: 35.8, dropScene: 2 },
    scenes: [
      { clip: "6670766", sec: 2.2, from: 0.5, mood: "cold", notif: ["Client", "Can't come today, sorry 🙏"] },
      { clip: "29862379", sec: 2.4, from: 1, mood: "cold", sub: ["", "3:52 PM. _4:00_ ka slot khaali."] },
      { clip: "7148117", sec: 3.2, from: 2, zoom: "in", leak: true, big: "Rishte mein toh hum\ntumhari *cancellations*\nke baap lagte hain" },
      { clip: "7550915", sec: 2.4, from: 1, zoom: "in", big: "Naam hai\n*SlotBack*" },
      { clip: "4178099", sec: 2.4, from: 4, zoom: "out", sub: ["", "Waitlist pinged. *Chair full.*"] },
    ],
  },
  {
    id: "m08-pushpa-i-hate-empty-chairs",
    title: "Pushpa, I hate empty chairs",
    film: "Amar Prem (1972)",
    tag: "Amar Prem, salon edition",
    cta: DEMO,
    song: { ...PAIXAO, drop: 29.2, dropScene: 2 },
    scenes: [
      { clip: "6670484", sec: 2.4, from: 1, mood: "cold", sub: ["Pushpa", "Unhone ~cancel~ kar diya…"] },
      { clip: "7033786", sec: 2.2, from: 1, mood: "cold", sub: ["", "4:00 PM. Kursi khaali. Ghadi chal rahi hai."] },
      { clip: "8627656", sec: 3.0, from: 1, zoom: "in", leak: true, big: "Pushpa,\nI hate\n*empty chairs*" },
      { clip: "7682763", sec: 2.4, from: 4, focus: 40, sub: ["", "Ek tap. _Waitlist_ ko message."] },
      { clip: "7592117", sec: 2.2, from: 6, chip: "Claimed ✅" },
      { clip: "5450148", sec: 2.4, from: 6, zoom: "out", sub: ["", "Aansu pocho, Pushpa. *Slot bhar gaya.*"] },
    ],
  },
  {
    id: "m09-all-is-well",
    title: "All is well",
    film: "3 Idiots (2009)",
    tag: "3 Idiots, salon edition",
    cta: DEMO,
    song: { ...CAVUCA, drop: 14.6, dropScene: 3 },
    scenes: [
      { clip: "7534960", sec: 2.2, from: 1, mood: "cold", notif: ["Client", "Bro, aaj ka cancel kar do"] },
      { clip: "8134512", sec: 2.2, from: 5, mood: "cold", stamp: "Cancelled" },
      { clip: "29862379", sec: 2.2, from: 4, mood: "cold", sub: ["", "Dil ko samjhao…"] },
      { clip: "8627656", sec: 2.8, from: 4, zoom: "in", leak: true, big: "Aal izz\n*well*" },
      { clip: "7592117", sec: 2.4, from: 10, notif: ["SlotBack", "Meera claimed 4:00 PM ✅"] },
      { clip: "8631872", sec: 2.6, from: 1, zoom: "out", sub: ["", "Sach mein. *All is well.*"] },
    ],
  },
  {
    id: "m10-namumkin-tha-ab-nahi",
    title: "Mushkil hi nahi, namumkin",
    film: "Don (2006)",
    tag: "Don, salon edition",
    cta: DEMO,
    song: { ...STRUCT, drop: 83.3, dropScene: 1 },
    scenes: [
      { clip: "7924462", sec: 2.2, from: 3, mood: "cold", sub: ["", "Last-minute cancel. Sirf _10_ minute baaki."] },
      { clip: "7534960", sec: 3.2, from: 6, zoom: "in", leak: true, big: "Last-minute slot bharna\nmushkil hi nahi…\n*namumkin* hai" },
      { clip: "7682763", sec: 2.4, from: 10, focus: 40, sub: ["", "Tha. ~Namumkin~ *One tap.*"] },
      { clip: "7924462", sec: 3.0, from: 6, split: { b: "7592117", fromB: 12, labels: ["Calling 10 regulars", "SlotBack"], win: 1 } },
      { clip: "7686515", sec: 2.4, from: 3, zoom: "out", sub: ["", "Don ka chair *kabhi khaali nahi rehta.*"] },
    ],
  },
  {
    id: "m11-khaali-kursi-se-darr-lagta-hai",
    title: "Khaali kursi se darr lagta hai",
    film: "Dabangg (2010)",
    tag: "Dabangg, salon edition",
    cta: DEMO,
    song: { ...PAIXAO, drop: 71.8, dropScene: 1 },
    scenes: [
      { clip: "7534960", sec: 2.2, from: 3, mood: "cold", notif: ["Client", "Sorry bhai, can't make it 🙏"] },
      { clip: "7924462", sec: 3.4, from: 3, zoom: "in", leak: true, big: "Cancel se darr nahi\nlagta sahab…\n*khaali kursi* se lagta hai" },
      { clip: "7033786", sec: 2.2, from: 4, mood: "cold", sub: ["", "Har khaali ghante ka _₹_ jaata hai."] },
      { clip: "7682763", sec: 2.4, from: 7, focus: 45, sub: ["", "Isliye: open slot, *waitlist ping.*"] },
      { clip: "7686515", sec: 2.4, from: 4, zoom: "out", sub: ["", "Kursi full. *Darr khatam.*"] },
    ],
  },
  {
    id: "m12-waitlist-wahi-se-shuru",
    title: "Line wahi se shuru hoti hai",
    film: "Kaalia (1981)",
    tag: "Kaalia, salon edition",
    cta: DEMO,
    song: { ...WINDOWS, drop: 44.7, dropScene: 1 },
    scenes: [
      { clip: "8627656", sec: 2.2, from: 12, title: ["The SlotBack salon", "A cancel just came in"] },
      { clip: "7550915", sec: 3.2, from: 1, zoom: "in", leak: true, big: "Hum jahan khade ho jaate hain…\n*waitlist* wahi se\nshuru hoti hai" },
      { clip: "7592117", sec: 2.2, from: 14, notif: ["SlotBack", "Your 4:00 PM is open. Tap to claim"] },
      { clip: "7754397", sec: 2.4, from: 5, sub: ["", "Pehla tap _jeet-ta_ hai."] },
      { clip: "4178099", sec: 2.4, from: 6, zoom: "out", sub: ["", "Slot gaya? *Line ready hai.*"] },
    ],
  },
  {
    id: "m13-ill-be-back",
    title: "I'll be back",
    film: "The Terminator (1984)",
    tag: "Terminator, salon edition",
    cta: DEMO,
    song: { ...STRUCT, drop: 12.6, dropScene: 2 },
    scenes: [
      { clip: "6631330", sec: 2.4, from: 1, mood: "cold", notif: ["Client", "Can't make it today. Next week maybe?"] },
      { clip: "8134512", sec: 2.2, from: 8, mood: "cold", sub: ["Client", "Don't worry…"] },
      { clip: "8134512", sec: 2.6, from: 12, zoom: "in", leak: true, big: "I'll be\n*back*" },
      { clip: "8627656", sec: 2.4, from: 13, sub: ["Owner", "Cool. Your _4:00_ won't wait though."] },
      { clip: "7592117", sec: 2.2, from: 17, chip: "Claimed in one tap" },
      { clip: "8631872", sec: 2.6, from: 4, zoom: "out", sub: ["", "Slot: *already back.*"] },
    ],
  },
  {
    id: "m14-show-me-the-money",
    title: "Show me the money",
    film: "Jerry Maguire (1996)",
    tag: "Jerry Maguire, salon edition",
    cta: DEMO,
    song: { ...CAVUCA, drop: 73.7, dropScene: 1 },
    scenes: [
      { clip: "8627656", sec: 2.2, from: 7, sub: ["Accountant", "Cancellations ka hisaab?"] },
      { clip: "7924462", sec: 2.8, from: 6, zoom: "in", leak: true, big: "Show me\nthe *money!*" },
      { clip: "7735814", sec: 3.0, from: 1, count: ["Refilled slots this month", 18400] },
      { clip: "7682763", sec: 2.4, from: 13, focus: 45, sub: ["", "Har cancel? _Waitlist_ ping. *Filled.*"] },
      { clip: "8631872", sec: 2.6, from: 3, zoom: "out", sub: ["", "Money: *shown.*"] },
    ],
  },
];
