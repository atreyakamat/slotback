import { Angle, PoolReel, PoolShot } from "./types";

// Short builders so each test-pool script reads like a shot list.
// Beat counts are on the 128 BPM grid (1 beat ≈ 0.47 s).

type Pair = [title: string, lines: string[]];
const L = (x: string | string[]) => (Array.isArray(x) ? x : [x]);

export const T = (lines: string | string[], beats = 3, kicker?: string, sub?: string): PoolShot => ({ type: "text", beats, lines: L(lines), kicker, sub });
export const CARD = (lines: string | string[], beats = 4, kicker?: string): PoolShot => ({ type: "text", beats, lines: L(lines), kicker, card: true, size: 92 });
export const TK = (pre: string, words: string[], post?: string): PoolShot => ({ type: "ticker", beats: Math.ceil((words.length * 7 + 14) / 14), pre, words, post });
export const CH = (msgs: [string, string][], beats = 7, title?: string): PoolShot => ({ type: "chat", beats, title, msgs: msgs.map(([s, t]) => [s === "o" || s === "out" ? "out" : "in", t]) });
export const ST = (label: string, value: number, note?: string, prefix = "₹", suffix?: string, beats = 5): PoolShot => ({ type: "stat", beats, label, value, note, prefix, suffix });
export const SG = (i: number, n: number, name: string, line?: string, beats = 3): PoolShot => ({ type: "stage", beats, i, n, name, line });
export const VS = (left: Pair, right: Pair, win: "left" | "right" | undefined = "right", beats = 7): PoolShot => ({ type: "vs", beats, left: { title: left[0], lines: left[1] }, right: { title: right[0], lines: right[1] }, win });
export const PL = (q: string, options: [string, number][], beats = 5): PoolShot => ({ type: "poll", beats, q, options });
export const GR = (title: string, tiles: [string, string][], beats = 6): PoolShot => ({ type: "grid", beats, title, tiles });
export const RK = (n: number, text: string, sub?: string, score?: number, beats = 4): PoolShot => ({ type: "rank", beats, n, text, sub, score });
export const CK = (title: string | undefined, items: string[], beats = 6): PoolShot => ({ type: "check", beats, title, items });

// Product moments from the series engine.
export const NOTIF = (headline: string, message: string, time = "3:52", sender = "Client", beats = 4): PoolShot => ({ type: "notif", beats, headline, sender, message, time });
export const CALLS = (headline: string, names = ["Riya", "Sana", "Meera"], beats = 5): PoolShot => ({ type: "calls", beats, headline, names });
export const OPEN = (headline = "Cancelled?\n*One tap.*", sub?: string, beats = 6): PoolShot => ({ type: "openSlot", beats, headline, sub });
export const CLAIM = (headline = "First tap\n*wins.*", slot = "A 4:00 PM slot", beats = 6): PoolShot => ({ type: "claim", beats, headline, slot });
export const TIMER = (headline = "Who claims\n*first?*", beats = 5): PoolShot => ({ type: "timer", beats, headline, running: true });
export const FLIP = (headline: string, time = "4:00 PM", after = "Filled · waitlist", amount?: string, beats = 5): PoolShot => ({ type: "flip", beats, headline, time, before: "Cancelled", after, amount });
export const COUNT = (label: string, steps: [number, string][], final?: string, beats = 6): PoolShot => ({ type: "counter", beats, label, steps: steps.map(([value, note]) => ({ value, note })), final, tag: "Example numbers" });
export const CHAIR = (headline: string, stamp?: string, filled?: boolean, beats = 4): PoolShot => ({ type: "chair", beats, headline, stamp, filled, dim: !filled });
export const GAP = (headline: string, state: "booked" | "broken" | "refilled", beats = 4): PoolShot => ({ type: "gap", beats, headline, state });
export const QUOTES = (quotes: string[], headline?: string, beats = 5): PoolShot => ({ type: "quotes", beats, headline, quotes });
export const RATE = (text: string, score: number, note?: string, headline?: string, beats = 4): PoolShot => ({ type: "rating", beats, headline, text, score, note });
export const FLAG = (color: "red" | "green", text: string, count?: string, beats = 3): PoolShot => ({ type: "flag", beats, color, text, count });

// The standard "here's the fix" beat: open the slot, someone claims it.
export const DEMO = (slot = "A 4:00 PM slot"): PoolShot[] => [OPEN(), CLAIM("First tap\n*wins.*", slot)];

export const CTA = {
  demo: "DM “DEMO” for a free demo",
  save: "Save this for your next cancel",
  kit: "Free toolkit · link in bio",
  comment: "Comment below 👇",
  follow: "Follow for owner tips",
  share: "Send this to an owner",
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);

// One idea, five scripts. Each script is [angle, title, shots, extra?]; the
// first shot is the hook.
export const idea = (
  key: string,
  name: string,
  variants: [Angle, string, PoolShot[], { cta?: string; badge?: string }?][],
): PoolReel[] =>
  variants.map(([angle, title, [hook, ...shots], extra], i) => ({
    id: `p${key}-v${i + 1}-${slug(title)}`,
    idea: `${key} · ${name}`,
    variant: i + 1,
    title,
    angle,
    hook,
    shots,
    ...extra,
  }));
