import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Solid, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Circle, StrikeThrough, Underline } from "@remotion/rough-notation";
import { lightLeak } from "@remotion/effects/light-leak";
import { colors, fonts } from "../theme";

// Motion-graphics layers for the movie reels (second batch onwards). Each one is
// opt-in per scene, so the first four reels render exactly as before.

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Warm film light leak washing over a cut, used on the drop.
export const Leak: React.FC<{ seed: number }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none", opacity: interpolate(frame, [0, 4, 18, 26], [0, 0.9, 0.7, 0], clamp) }}>
      <Solid width={width} height={height} effects={[lightLeak({ seed, hueShift: 40, progress: interpolate(frame, [0, 26], [0.1, 0.9], clamp) })]} />
    </AbsoluteFill>
  );
};

// Red rubber stamp that slams in and shakes the frame a touch.
export const Stamp: React.FC<{ text: string; at?: number }> = ({ text, at = 6 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          opacity: interpolate(frame, [at, at + 2], [0, 1], clamp),
          scale: interpolate(frame, [at, at + 6], [2.6, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.75, 0) }),
          rotate: "-11deg",
          border: `12px solid ${colors.red}`,
          borderRadius: 24,
          padding: "18px 46px",
          color: colors.red,
          fontFamily: fonts.display,
          fontSize: 120,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          background: "rgba(255,77,61,0.08)",
          boxShadow: "0 0 0 6px rgba(255,77,61,0.25) inset",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Opening title in the style of a film credit: letters track in, a rule draws under them.
export const Title: React.FC<{ kicker: string; text: string }> = ({ kicker, text }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.45)", gap: 26 }}>
      <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: "#E9C46A", textTransform: "uppercase", opacity: interpolate(frame, [2, 12], [0, 1], clamp), letterSpacing: `${interpolate(frame, [2, 40], [0.9, 0.45], clamp)}em` }}>
        {kicker}
      </div>
      <div style={{ width: interpolate(frame, [6, 22], [0, 520], { ...clamp, easing: ease }), height: 3, background: "#E9C46A" }} />
      <div style={{ fontFamily: fonts.display, fontSize: 104, lineHeight: 1, color: colors.cream, textAlign: "center", padding: "0 60px", textTransform: "uppercase", opacity: interpolate(frame, [10, 20], [0, 1], clamp), scale: interpolate(frame, [10, 60], [1.12, 1], { ...clamp, easing: ease }), textShadow: "0 10px 50px rgba(0,0,0,0.8)" }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Two clips stacked, A vs B, with a lime divider wiping across.
export const Split: React.FC<{ a: string; b: string; fromA?: number; fromB?: number; labels: [string, string]; win?: 0 | 1; dur: number }> = ({ a, b, fromA = 0, fromB = 0, labels, win, dur }) => {
  const frame = useCurrentFrame();
  const half = (clip: string, from: number, label: string, i: 0 | 1) => {
    const lost = win !== undefined && win !== i ? interpolate(frame, [dur * 0.55, dur * 0.7], [0, 1], clamp) : 0;
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: i === 0 ? 0 : "50%", height: "50%", overflow: "hidden", translate: `${interpolate(frame, [0, 10], [i === 0 ? -1080 : 1080, 0], { ...clamp, easing: ease })}px 0` }}>
        <OffthreadVideo src={staticFile(`stock/${clip}.mp4`)} muted trimBefore={Math.round(from * 30)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `grayscale(${lost}) brightness(${1 - lost * 0.4})`, scale: String(1.05 + 0.08 * (frame / dur)) }} />
        <div style={{ position: "absolute", left: 50, [i === 0 ? "bottom" : "top"]: 40, padding: "12px 26px", borderRadius: 999, background: i === win ? colors.lime : "rgba(7,20,15,0.75)", color: i === win ? colors.ink : colors.cream, fontFamily: fonts.display, fontSize: 44, textTransform: "uppercase", opacity: interpolate(frame, [8, 14], [0, 1], clamp) }}>
          {label}
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {half(a, fromA, labels[0], 0)}
      {half(b, fromB, labels[1], 1)}
      <div style={{ position: "absolute", top: "50%", left: 0, height: 10, marginTop: -5, background: colors.lime, width: `${interpolate(frame, [4, 14], [0, 100], { ...clamp, easing: ease })}%`, boxShadow: "0 0 30px rgba(198,244,50,0.8)" }} />
    </AbsoluteFill>
  );
};

// Rolling rupee counter with the honesty pill.
export const Counter: React.FC<{ label: string; to: number; dur: number }> = ({ label, to, dur }) => {
  const frame = useCurrentFrame();
  const v = Math.round(interpolate(frame, [4, dur * 0.65], [0, to], { ...clamp, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.4)", gap: 18 }}>
      <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 36, letterSpacing: "0.16em", color: colors.cream, textTransform: "uppercase", opacity: interpolate(frame, [0, 6], [0, 1], clamp) }}>{label}</div>
      <div style={{ fontFamily: fonts.display, fontSize: 190, color: colors.lime, fontVariantNumeric: "tabular-nums", textShadow: "0 0 60px rgba(198,244,50,0.45)", scale: interpolate(frame, [dur * 0.62, dur * 0.7, dur * 0.8], [1, 1.12, 1], clamp) }}>
        ₹{v.toLocaleString("en-IN")}
      </div>
      <div style={{ padding: "8px 22px", borderRadius: 999, border: "2px solid rgba(245,239,225,0.5)", color: colors.cream, fontFamily: fonts.body, fontWeight: 700, fontSize: 26, letterSpacing: "0.12em", textTransform: "uppercase" }}>Example numbers</div>
    </AbsoluteFill>
  );
};

// One subtitle word, optionally annotated: ~strike~, _circle_, ^underline^, *lime*.
export const AnnotatedWord: React.FC<{ raw: string; at: number; lit: boolean }> = ({ raw, at, lit }) => {
  const frame = useCurrentFrame();
  const kind = raw.match(/^([~_^])(.+)\1([.,!?…]*)$/);
  const word = kind ? kind[2] + kind[3] : raw;
  const progress = interpolate(frame, [at + 6, at + 16], [0, 1], clamp);
  const body = <span style={{ color: lit ? colors.lime : undefined }}>{word}</span>;
  if (!kind) return body;
  if (kind[1] === "~") return <StrikeThrough progress={progress} color={colors.red} strokeWidth={7} iterations={2} seed={3}>{body}</StrikeThrough>;
  if (kind[1] === "_") return <Circle progress={progress} color={colors.lime} strokeWidth={5} iterations={2} padding={{ top: 6, right: 14, bottom: 6, left: 14 }} seed={5}>{body}</Circle>;
  return <Underline progress={progress} color={colors.lime} strokeWidth={7} iterations={2} seed={7}>{body}</Underline>;
};
