// A series reel is a hook (song start -> drop) followed by shots whose
// lengths are counted in beats of the reel's track, then an end card.
// Text props accept light markup: *lime*, ~red~, _muted_.

export type TrackId = "windows" | "paixao" | "cavuca" | "struct";

type Base = { beats: number };

export type Shot = Base &
  (
    | { type: "slam"; lines: string[]; kicker?: string; bg?: Bg; size?: number; stamp?: string; tag?: string }
    | { type: "notif"; headline: string; sender: string; message: string; time?: string }
    | { type: "counter"; label?: string; steps: { value: number; note: string }[]; suffix?: string; final?: string; tag?: string }
    | { type: "calls"; headline: string; names: string[] }
    | { type: "openSlot"; headline: string; sub?: string }
    | { type: "claim"; headline: string; slot: string; claimAt?: number }
    | { type: "flip"; headline: string; time: string; before: string; after: string; amount?: string }
    | { type: "step"; num: number; text: string }
    | { type: "quotes"; headline?: string; quotes: string[] }
    | { type: "timer"; headline: string; running: boolean }
    | { type: "list"; headline?: string; items: string[]; bg?: Bg; tag?: string }
    | { type: "chair"; headline: string; stamp?: string; filled?: boolean; dim?: boolean }
    | { type: "gap"; headline: string; state: "booked" | "broken" | "refilled" }
    | { type: "pins"; headline: string }
  );

export type Bg = "ink" | "green" | "cream" | "lime";

export type VoLine = { file: string; at: number; text: string; seconds: number };

export type SeriesReel = {
  id: string;
  number: number;
  title: string;
  track: TrackId;
  songStart: number;
  drop: number;
  hook: Shot;
  shots: Shot[];
  vo?: VoLine[];
  endCardFrames?: number;
};
