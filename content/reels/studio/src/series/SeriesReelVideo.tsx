import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { colors, FPS } from "../theme";
import { Flash, Grain, SceneMotion } from "../components/effects";
import { buildTimeline, PlacedShot } from "./timeline";
import { EndCard, seg, shotComponents, ShotProps } from "./shots";
import { SeriesReel, Shot } from "./types";
import { reels } from "./reels";
import { SeriesCaptions } from "./SeriesCaptions";

export type SeriesReelProps = {
  reelId: string;
  // true bakes the song in for a sync check; posting files leave it out.
  withSong: boolean;
};

const songFile: Record<SeriesReel["track"], string> = {
  windows: "music/windows-in-brazil.mp3",
  paixao: "music/paixao-sped-up.mp3",
  cavuca: "music/cavuca-funk.mp3",
  struct: "music/struct-slowed.mp3",
};

const moves = ["whip", "punch", "push", "blur"] as const;

type Cue = [frame: number, sfx: string, volume?: number];

// Sound effects for a shot, mirroring the beat maths each shot animates on.
const cuesFor = (p: PlacedShot): Cue[] => {
  const { shot, from, beats, duration } = p;
  const at = (f: number): number => from + f;
  const out: Cue[] = [];
  switch (shot.type) {
    case "notif":
      out.push([at(Math.round(duration * 0.35)), "buzz", 0.8]);
      break;
    case "counter": {
      const n = shot.steps.length;
      shot.steps.forEach((_, k) => out.push([at(seg(beats, k, n + 1)), "tick", 0.6]));
      out.push([at(seg(beats, n, n + 1)), "cash", 0.9]);
      break;
    }
    case "calls":
      shot.names.forEach((_, k) => out.push([at(seg(beats, k, shot.names.length) + 7), "error", 0.5]));
      break;
    case "openSlot":
      out.push([at(seg(beats, 1, 4)), "pop", 0.8]);
      [0, 1, 2, 3, 4].forEach((i) => out.push([at(seg(beats, 2, 4) + i * 3 + 10), "pop", 0.5]));
      break;
    case "claim":
      out.push([at((beats[Math.floor(beats.length * (shot.claimAt ?? 0.55))] ?? 0) + 2), "success", 0.9]);
      break;
    case "flip":
      out.push([at(seg(beats, 1, 4)), "pop", 0.7]);
      if (shot.amount) out.push([at(seg(beats, 1, 4) + 10), "cash", 0.8]);
      break;
    case "slam":
      out.push([at(0), "thud", 0.8]);
      if (shot.stamp) out.push([at(beats[Math.min(beats.length - 1, Math.max(1, beats.length - 2))] ?? 6), "thud", 1]);
      break;
    case "quotes":
      shot.quotes.forEach((_, k) => out.push([at(seg(beats, k, shot.quotes.length)), "thud", 0.8]));
      break;
    case "timer":
      if (shot.running) {
        const claim = beats[Math.floor(beats.length * 0.7)] ?? 0;
        beats.filter((b) => b < claim).forEach((b) => out.push([at(b), "tick", 0.5]));
        out.push([at(claim), "success", 0.9]);
      }
      break;
    case "step":
      out.push([at(0), "thud", 1]);
      break;
    case "list":
      shot.items.forEach((_, k) => out.push([at(seg(beats, k, shot.items.length)), "thud", 0.6]));
      break;
    case "chair":
      if (shot.stamp) out.push([at(seg(beats, 1, 3)), "thud", 1]);
      break;
    case "gap":
      if (shot.state === "broken") out.push([at(seg(beats, 1, 3)), "glitch", 0.7]);
      if (shot.state === "refilled") out.push([at(seg(beats, 1, 3)), "success", 0.8]);
      break;
    case "pins":
      [0, 1, 2, 3, 4].forEach((i) => out.push([at(seg(beats, i, 5)), "pop", 0.6]));
      break;
  }
  return out;
};

const BeatBump: React.FC<{ beats: number[]; children: React.ReactNode }> = ({ beats, children }) => {
  const frame = useCurrentFrame();
  const last = beats.filter((b) => b <= frame).pop();
  const scale = last === undefined ? 1 : 1 + 0.025 * Math.exp(-(frame - last) / 4);
  return <AbsoluteFill style={{ scale: String(scale) }}>{children}</AbsoluteFill>;
};

const ShotView: React.FC<{ placed: PlacedShot }> = ({ placed }) => {
  const Comp = shotComponents[placed.shot.type] as React.FC<ShotProps<Shot["type"]>>;
  return <Comp shot={placed.shot} dur={placed.duration} beats={placed.beats} />;
};

export const SeriesReelVideo: React.FC<SeriesReelProps> = ({ reelId, withSong }) => {
  const reel = reels.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown reel ${reelId}`);
  const t = buildTimeline(reel);
  const cues: Cue[] = [
    ...t.shots.flatMap(cuesFor),
    ...t.shots.slice(1).map((p): Cue => [Math.max(0, p.from - 5), "whoosh", 0.55]),
    [t.dropFrame, "impact", 0.9],
    [t.endCardFrom, "whoosh", 0.5],
    [t.endCardFrom + 6, "pop", 0.8],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <BeatBump beats={t.beatFrames}>
        {t.shots.map((p) => (
          <Sequence key={p.index} from={p.from} durationInFrames={p.duration} name={`${p.index}. ${p.shot.type}`}>
            <SceneMotion enter={p.index === 0 ? "none" : moves[p.index % moves.length]} enterLength={7}>
              <ShotView placed={p} />
            </SceneMotion>
          </Sequence>
        ))}
        <Sequence from={t.endCardFrom} name="end card">
          <SceneMotion enter="punch" enterLength={6}>
            <EndCard />
          </SceneMotion>
        </Sequence>
      </BeatBump>
      <Flash at={t.dropFrame} length={8} />
      {reel.vo && <SeriesCaptions lines={reel.vo} />}
      <Grain />

      {withSong && (
        <Audio src={staticFile(songFile[reel.track])} trimBefore={Math.round(reel.songStart * FPS)} volume={0.7} />
      )}
      {reel.vo?.map((line) => (
        <Sequence key={line.file} from={Math.round(line.at * FPS)} layout="none" name={`vo ${line.file}`}>
          <Audio src={staticFile(`audio/vo-series/${line.file}.wav`)} />
        </Sequence>
      ))}
      {cues.map(([frame, name, volume = 1], i) => (
        <Sequence key={`sfx-${i}`} from={frame} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume * (withSong ? 0.45 : 0.7)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const seriesDuration = (reelId: string) => {
  const reel = reels.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown reel ${reelId}`);
  return buildTimeline(reel).total;
};
