import { TrackId } from "../series/types";

// Series 04 is kinetic typography: a hard cut on (almost) every beat, a new
// colour world on every cut, and words that swap in place. Text accepts the
// same markup as the series engine: *highlight*, ~alert~, _muted_.

export type EnvKind =
  | "solid"
  | "stripes"
  | "grid"
  | "dots"
  | "burst"
  | "split"
  | "checker"
  | "rings"
  | "scan"
  | "type";

export type ThemeId = "lime" | "ink" | "cream" | "red" | "green" | "black";

export type El =
  | { t: "word"; text: string; size?: number; mono?: boolean; kicker?: string }
  // `lead` + before -> after + `trail`; the swap happens halfway through.
  | { t: "swap"; lead?: string; before: string; after: string; trail?: string; size?: number }
  | { t: "stack"; lines: string[]; size?: number }
  | { t: "chat"; title?: string; msgs: { me?: boolean; text: string }[] }
  | { t: "bar"; label: string; from: number; to: number; note?: string }
  | { t: "num"; from: number; to: number; prefix?: string; suffix?: string; label?: string; note?: string }
  | { t: "chart"; ticker: string; pts: number[]; note?: string }
  | { t: "receipt"; title: string; lines: [string, string][]; total?: [string, string]; stamp?: string }
  // 12 hour slots: b booked, x cancelled, r refilled, e empty.
  | { t: "ring"; slots: string; label: string; sub?: string }
  | { t: "grid"; title: string; cells: string[]; marks: number[]; cols?: number; bingo?: string }
  | { t: "tiers"; rows: { tier: string; text: string }[] }
  | { t: "slots"; title?: string; land: [string, string, string]; win?: string }
  | { t: "weather"; icon: string; big: string; line: string; place?: string }
  | { t: "score"; left: string; right: string; before: [number, number]; after: [number, number]; clock: string; note?: string }
  | { t: "def"; word: string; say: string; pos: string; text: string }
  | { t: "emoji"; chars: string[]; caption?: string }
  | { t: "timer"; label: string; from: number; to: number; splits?: string[] }
  | { t: "choice"; a: string; b: string; pick: "a" | "b"; q?: string }
  | { t: "quiz"; before: string; blank: string; after?: string; answer: string };

export type KCut = {
  // Length in beats of the reel's track, "drop" to run to the next drop, or
  // "rest" to run until the reel reaches its target length.
  beats: number | "drop" | "rest";
  el: El;
  // Pin a colour world or a background for this cut; otherwise they cycle.
  theme?: ThemeId;
  env?: EnvKind;
};

export type KReel = {
  id: string;
  number: number;
  title: string;
  track: TrackId;
  songStart: number;
  drop: number;
  laterDrops?: number[];
  // The hook runs from the first frame to the drop.
  hook: El;
  hookTheme?: ThemeId;
  cuts: KCut[];
  cta?: string;
  badge?: string;
  seed: number;
  // Target length in seconds including the end card (default 26).
  length?: number;
};
