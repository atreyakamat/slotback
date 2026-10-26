// Movie-dialogue reels: Pexels stock clips with a famous film line as on-screen
// text. No film footage or audio is used, only the line, meme-style.

export type MovieScene = {
  clip: string; // Pexels id, file at public/stock/<id>.mp4
  sec: number; // length on screen
  from?: number; // seconds into the clip
  focus?: number; // horizontal crop centre for 16:9 clips, 0-100
  zoom?: "in" | "out";
  pan?: number;
  mood?: "cold";
  sub?: [who: string, text: string];
  big?: string;
  notif?: [from: string, text: string];
  chip?: string;
  // Motion-graphics layers (see fx.tsx).
  leak?: boolean;
  stamp?: string;
  title?: [kicker: string, text: string];
  count?: [label: string, to: number];
  split?: { b: string; fromB?: number; labels: [string, string]; win?: 0 | 1 };
};

// Atreya's songs live in public/music (gitignored). The bass drop at `drop`
// seconds lands on the cut into scenes[dropScene]; scene lengths snap to whole beats of `bpm`.
export type Song = { file: string; name: string; drop: number; dropScene: number; bpm: number };

export type MovieReel = { id: string; title: string; film: string; tag: string; cta: string; song: Song; scenes: MovieScene[] };

const DEMO = "DM “DEMO” for a free demo";

export const movieReels: MovieReel[] = [
  {
    id: "m01-kitne-cancel-hue",
    title: "Kitne cancel hue?",
    film: "Sholay (1975)",
    tag: "Sholay, salon edition",
    cta: DEMO,
    song: { file: "music/struct-slowed.mp3", name: "STRUCT (Slowed)", drop: 29.1, dropScene: 0, bpm: 117.5 },
    scenes: [
      { clip: "8626657", sec: 2.2, from: 0.5, zoom: "in", big: "Kitne\n*cancel* hue?" },
      { clip: "6763337", sec: 2.6, from: 2, sub: ["Reception", "Do, sardar. *4 baje* aur *5 baje* wale."] },
      { clip: "8626657", sec: 2.4, from: 4, zoom: "out", mood: "cold", sub: ["Owner", "Do cancel… aur tum log *phone* laga rahe ho?"] },
      { clip: "7682763", sec: 2.4, from: 3, focus: 40, mood: "cold", sub: ["", "Riya ❌ Sana ❌ Meera ❌"] },
      { clip: "7592117", sec: 2.4, from: 4, notif: ["SlotBack", "Riya claimed your 4:00 PM slot ✅"] },
      { clip: "5450148", sec: 2.6, from: 3, zoom: "out", sub: ["", "Slot bhar gaya. *Bina ek call kiye.*"] },
    ],
  },
  {
    id: "m02-picture-abhi-baaki-hai",
    title: "Picture abhi baaki hai",
    film: "Om Shanti Om (2007)",
    tag: "Om Shanti Om, salon edition",
    cta: DEMO,
    song: { file: "music/paixao-sped-up.mp3", name: "PAIXÃO (Sped Up)", drop: 50.7, dropScene: 2, bpm: 136 },
    scenes: [
      { clip: "6670766", sec: 2.4, from: 1, mood: "cold", notif: ["Client", "So sorry, can't make it at 4 today 🙏"] },
      { clip: "7987956", sec: 2.2, from: 2, focus: 55, mood: "cold", sub: ["Owner", "4 baje ka slot… *gaya.*"] },
      { clip: "8626657", sec: 2.4, from: 2, zoom: "in", big: "End mein sab\n*theek* ho jaata hai" },
      { clip: "7682763", sec: 2.2, from: 6, focus: 45, sub: ["", "Aur agar theek na ho… toh woh *the end* nahi hai."] },
      { clip: "7592117", sec: 2.4, from: 9, notif: ["SlotBack", "Waitlist pinged. Sana claimed 4:00 PM ✅"] },
      { clip: "7754397", sec: 2.6, from: 1, zoom: "out", big: "Picture abhi\n*baaki hai*, mere dost" },
    ],
  },
  {
    id: "m03-mogambo-khush-hua",
    title: "Mogambo khush hua",
    film: "Mr. India (1987)",
    tag: "Mr. India, salon edition",
    cta: DEMO,
    song: { file: "music/cavuca-funk.mp3", name: "Cavuca Funk", drop: 36.7, dropScene: 2, bpm: 129 },
    scenes: [
      { clip: "6670766", sec: 2.2, from: 3, mood: "cold", notif: ["Client", "Bhaiya, aaj nahi aa paunga"] },
      { clip: "7987956", sec: 2.2, from: 6, focus: 55, mood: "cold", sub: ["", "Owner ka mood: 📉"] },
      { clip: "7682763", sec: 2.2, from: 9, focus: 40, sub: ["", "One tap. *Waitlist* ko message gaya."] },
      { clip: "7592117", sec: 2.2, from: 13, chip: "Claimed ✅" },
      { clip: "7686515", sec: 2.4, from: 1, zoom: "out", sub: ["", "Kursi *phir se full.*"] },
      { clip: "7682763", sec: 2.8, from: 12, focus: 45, zoom: "in", big: "Mogambo\n*khush* hua" },
    ],
  },
  {
    id: "m04-houston-we-have-a-problem",
    title: "Houston, we have a problem",
    film: "Apollo 13 (1995)",
    tag: "Apollo 13, salon edition",
    cta: DEMO,
    song: { file: "music/windows-in-brazil.mp3", name: "WINDOWS IN BRAZIL", drop: 9.4, dropScene: 1, bpm: 86 }, // half-time of 172
    scenes: [
      { clip: "7987956", sec: 2.2, from: 9, focus: 55, mood: "cold", notif: ["Client", "Can't make it at 4, sorry!"] },
      { clip: "8626657", sec: 2.4, from: 6, zoom: "in", mood: "cold", big: "Houston,\nwe have a *problem*" },
      { clip: "6763337", sec: 2.4, from: 8, sub: ["Mission control", "Open the slot. *Ping the waitlist.*"] },
      { clip: "7592117", sec: 2.2, from: 16, chip: "4:00 PM claimed" },
      { clip: "4178099", sec: 2.4, from: 2, zoom: "out", sub: ["", "Chair full. *Mission saved.*"] },
      { clip: "5450148", sec: 2.4, from: 9, zoom: "in", big: "Houston,\n*problem solved*" },
    ],
  },
];
