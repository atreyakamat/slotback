import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Snappy ease used for most entrances.
export const punch = Easing.bezier(0.16, 1, 0.3, 1);

// Decaying camera shake that starts at `at` and settles over `length` frames.
export const useShake = (at: number, length = 12, strength = 28) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > length) return "0px 0px";
  const decay = 1 - t / length;
  const x = (random(`sx${at}-${t}`) - 0.5) * 2 * strength * decay;
  const y = (random(`sy${at}-${t}`) - 0.5) * 2 * strength * decay;
  return `${x}px ${y}px`;
};

// Full-frame flash. Peaks at `at` and fades over `length` frames.
export const Flash: React.FC<{ at: number; length?: number; color?: string }> = ({
  at,
  length = 8,
  color = "#FFFFFF",
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 2, at, at + length], [0, 1, 0], clamp);
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: color, opacity, pointerEvents: "none" }} />;
};

// Scene entrance wrapper: whip pan, zoom punch, push up or zoom blur in,
// and an optional matching exit so hard cuts read as transitions.
type Move = "whip" | "punch" | "push" | "blur" | "none";

export const SceneMotion: React.FC<{
  enter?: Move;
  exit?: Move;
  enterLength?: number;
  exitLength?: number;
  children: React.ReactNode;
}> = ({ enter = "none", exit = "none", enterLength = 8, exitLength = 6, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, enterLength], [0, 1], { ...clamp, easing: punch });
  const outP = interpolate(
    frame,
    [durationInFrames - exitLength, durationInFrames],
    [0, 1],
    { ...clamp, easing: Easing.in(Easing.cubic) },
  );

  let translate = "0px 0px";
  let scale = 1;
  let blur = 0;

  const apply = (move: Move, p: number, dir: 1 | -1) => {
    // p runs 0 -> 1 into the resting state for entrances (dir 1)
    // and 0 -> 1 away from it for exits (dir -1).
    const away = dir === 1 ? 1 - p : p;
    if (move === "whip") {
      translate = `${away * 1100 * dir}px 0px`;
      blur += away * 40;
    } else if (move === "punch") {
      scale *= dir === 1 ? 1 + away * 0.6 : 1 + away * 0.4;
      blur += away * 10;
    } else if (move === "push") {
      translate = `0px ${away * 1920 * dir}px`;
    } else if (move === "blur") {
      scale *= 1 + away * 0.5;
      blur += away * 30;
    }
  };

  if (inP < 1) apply(enter, inP, 1);
  if (outP > 0) apply(exit, outP, -1);

  return (
    <AbsoluteFill
      style={{
        translate,
        scale: String(scale),
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Text with an RGB split glitch for `length` frames starting at `at`.
export const GlitchText: React.FC<{
  at: number;
  length?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, length = 8, style, children }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const active = t >= 0 && t < length;
  const off = active ? (random(`g${at}-${t}`) - 0.5) * 36 : 0;
  const slice = active ? random(`gs${at}-${t}`) * 100 : 0;
  return (
    <div style={{ position: "relative", ...style }}>
      {active && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              color: "#FF2E63",
              translate: `${off}px 0px`,
              mixBlendMode: "screen",
              clipPath: `inset(${slice}% 0 ${Math.max(0, 70 - slice)}% 0)`,
            }}
          >
            {children}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              color: "#2EF9FF",
              translate: `${-off}px 0px`,
              mixBlendMode: "screen",
            }}
          >
            {children}
          </div>
        </>
      )}
      <div style={{ position: "relative", translate: `${off * 0.3}px 0px` }}>{children}</div>
    </div>
  );
};

// Headline that drops in with a spring and slight overshoot.
export const Slam: React.FC<{
  at?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at = 0, style, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 9], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  if (frame < at) return null;
  return (
    <div
      style={{
        fontFamily: fonts.display,
        color: colors.cream,
        textAlign: "center",
        lineHeight: 0.95,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        opacity: interpolate(frame, [at, at + 3], [0, 1], clamp),
        scale: String(interpolate(p, [0, 1], [2.2, 1])),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Subtle animated grain so flat colour fields don't look dead.
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.07, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`n${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#n${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
