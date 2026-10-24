import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { GlitchText, SceneMotion, Slam, punch, useShake } from "../components/effects";
import { Avatar, Clock, Phone, SalonChair } from "../components/ui";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const buzz = frame < 16 ? Math.sin(frame * 2.6) * 4 * (1 - frame / 16) : 0;
  return (
    <SceneMotion exit="whip" exitLength={6}>
      <AbsoluteFill style={{ backgroundColor: colors.ink, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 250, width: "100%" }}>
          <GlitchText at={14} length={6}>
            <Slam at={14} style={{ fontSize: 108 }}>
              Your 4 PM
              <br />
              <span style={{ color: colors.lime }}>just cancelled.</span>
            </Slam>
          </GlitchText>
        </div>
        <Phone
          width={560}
          height={820}
          style={{ position: "absolute", top: 610, rotate: `${buzz}deg`, translate: useShake(0, 14, 10) }}
        >
          <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 120, color: colors.cream, textAlign: "center", marginTop: 40 }}>
            3:52
          </div>
          <div style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: 30, color: colors.muted, textAlign: "center" }}>
            Friday, 24 October
          </div>
          <div
            style={{
              marginTop: 60,
              background: colors.cream,
              borderRadius: 32,
              padding: 26,
              display: "flex",
              gap: 20,
              alignItems: "center",
              translate: `0px ${interpolate(frame, [4, 12], [-420, 0], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) })}px`,
              opacity: interpolate(frame, [4, 7], [0, 1], clamp),
            }}
          >
            <Avatar letter="P" size={76} bg={colors.green} color={colors.lime} />
            <div style={{ fontFamily: fonts.body, color: colors.ink }}>
              <div style={{ fontWeight: 800, fontSize: 30 }}>Priya · now</div>
              <div style={{ fontWeight: 500, fontSize: 30, lineHeight: 1.2 }}>Sorry, can't make my 4 PM today</div>
            </div>
          </div>
        </Phone>
      </AbsoluteFill>
    </SceneMotion>
  );
};

export const EmptyChair: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneMotion enter="whip" exit="punch" exitLength={5}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, ${colors.greenLight} 0%, ${colors.green} 45%, ${colors.ink} 100%)`,
          alignItems: "center",
        }}
      >
        <div style={{ position: "absolute", top: 280, width: "100%" }}>
          <Slam at={6} style={{ fontSize: 132 }}>
            Empty
            <br />
            <span style={{ color: colors.lime }}>chair.</span>
          </Slam>
        </div>
        <div
          style={{
            position: "absolute",
            top: 640,
            scale: String(interpolate(frame, [0, 60], [1, 1.08], clamp)),
          }}
        >
          <SalonChair size={520} />
        </div>
        <div style={{ position: "absolute", top: 600, right: 110 }}>
          <Clock size={190} speed={30} />
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

const formatInr = (n: number) => Math.round(n).toLocaleString("en-IN");

export const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const value =
    frame < 30
      ? interpolate(frame, [4, 24], [0, 800], { ...clamp, easing: punch })
      : interpolate(frame, [54, 80], [800, 20800], { ...clamp, easing: Easing.in(Easing.quad) });
  const landed = frame >= 80;
  return (
    <SceneMotion enter="punch" exit="push" exitLength={6}>
      <AbsoluteFill
        style={{
          backgroundColor: landed ? colors.green : colors.ink,
          alignItems: "center",
          justifyContent: "center",
          translate: useShake(80, 14, 34),
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 330,
            fontFamily: fonts.body,
            fontWeight: 800,
            fontSize: 52,
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          1 cancellation a day
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: interpolate(frame, [0, 54, 80], [190, 190, 210], clamp),
            color: colors.lime,
            letterSpacing: "-0.04em",
            scale: String(interpolate(frame, [80, 86, 96], [1, 1.18, 1], clamp)),
            textShadow: landed ? `0 0 80px rgba(198,244,50,0.45)` : undefined,
          }}
        >
          ₹{formatInr(value)}
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: fonts.display,
            fontSize: 96,
            color: colors.cream,
            opacity: interpolate(frame, [30, 36, 76, 80], [0, 1, 1, 0], clamp),
            translate: `${interpolate(frame, [30, 40], [600, 0], { ...clamp, easing: punch })}px 0px`,
          }}
        >
          × 26 days
        </div>
        <div style={{ position: "absolute", top: 1230, width: "100%" }}>
          <Slam at={82} style={{ fontSize: 100 }}>
            Every month.
            <br />
            <span style={{ color: colors.red }}>Gone.</span>
          </Slam>
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};

const calls = [
  { name: "Riya", at: 6 },
  { name: "Sneha", at: 18 },
  { name: "Anil", at: 30 },
];

export const Calling: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneMotion enter="push">
      <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 260, width: "100%" }}>
          <Slam at={0} style={{ fontSize: 96 }}>
            Calling clients
            <br />
            one by one?
          </Slam>
        </div>
        <div style={{ position: "absolute", top: 640, display: "flex", flexDirection: "column", gap: 34 }}>
          {calls.map(({ name, at }) => {
            const stamped = frame >= at + 9;
            return (
              <div
                key={name}
                style={{
                  width: 820,
                  height: 170,
                  borderRadius: 40,
                  background: colors.cream,
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  padding: "0 36px",
                  position: "relative",
                  opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
                  translate: `0px ${interpolate(frame, [at, at + 8], [160, 0], { ...clamp, easing: punch })}px`,
                }}
              >
                <Avatar letter={name[0]} size={100} bg={colors.green} color={colors.lime} />
                <div style={{ fontFamily: fonts.body, color: colors.ink }}>
                  <div style={{ fontWeight: 800, fontSize: 48 }}>{name}</div>
                  <div style={{ fontWeight: 500, fontSize: 34, color: stamped ? colors.red : "#5B6B63" }}>
                    {stamped ? "No answer" : "Calling…"}
                  </div>
                </div>
                {stamped && (
                  <div
                    style={{
                      position: "absolute",
                      right: 40,
                      fontFamily: fonts.display,
                      fontSize: 110,
                      color: colors.red,
                      rotate: "-8deg",
                      scale: String(interpolate(frame, [at + 9, at + 14], [2.4, 1], { ...clamp, easing: punch })),
                    }}
                  >
                    ✕
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneMotion>
  );
};
