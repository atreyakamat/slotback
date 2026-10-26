import { Shot } from "../series/types";

// Test-pool reels run on a fixed 128 BPM grid (14 frames a beat) with no song,
// so Atreya can lay any trending audio over them in Instagram.
// Text props accept the series markup: *lime*, ~red~, _muted_.

export type GlassShot = { beats: number } & (
  | { type: "text"; lines: string[]; kicker?: string; size?: number; sub?: string; card?: boolean }
  | { type: "ticker"; pre?: string; words: string[]; post?: string }
  | { type: "chat"; title?: string; msgs: [side: "in" | "out", text: string][] }
  | { type: "stat"; label: string; value: number; prefix?: string; suffix?: string; note?: string }
  | { type: "stage"; i: number; n: number; name: string; line?: string }
  | { type: "vs"; left: { title: string; lines: string[] }; right: { title: string; lines: string[] }; win?: "left" | "right" }
  | { type: "poll"; q: string; options: [label: string, pct: number][] }
  | { type: "grid"; title: string; tiles: [emoji: string, label: string][] }
  | { type: "rank"; n: number; text: string; sub?: string; score?: number }
  | { type: "check"; title?: string; items: string[] }
);

// Product shots borrowed from the series engine, drawn over the glass backdrop.
type SeriesProduct = Extract<
  Shot,
  { type: "notif" | "calls" | "openSlot" | "claim" | "timer" | "flip" | "counter" | "chair" | "gap" | "quotes" | "rating" | "flag" }
>;
export type ProductShot = SeriesProduct & { beats: number };

export type PoolShot = GlassShot | ProductShot;

export type Angle = "story" | "list" | "numbers" | "versus" | "quickfire" | "rank" | "stages" | "chat" | "poll" | "steps" | "myth" | "pack" | "demo" | "checklist";

export type PoolReel = {
  id: string;
  idea: string;
  variant: number;
  title: string;
  angle: Angle;
  hook: PoolShot;
  shots: PoolShot[];
  cta?: string;
  badge?: string;
};
