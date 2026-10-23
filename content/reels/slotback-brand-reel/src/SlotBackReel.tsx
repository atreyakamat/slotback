import React from "react";
import { AbsoluteFill, Series, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { colors, scenes, sceneStarts, SceneId } from "./theme";
import { VO_DELAY } from "./vo";
import { Flash, Grain } from "./components/effects";
import { Captions } from "./components/Captions";
import { Calling, Counter, EmptyChair, Hook } from "./scenes/Problem";
import { Claim, Filled, LogoReveal, OpenSlot } from "./scenes/Solution";
import { Cta, Features } from "./scenes/Close";

export type ReelProps = {
  // "placeholder" uses the original synth beat, "none" leaves room for
  // a track added in Instagram, or pass a file in public/ to beat-sync to.
  music: "placeholder" | "none" | string;
  captions: boolean;
};

const sceneComponents: Record<SceneId, React.FC> = {
  hook: Hook,
  emptyChair: EmptyChair,
  counter: Counter,
  calling: Calling,
  logo: LogoReveal,
  openSlot: OpenSlot,
  claim: Claim,
  filled: Filled,
  features: Features,
  cta: Cta,
};

const s = sceneStarts;
type Cue = [frame: number, sfx: string, volume?: number];

const sfxCues: Cue[] = [
  [0, "buzz", 0.8],
  [14, "glitch", 0.5],
  [14, "thud"],
  [47, "whoosh", 0.7],
  [s.emptyChair + 6, "thud"],
  [s.counter - 5, "whoosh", 0.6],
  ...[0, 3, 6, 9, 12, 15, 18].map((f): Cue => [s.counter + 4 + f, "tick", 0.5]),
  ...[54, 60, 66, 70, 74, 77].map((f): Cue => [s.counter + f, "tick", 0.5]),
  [s.counter + 80, "cash", 0.9],
  [s.counter + 82, "thud"],
  [s.calling - 6, "whoosh", 0.6],
  [s.calling + 15, "error", 0.6],
  [s.calling + 27, "error", 0.6],
  [s.calling + 39, "error", 0.6],
  [s.logo, "impact"],
  [s.openSlot, "whoosh", 0.6],
  [s.openSlot + 24, "pop", 0.8],
  ...[0, 1, 2, 3, 4].map((i): Cue => [s.openSlot + 40 + i * 6 + 14, "pop", 0.6]),
  [s.claim - 6, "whoosh", 0.7],
  ...Array.from({ length: 8 }, (_, i): Cue => [s.claim + 10 + i * 5, "tick", 0.45]),
  [s.claim + 52, "success", 0.9],
  [s.filled - 7, "whoosh", 0.7],
  [s.filled + 14, "pop", 0.7],
  [s.filled + 32, "cash", 0.9],
  [s.features - 10, "whoosh", 0.7],
  [s.features + 3, "thud"],
  [s.features + 33, "thud"],
  [s.features + 63, "thud"],
  [s.cta, "impact", 0.6],
  [s.cta + 20, "pop", 0.8],
];

export const SlotBackReel: React.FC<ReelProps> = ({ music, captions }) => {
  const musicSrc =
    music === "none" ? null : staticFile(music === "placeholder" ? "audio/music-placeholder.wav" : music);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Series>
        {(Object.keys(scenes) as SceneId[]).map((id) => {
          const Scene = sceneComponents[id];
          return (
            <Series.Sequence key={id} name={id} durationInFrames={scenes[id]}>
              <Scene />
            </Series.Sequence>
          );
        })}
      </Series>
      <Flash at={s.logo} length={9} />
      <Flash at={s.features} length={5} color={colors.cream} />
      {captions && <Captions />}
      <Grain />

      {musicSrc && <Audio src={musicSrc} volume={0.45} />}
      {(Object.keys(scenes) as SceneId[]).map((id) => (
        <Sequence key={`vo-${id}`} from={s[id] + VO_DELAY} layout="none" name={`vo ${id}`}>
          <Audio src={staticFile(`audio/vo/${id}.wav`)} volume={1} />
        </Sequence>
      ))}
      {sfxCues.map(([frame, name, volume = 1], i) => (
        <Sequence key={`sfx-${i}`} from={frame} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume * 0.7} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
