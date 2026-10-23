import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { colors, fonts, FPS } from "../theme";
import { Grain } from "../components/effects";
import { EndCard } from "../series/shots";
import { elements, ElProps, part } from "./elements";
import { Env, themes } from "./themes";
import { kTimeline, Placed } from "./timeline";
import { El, KReel } from "./types";
import { series04 } from "./reels-04";

const songFile: Record<KReel["track"], string> = {
  windows: "music/windows-in-brazil.mp3",
  paixao: "music/paixao-sped-up.mp3",
  cavuca: "music/cavuca-funk.mp3",
  struct: "music/struct-slowed.mp3",
  phonk: "music/phonk-compilation.mp3",
};

type Cue = [frame: number, sfx: string, volume?: number];

// Sound design per element, timed to the same beat maths each one animates on.
const cuesFor = (p: Placed): Cue[] => {
  const { el, from, beats, duration } = p;
  const at = (f: number) => from + f;
  const mid = part(beats, 1, 2);
  switch (el.t) {
    case "swap":
      return [[at(mid - 3), "glitch", 0.6], [at(mid), "thud", 0.9]];
    case "stack":
      return el.lines.map((_, i): Cue => [at(part(beats, i, el.lines.length)), "thud", 0.7]);
    case "chat":
      return el.msgs.map((_, i): Cue => [at(part(beats, i, el.msgs.length)), "pop", 0.7]);
    case "bar":
      return [...beats.map((b): Cue => [at(b), "tick", 0.4]), [at(duration - 6), el.to >= 100 ? "success" : "error", 0.8]];
    case "num":
      return [[at(1), "tick", 0.5], [at(Math.round(duration * 0.7)), el.to > el.from ? "cash" : "error", 0.8]];
    case "chart":
      return [[at(0), "whoosh", 0.6], [at(duration - 6), el.pts[el.pts.length - 1] >= el.pts[el.pts.length - 2] ? "success" : "error", 0.7]];
    case "receipt": {
      const n = el.lines.length + (el.total ? 1 : 0) + (el.stamp ? 1 : 0);
      return Array.from({ length: n }, (_, i): Cue => [at(part(beats, i, n)), i === n - 1 && el.stamp ? "thud" : "tick", 0.7]);
    }
    case "ring":
      return el.slots.split("").map((c, i): Cue => [at(part(beats, i, 12)), c === "x" ? "error" : "pop", c === "x" ? 0.5 : 0.35]);
    case "grid": {
      const n = el.marks.length + (el.bingo ? 1 : 0);
      return Array.from({ length: n }, (_, i): Cue => [at(part(beats, i, n)), i === el.marks.length ? "success" : "thud", 0.7]);
    }
    case "tiers":
      return el.rows.map((_, i): Cue => [at(part(beats, i, el.rows.length)), "thud", 0.7]);
    case "slots":
      return [...beats.slice(0, -1).map((b): Cue => [at(b), "tick", 0.5]), ...[1, 2, 3].map((i): Cue => [at(part(beats, i, 4)), "thud", 0.9]), [at(part(beats, 3, 4) + 4), "cash", 0.9]];
    case "score":
      return [[at(mid), "impact", 0.8]];
    case "emoji":
      return el.chars.map((_, i): Cue => [at(part(beats, i, el.chars.length)), "pop", 0.7]);
    case "timer":
      return beats.map((b): Cue => [at(b), "tick", 0.5]);
    case "choice":
      return [[at(mid), "success", 0.8]];
    case "quiz":
      return [[at(mid), "success", 0.8]];
    case "def":
      return [[at(part(beats, 1, 3)), "pop", 0.7]];
    case "weather":
      return [[at(0), "whoosh", 0.6]];
    default:
      return [];
  }
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", top: 0, left: 0, height: 10, width: `${(frame / total) * 100}%`, background: colors.lime, mixBlendMode: "difference" }} />;
};

const Badge: React.FC<{ text: string }> = ({ text }) => (
  <AbsoluteFill style={{ pointerEvents: "none", alignItems: "center" }}>
    <div style={{ marginTop: 120, padding: "12px 30px", borderRadius: 999, background: "rgba(7,20,15,0.8)", color: colors.cream, fontFamily: fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: "0.1em", textTransform: "uppercase" }}>{text}</div>
  </AbsoluteFill>
);

export type KineticProps = { reelId: string; withSong: boolean };

export const KineticVideo: React.FC<KineticProps> = ({ reelId, withSong }) => {
  const reel = series04.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown reel ${reelId}`);
  const t = kTimeline(reel);
  const riser = Math.round(1.6 * FPS);
  const hits = [t.dropFrame, ...t.laterDropFrames];
  const cues: Cue[] = [
    ...t.placed.flatMap(cuesFor),
    ...t.placed.slice(1).map((p): Cue => [p.from, "snap", 0.55]),
    ...t.placed.slice(1).filter((p) => p.index % 4 === 0).map((p): Cue => [Math.max(0, p.from - 4), "whoosh", 0.45]),
    ...hits.filter((f) => f >= riser).map((f): Cue => [f - riser, "riser", 0.55]),
    ...hits.map((f): Cue => [f, "sub", 0.85]),
    ...hits.map((f): Cue => [f, "impact", 0.6]),
    [Math.max(0, t.endCardFrom - 27), "swell", 0.5],
    [t.endCardFrom, "thud", 0.8],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {t.placed.map((p) => {
        const Comp = elements[p.el.t] as React.FC<ElProps<El["t"]>>;
        const th = themes[p.theme];
        return (
          <Sequence key={p.index} from={p.from} durationInFrames={p.duration} name={`${p.index}. ${p.el.t}`}>
            <Env kind={p.env} th={th} seed={reel.seed + p.index} />
            <Comp el={p.el} th={th} dur={p.duration} beats={p.beats} />
          </Sequence>
        );
      })}
      <Sequence from={t.endCardFrom} name="end card">
        <EndCard cta={reel.cta} />
      </Sequence>
      <ProgressBar total={t.total} />
      {reel.badge && <Badge text={reel.badge} />}
      <Grain />
      {withSong && <Audio src={staticFile(songFile[reel.track])} trimBefore={Math.round(reel.songStart * FPS)} volume={0.7} />}
      {cues.map(([frame, name, volume = 1], i) => (
        <Sequence key={`sfx-${i}`} from={Math.max(0, frame)} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume * (withSong ? 0.45 : 0.7)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const kineticDuration = (reelId: string) => {
  const reel = series04.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown reel ${reelId}`);
  return kTimeline(reel).total;
};
