import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts, FPS } from "../theme";
import { VoLine } from "./types";

type Word = { text: string; start: number; end: number; chunk: number };

// Same word-by-word style as the brand film, driven by a reel's VO lines.
const buildWords = (lines: VoLine[]): Word[] => {
  const words: Word[] = [];
  let chunk = 0;
  for (const { text, at, seconds } of lines) {
    const parts = text.split(" ");
    const weights = parts.map((p) => p.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let t = at * FPS;
    parts.forEach((p, i) => {
      const len = (weights[i] / total) * seconds * FPS;
      if (i > 0 && (i % 4 === 0 || /[.?,…]$/.test(parts[i - 1]))) chunk++;
      words.push({ text: p, start: t, end: t + len, chunk });
      t += len;
    });
    chunk++;
  }
  return words;
};

export const SeriesCaptions: React.FC<{ lines: VoLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const words = React.useMemo(() => buildWords(lines), [lines]);
  const current = words.find((w) => frame >= w.start && frame < w.end + 4);
  if (!current) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 1480, left: 80, right: 80, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 16px" }}>
        {words
          .filter((w) => w.chunk === current.chunk && frame >= w.start)
          .map((w) => {
            const active = frame < w.end + 4;
            return (
              <span
                key={w.start}
                style={{
                  fontFamily: fonts.body,
                  fontWeight: 800,
                  fontSize: 54,
                  color: active ? colors.ink : colors.cream,
                  background: active ? colors.lime : "rgba(7,20,15,0.72)",
                  padding: "4px 14px",
                  borderRadius: 14,
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
