import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, sceneStarts, SceneId } from "../theme";
import { VO_DELAY, voLines } from "../vo";

type Word = { text: string; start: number; end: number; chunk: number };

// Spreads each line's words across its spoken duration, weighted by length,
// and groups them into chunks of up to four words.
const buildWords = (fps: number): Word[] => {
  const words: Word[] = [];
  let chunk = 0;
  for (const id of Object.keys(voLines) as SceneId[]) {
    const { text, seconds } = voLines[id];
    const parts = text.split(" ");
    const weights = parts.map((p) => p.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let t = sceneStarts[id] + VO_DELAY;
    parts.forEach((p, i) => {
      const len = (weights[i] / total) * seconds * fps;
      if (i > 0 && (i % 4 === 0 || /[.?]$/.test(parts[i - 1]))) chunk++;
      words.push({ text: p, start: t, end: t + len, chunk });
      t += len;
    });
    chunk++;
  }
  return words;
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = React.useMemo(() => buildWords(fps), [fps]);
  const current = words.find((w) => frame >= w.start && frame < w.end + 4);
  if (!current) return null;
  const line = words.filter((w) => w.chunk === current.chunk);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 1470,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0 16px",
        }}
      >
        {line.map((w) => {
          const active = frame >= w.start && frame < w.end + 4;
          const shown = frame >= w.start;
          return (
            <span
              key={`${w.start}`}
              style={{
                fontFamily: fonts.body,
                fontWeight: 800,
                fontSize: 54,
                color: active ? colors.ink : colors.cream,
                background: active ? colors.lime : "rgba(7,20,15,0.72)",
                padding: "4px 14px",
                borderRadius: 14,
                opacity: shown ? 1 : 0,
                scale: String(active ? interpolate(frame, [w.start, w.start + 3], [1.15, 1], { extrapolateRight: "clamp" }) : 1),
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
