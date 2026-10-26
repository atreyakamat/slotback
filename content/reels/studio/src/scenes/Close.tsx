import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { SceneMotion, Slam, useShake } from "../components/effects";
import { Logo } from "../components/ui";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const featureCards = [
  { at: 3, title: "No app", sub: "for your clients" },
  { at: 33, title: "Live in 10 min", sub: "no setup headache" },
  { at: 63, title: "Built for Goa", sub: "salons and spas" },
];

export const Features: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneMotion exit="punch" exitLength={5}>
      <AbsoluteFill
        style={{
          backgroundColor: colors.cream,
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          translate: useShake(63, 8, 14),
        }}
      >
        {featureCards.map((c, i) => (
          <div
            key={c.title}
            style={{
              width: 880,
              height: 260,
              borderRadius: 48,
              background: colors.green,
              display: "flex",
              alignItems: "center",
              gap: 40,
              padding: "0 50px",
              opacity: frame >= c.at ? 1 : 0,
              rotate: `${interpolate(frame, [c.at, c.at + 8], [i % 2 ? 8 : -8, i % 2 ? 1.5 : -1.5], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })}deg`,
              scale: String(interpolate(frame, [c.at, c.at + 8], [1.8, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })),
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 36,
                background: colors.lime,
                color: colors.green,
                fontFamily: fonts.display,
                fontSize: 84,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontFamily: fonts.display, fontSize: 72, color: colors.cream, lineHeight: 1, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                {c.title}
              </div>
              <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 44, color: colors.lime, marginTop: 10 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.max(0, Math.sin((frame - 20) / 5)) * 0.05 * (frame > 20 ? 1 : 0);
  return (
    <SceneMotion enter="punch">
      <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260 }}>
          <Logo size={110} />
        </div>
        <div style={{ position: "absolute", top: 560, width: "100%" }}>
          <Slam at={4} style={{ fontSize: 104 }}>
            Stop losing
          </Slam>
          <Slam at={10} style={{ fontSize: 190, color: colors.lime, letterSpacing: "-0.04em", marginTop: 10 }}>
            ₹20,800
          </Slam>
          <Slam at={16} style={{ fontSize: 104, marginTop: 10 }}>
            a month.
          </Slam>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1210,
            borderRadius: 999,
            background: colors.lime,
            color: colors.green,
            padding: "34px 70px",
            fontFamily: fonts.body,
            fontWeight: 800,
            fontSize: 52,
            boxShadow: "0 0 60px rgba(198,244,50,0.45)",
            opacity: interpolate(frame, [20, 24], [0, 1], clamp),
            scale: String(pulse * interpolate(frame, [20, 28], [0.5, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })),
          }}
        >
          Book a free demo →
        </div>
        <div
          style={{
            position: "absolute",
            top: 1370,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 44,
            color: colors.cream,
            opacity: interpolate(frame, [26, 32], [0, 1], clamp),
          }}
        >
          Link in bio
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};
