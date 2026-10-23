// A series reel is a hook (song start -> drop) followed by shots whose
// lengths are counted in beats of the reel's track, then an end card.
// Text props accept light markup: *lime*, ~red~, _muted_.

export type TrackId = "windows" | "paixao" | "cavuca" | "struct" | "phonk";

// `beats: "drop"` runs the shot up to the reel's next listed later drop.
type Base = { beats: number | "drop" };

export type Shot = Base &
  (
    | { type: "slam"; lines: string[]; kicker?: string; bg?: Bg; size?: number; stamp?: string; tag?: string }
    | { type: "notif"; headline: string; sender: string; message: string; time?: string }
    | { type: "counter"; label?: string; steps: { value: number; note: string }[]; suffix?: string; final?: string; tag?: string; prefix?: string }
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
    | { type: "rating"; headline?: string; text: string; score: number; note?: string }
    | { type: "split"; left: { title: string; lines: string[] }; right: { title: string; lines: string[] } }
    | { type: "flag"; color: "red" | "green"; text: string; count?: string }
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
  // Song times of later drops; each gets a flash and impact, and shots
  // with beats: "drop" end on the next one.
  laterDrops?: number[];
  series?: "01" | "02" | "03";
  progressBar?: boolean;
  // Fast-cut mode: a snap on every cut, risers into drops, a sub on each hit
  // and a harder beat pulse.
  fast?: boolean;
  // Label pinned to the top of the frame for the whole reel.
  badge?: string;
  // End card button text; defaults to the free demo line.
  cta?: string;
};
