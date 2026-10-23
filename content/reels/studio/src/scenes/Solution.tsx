import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { SceneMotion, Slam, punch, useShake } from "../components/effects";
import { Avatar, Logo, Phone, SalonChair, TapRipple } from "../components/ui";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.green,
        alignItems: "center",
        justifyContent: "center",
        translate: useShake(3, 10, 24),
      }}
    >
      {[0, 6].map((delay) => (
        <div
          key={delay}
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: 200,
            border: `${delay ? 6 : 14}px solid ${colors.lime}`,
            opacity: interpolate(frame, [delay + 2, delay + 24], [0.9, 0], clamp),
            scale: String(interpolate(frame, [delay + 2, delay + 24], [0.3, 3.2], { ...clamp, easing: Easing.out(Easing.cubic) })),
          }}
        />
      ))}
      <div
        style={{
          scale: String(interpolate(frame, [0, 7], [3, 1], { ...clamp, easing: Easing.bezier(0.34, 1.4, 0.64, 1) })),
          opacity: interpolate(frame, [0, 2], [0, 1], clamp),
        }}
      >
        <Logo size={170} tagline />
      </div>
    </AbsoluteFill>
  );
};

const slots = [
  { time: "2:00 PM", name: "Ananya · Hair spa" },
  { time: "3:00 PM", name: "Kavya · Threading" },
  { time: "4:00 PM", name: "Priya · Haircut", cancelled: true },
  { time: "5:00 PM", name: "Meera · Facial" },
];

const waitlist = [
  { letter: "R", x: 80, y: 700 },
  { letter: "S", x: 70, y: 1060 },
  { letter: "T", x: 900, y: 640 },
  { letter: "N", x: 920, y: 940 },
  { letter: "D", x: 880, y: 1240 },
];

const TAP = 24;
const SEND = 40;

export const OpenSlot: React.FC = () => {
  const frame = useCurrentFrame();
  const opened = frame >= TAP + 2;
  // Bubble origin: the 4 PM card inside the phone.
  const ox = 540;
  const oy = 1010;
  return (
    <SceneMotion enter="push" exit="whip" exitLength={6}>
      <AbsoluteFill style={{ backgroundColor: colors.ink, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 240, width: "100%" }}>
          <Slam at={2} style={{ fontSize: 120, color: colors.lime }}>
            1 tap.
          </Slam>
          <Slam at={SEND} style={{ fontSize: 64, marginTop: 18, fontFamily: fonts.body, fontWeight: 800 }}>
            Your waitlist gets a link.
          </Slam>
        </div>
        <Phone width={560} height={900} style={{ position: "absolute", top: 560 }}>
          <div style={{ fontFamily: fonts.body, color: colors.cream }}>
            <div style={{ fontWeight: 800, fontSize: 34 }}>Salon Aura</div>
            <div style={{ fontWeight: 500, fontSize: 26, color: colors.muted, marginBottom: 26 }}>Today</div>
            {slots.map((s) => {
              const isOpen = s.cancelled && opened;
              return (
                <div
                  key={s.time}
                  style={{
                    borderRadius: 26,
                    padding: "22px 24px",
                    marginBottom: 18,
                    background: s.cancelled ? (isOpen ? colors.lime : "rgba(255,77,61,0.16)") : "#18201C",
                    border: s.cancelled && !isOpen ? `3px solid ${colors.red}` : "3px solid transparent",
                    color: isOpen ? colors.green : colors.cream,
                    scale: s.cancelled ? String(interpolate(frame, [TAP, TAP + 3, TAP + 8], [1, 0.94, 1], clamp)) : "1",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 30 }}>{s.time}</div>
                  <div style={{ fontWeight: 500, fontSize: 26, color: s.cancelled && !isOpen ? colors.red : undefined }}>
                    {s.cancelled ? (isOpen ? "Slot open · sending to waitlist" : "Cancelled") : s.name}
                  </div>
                </div>
              );
            })}
          </div>
        </Phone>
        <TapRipple at={TAP} x={ox} y={oy} />
        {waitlist.map((w, i) => {
          const start = SEND + i * 6;
          const p = interpolate(frame, [start, start + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
          const arrived = frame >= start + 14;
          const bx = ox + (w.x + 60 - ox) * p;
          const by = oy + (w.y + 60 - oy) * p - Math.sin(p * Math.PI) * 160;
          return (
            <React.Fragment key={w.letter}>
              <Avatar
                letter={w.letter}
                size={120}
                bg={arrived ? colors.lime : "#22302A"}
                color={arrived ? colors.green : colors.muted}
                style={{
                  position: "absolute",
                  left: w.x,
                  top: w.y,
                  border: `4px solid ${arrived ? colors.lime : "#33443B"}`,
                  scale: String(interpolate(frame, [start + 14, start + 18, start + 24], [1, 1.25, 1], clamp)),
                  opacity: interpolate(frame, [10 + i * 3, 16 + i * 3], [0, 1], clamp),
                }}
              />
              {p > 0 && p < 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: bx - 34,
                    top: by - 26,
                    width: 68,
                    height: 52,
                    borderRadius: "18px 18px 18px 4px",
                    background: colors.lime,
                    boxShadow: "0 0 30px rgba(198,244,50,0.6)",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </SceneMotion>
  );
};

const CLAIM_TAP = 50;

export const Claim: React.FC = () => {
  const frame = useCurrentFrame();
  const claimed = frame >= CLAIM_TAP + 2;
  // Timer runs fast for drama, then freezes when claimed.
  const remaining = 600 - Math.min(frame, CLAIM_TAP) * 3;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <SceneMotion enter="whip" exit="blur" exitLength={7}>
      <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 240, width: "100%" }}>
          <Slam at={2} style={{ fontSize: 110 }}>
            First to claim
            <br />
            <span style={{ color: colors.lime }}>wins.</span>
          </Slam>
        </div>
        <Phone width={560} height={900} style={{ position: "absolute", top: 560 }}>
          <div style={{ fontFamily: fonts.body, color: colors.cream }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 30 }}>
              <Avatar letter="S" size={64} />
              <div style={{ fontWeight: 800, fontSize: 30 }}>SlotBack</div>
            </div>
            <div
              style={{
                background: "#18201C",
                borderRadius: "30px 30px 30px 8px",
                padding: 28,
                fontSize: 32,
                fontWeight: 500,
                lineHeight: 1.3,
                opacity: interpolate(frame, [4, 8], [0, 1], clamp),
                translate: `0px ${interpolate(frame, [4, 12], [60, 0], { ...clamp, easing: punch })}px`,
              }}
            >
              A <b>4:00 PM haircut</b> at Salon Aura just opened up.
              <div style={{ marginTop: 26, fontSize: 24, color: colors.muted, fontWeight: 700, letterSpacing: "0.08em" }}>
                LINK EXPIRES IN
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: 96, color: claimed ? colors.muted : colors.lime, lineHeight: 1.1 }}>
                {mm}:{ss}
              </div>
              <div
                style={{
                  marginTop: 24,
                  borderRadius: 999,
                  padding: "24px 0",
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: 36,
                  background: claimed ? colors.cream : colors.lime,
                  color: colors.green,
                  scale: String(interpolate(frame, [CLAIM_TAP, CLAIM_TAP + 3, CLAIM_TAP + 9], [1, 0.92, 1.04], clamp)),
                }}
              >
                {claimed ? "Booked ✓" : "Claim slot"}
              </div>
            </div>
          </div>
        </Phone>
        <TapRipple at={CLAIM_TAP} x={540} y={1222} />
        {claimed &&
          Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const d = interpolate(frame, [CLAIM_TAP + 2, CLAIM_TAP + 22], [0, 260 + random(`b${i}`) * 120], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 540 + Math.cos(a) * d - 10,
                  top: 1222 + Math.sin(a) * d - 10,
                  width: 20,
                  height: 20,
                  borderRadius: i % 2 ? 10 : 3,
                  background: i % 3 ? colors.lime : colors.cream,
                  opacity: interpolate(frame, [CLAIM_TAP + 12, CLAIM_TAP + 26], [1, 0], clamp),
                }}
              />
            );
          })}
      </AbsoluteFill>
    </SceneMotion>
  );
};

const FLIP = 14;

export const Filled: React.FC = () => {
  const frame = useCurrentFrame();
  const flip = interpolate(frame, [FLIP, FLIP + 10], [0, 180], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const back = flip > 90;
  const wipe = interpolate(frame, [80, 90], [1920, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <SceneMotion enter="blur">
      <AbsoluteFill style={{ backgroundColor: colors.ink, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 240, width: "100%" }}>
          <Slam at={FLIP + 10} style={{ fontSize: 110 }}>
            Chair filled.
            <br />
            <span style={{ color: colors.lime }}>Money back.</span>
          </Slam>
        </div>
        <div style={{ position: "absolute", top: 600, display: "flex", alignItems: "center", gap: 30 }}>
          <SalonChair size={300} client={interpolate(frame, [FLIP + 6, FLIP + 16], [0, 1], clamp)} />
          <div style={{ perspective: 1200 }}>
            <div
              style={{
                width: 480,
                height: 210,
                borderRadius: 36,
                transform: `rotateX(${flip}deg)`,
                background: back ? colors.lime : "rgba(255,77,61,0.16)",
                border: back ? "none" : `4px solid ${colors.red}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 36px",
                fontFamily: fonts.body,
              }}
            >
              <div style={{ transform: back ? "rotateX(180deg)" : undefined }}>
                <div style={{ fontWeight: 800, fontSize: 44, color: back ? colors.green : colors.cream }}>4:00 PM</div>
                <div style={{ fontWeight: 700, fontSize: 36, color: back ? colors.green : colors.red }}>
                  {back ? "Filled · Riya" : "Cancelled"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 1060,
            fontFamily: fonts.display,
            fontSize: 190,
            color: colors.lime,
            letterSpacing: "-0.04em",
            textShadow: "0 0 70px rgba(198,244,50,0.4)",
            opacity: interpolate(frame, [32, 36], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [32, 44], [120, 0], { ...clamp, easing: punch })}px`,
            scale: String(interpolate(frame, [32, 40, 48], [0.6, 1.12, 1], clamp)),
          }}
        >
          +₹800
        </div>
        <div
          style={{
            position: "absolute",
            top: 1290,
            fontFamily: fonts.body,
            fontWeight: 800,
            fontSize: 48,
            color: colors.cream,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: interpolate(frame, [40, 46], [0, 1], clamp),
          }}
        >
          recovered
        </div>
        <AbsoluteFill style={{ backgroundColor: colors.cream, translate: `0px ${wipe}px` }} />
      </AbsoluteFill>
    </SceneMotion>
  );
};
