import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { colors, fonts } from "../theme";
import { Flash, Grain, SceneMotion } from "../components/effects";
import { seg, shotComponents, ShotProps } from "../series/shots";
import { Shot } from "../series/types";
import { GlassBackdrop, glassComponents, PoolEndCard } from "./glass";
import { GlassShot, PoolReel, PoolShot } from "./types";
import { poolReels } from "./reels";

// 112.5 BPM at 30 fps: every cut lands on the grid, so a 110-115 BPM sound
// (or a 225 BPM one at double time) laid over it in Instagram feels on-beat.
export const BEAT = 16;
export const END_CARD = 48;
// Scripts shorter than this get extra beats spread over their busiest shots,
// so nothing flashes past too fast to read.
const MIN_BEATS = 22;
const stretchOrder = ["chat", "check", "vs", "grid", "poll", "stat", "counter", "claim", "openSlot", "text", "stage", "rank", "ticker"];

const withMinimumLength = (shots: PoolShot[]): PoolShot[] => {
  const out = shots.map((s) => ({ ...s }));
  let total = out.reduce((a, s) => a + s.beats, 0);
  const order = out
    .map((s, i) => ({ i, rank: stretchOrder.indexOf(s.type) === -1 ? 99 : stretchOrder.indexOf(s.type) }))
    .filter(({ i }) => i > 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ i }) => i);
  for (let k = 0; total < MIN_BEATS && order.length; k++) {
    out[order[k % order.length]].beats += 1;
    total += 1;
  }
  return out;
};

export type PoolReelProps = { reelId: string };

type Placed = { shot: PoolShot; from: number; duration: number; beats: number[]; index: number };

export const poolTimeline = (reel: PoolReel) => {
  const placed: Placed[] = [];
  let f = 0;
  withMinimumLength([reel.hook, ...reel.shots]).forEach((shot, index) => {
    const duration = shot.beats * BEAT;
    placed.push({ shot, from: f, duration, beats: Array.from({ length: shot.beats }, (_, k) => k * BEAT), index });
    f += duration;
  });
  return { placed, drop: placed[1]?.from ?? 0, endFrom: f, total: f + END_CARD };
};

const glassTypes = new Set<string>(["text", "ticker", "chat", "stat", "stage", "vs", "poll", "grid", "rank", "check"]);
// The timer's "claimed" state is dark text on its own lime field, so it keeps its background.
const keepsBackground = new Set<string>(["timer"]);

type Cue = [frame: number, sfx: string, volume?: number];

const cuesFor = ({ shot, from, beats, duration }: Placed): Cue[] => {
  const at = (f: number) => from + f;
  const out: Cue[] = [];
  switch (shot.type) {
    case "text":
      shot.lines.forEach((_, k) => out.push([at(seg(beats, k, Math.max(shot.lines.length, 2)) + 1), "thud", 0.55]));
      break;
    case "ticker":
      shot.words.forEach((_, k) => out.push([at(k * 7), k === shot.words.length - 1 ? "impact" : "tick", k === shot.words.length - 1 ? 0.6 : 0.45]));
      break;
    case "chat":
      shot.msgs.forEach((_, k) => out.push([at(seg(beats, k, shot.msgs.length) + 4), "pop", 0.6]));
      break;
    case "stat":
      [0.1, 0.25, 0.4].forEach((p) => out.push([at(Math.round(duration * p)), "tick", 0.5]));
      out.push([at(Math.round(duration * 0.55)), "cash", 0.8]);
      break;
    case "stage":
      out.push([at(2), "glitch", 0.6]);
      break;
    case "vs": {
      out.push([at(0), "whoosh", 0.6], [at(4), "impact", 0.5]);
      const n = Math.max(shot.left.lines.length, shot.right.lines.length);
      if (shot.win) out.push([at(seg(beats, n + 1, n + 2)), "success", 0.8]);
      break;
    }
    case "poll":
      shot.options.forEach((_, k) => out.push([at(seg(beats, 1, 3) + k * 3), "pop", 0.5]));
      break;
    case "grid":
      shot.tiles.forEach((_, k) => out.push([at(seg(beats, k, shot.tiles.length + 1) + 3), "pop", 0.55]));
      break;
    case "rank":
      out.push([at(0), "thud", 0.9]);
      break;
    case "check":
      shot.items.forEach((_, k) => out.push([at(seg(beats, k, shot.items.length) + 7), "pop", 0.55]));
      break;
    case "notif":
      out.push([at(Math.round(duration * 0.35)), "buzz", 0.8]);
      break;
    case "calls":
      shot.names.forEach((_, k) => out.push([at(seg(beats, k, shot.names.length) + 7), "error", 0.5]));
      break;
    case "openSlot":
      out.push([at(seg(beats, 1, 4)), "pop", 0.8]);
      break;
    case "claim":
      out.push([at((beats[Math.floor(beats.length * (shot.claimAt ?? 0.55))] ?? 0) + 2), "success", 0.9]);
      break;
    case "timer": {
      const claim = beats[Math.floor(beats.length * 0.7)] ?? 0;
      beats.filter((b) => b < claim).forEach((b) => out.push([at(b), "tick", 0.5]));
      out.push([at(claim), "success", 0.9]);
      break;
    }
    case "flip":
      out.push([at(seg(beats, 1, 4)), "pop", 0.7]);
      if (shot.amount) out.push([at(seg(beats, 1, 4) + 10), "cash", 0.8]);
      break;
    case "counter":
      shot.steps.forEach((_, k) => out.push([at(seg(beats, k, shot.steps.length + 1)), "tick", 0.6]));
      out.push([at(seg(beats, shot.steps.length, shot.steps.length + 1)), "cash", 0.9]);
      break;
    case "gap":
      if (shot.state === "broken") out.push([at(seg(beats, 1, 3)), "glitch", 0.7]);
      if (shot.state === "refilled") out.push([at(seg(beats, 1, 3)), "success", 0.8]);
      break;
    case "chair":
      if (shot.stamp) out.push([at(seg(beats, 1, 3)), "thud", 1]);
      break;
    case "quotes":
      shot.quotes.forEach((_, k) => out.push([at(seg(beats, k, shot.quotes.length)), "thud", 0.7]));
      break;
    case "rating":
      out.push([at(seg(beats, 1, 2)), shot.score >= 8 ? "success" : "error", 0.8]);
      break;
    case "flag":
      out.push([at(2), shot.color === "red" ? "error" : "success", 0.7]);
      break;
  }
  return out;
};

const ShotView: React.FC<{ p: Placed }> = ({ p }) => {
  if (glassTypes.has(p.shot.type)) {
    const Comp = glassComponents[p.shot.type as GlassShot["type"]] as React.FC<{ shot: GlassShot; dur: number; beats: number[] }>;
    return <Comp shot={p.shot as GlassShot} dur={p.duration} beats={p.beats} />;
  }
  const Comp = shotComponents[p.shot.type as Shot["type"]] as React.FC<ShotProps<Shot["type"]>>;
  return (
    <AbsoluteFill className={keepsBackground.has(p.shot.type) ? undefined : "pool-clear"}>
      <Comp shot={p.shot as Shot} dur={p.duration} beats={p.beats} />
    </AbsoluteFill>
  );
};

// Beat pulse plus a jump zoom every 2 beats, which reads as a cut inside held shots.
const Pulse: React.FC<{ total: number; children: React.ReactNode }> = ({ total, children }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(Math.min(frame, total) / BEAT);
  const since = frame - n * BEAT;
  const pulse = 1 + 0.035 * Math.exp(-since / 4);
  const zoom = Math.floor(n / 2) % 2 === 1 ? 1.04 : 1;
  return <AbsoluteFill style={{ scale: String(pulse * zoom) }}>{children}</AbsoluteFill>;
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(frame / total) * 100}%`, background: colors.lime, boxShadow: "0 0 18px rgba(198,244,50,0.7)" }} />
    </AbsoluteFill>
  );
};

const Badge: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ pointerEvents: "none", alignItems: "center" }}>
    <div style={{ marginTop: 120, padding: "12px 30px", borderRadius: 999, background: "rgba(7,20,15,0.6)", backdropFilter: "blur(20px)", border: "2px solid rgba(255,255,255,0.2)", color: colors.cream, fontFamily: fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: "0.1em", textTransform: "uppercase" }}>{text}</div>
  </AbsoluteFill>
);

const moves = ["whip", "punch", "push", "blur"] as const;

export const PoolReelVideo: React.FC<PoolReelProps> = ({ reelId }) => {
  const reel = poolReels.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown pool reel ${reelId}`);
  const t = poolTimeline(reel);
  const cues: Cue[] = [
    ...t.placed.flatMap(cuesFor),
    ...t.placed.slice(1).map((p): Cue => [Math.max(0, p.from - 5), "whoosh", 0.5]),
    ...t.placed.slice(1).map((p): Cue => [p.from, "snap", 0.45]),
    [Math.max(0, t.drop - 24), "riser", 0.5],
    [t.drop, "sub", 0.85],
    [t.drop, "impact", 0.8],
    [Math.max(0, t.endFrom - 5), "whoosh", 0.5],
    [t.endFrom + 6, "pop", 0.8],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <style>{`.pool-clear > div { background: transparent !important; }`}</style>
      <GlassBackdrop seed={reel.id} />
      <Pulse total={t.endFrom}>
        {t.placed.map((p) => (
          <Sequence key={p.index} from={p.from} durationInFrames={p.duration} name={`${p.index}. ${p.shot.type}`}>
            <SceneMotion enter={p.index === 0 ? "none" : moves[(p.index + reel.variant) % moves.length]} enterLength={5} exit="blur" exitLength={3}>
              <ShotView p={p} />
            </SceneMotion>
          </Sequence>
        ))}
        <Sequence from={t.endFrom} name="end card">
          <SceneMotion enter="punch" enterLength={6}>
            <PoolEndCard cta={reel.cta ?? "DM “DEMO” for a free demo"} />
          </SceneMotion>
        </Sequence>
      </Pulse>
      <Flash at={t.drop} length={7} color="rgba(198,244,50,0.45)" />
      <ProgressBar total={t.total} />
      {reel.badge && <Badge text={reel.badge} />}
      <Grain />
      {cues.map(([frame, name, volume = 1], i) => (
        <Sequence key={`sfx-${i}`} from={frame} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume * 0.7} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const poolDuration = (reelId: string) => {
  const reel = poolReels.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown pool reel ${reelId}`);
  return poolTimeline(reel).total;
};
