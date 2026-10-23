import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { GlitchText, Slam, punch, useShake } from "../components/effects";
import { Avatar, Clock, Logo, Phone, SalonChair, TapRipple } from "../components/ui";
import { Bg, Shot } from "./types";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const springy = Easing.bezier(0.34, 1.56, 0.64, 1);

export type ShotProps<T extends Shot["type"]> = {
  shot: Extract<Shot, { type: T }>;
  dur: number;
  beats: number[];
};

const bgColor: Record<Bg, string> = {
  ink: colors.ink,
  green: colors.green,
  cream: colors.cream,
  lime: colors.lime,
};
const textOn = (bg: Bg) => (bg === "cream" || bg === "lime" ? colors.green : colors.cream);

// Start frame of segment i when a shot's beats are split into n parts.
export const seg = (beats: number[], i: number, n: number) => beats[Math.floor((i * beats.length) / n)] ?? 0;

// *lime*, ~red~ and _muted_ spans inside a line.
export const Rich: React.FC<{ text: string; onLight?: boolean }> = ({ text, onLight }) => (
  <>
    {text.split(/(\*[^*]+\*|~[^~]+~|_[^_]+_)/g).map((part, i) => {
      if (part.startsWith("*")) return <span key={i} style={{ color: onLight ? colors.greenLight : colors.lime, background: onLight ? colors.lime : undefined, padding: onLight ? "0 0.1em" : undefined }}>{part.slice(1, -1)}</span>;
      if (part.startsWith("~")) return <span key={i} style={{ color: colors.red }}>{part.slice(1, -1)}</span>;
      if (part.startsWith("_")) return <span key={i} style={{ color: colors.muted }}>{part.slice(1, -1)}</span>;
      return <React.Fragment key={i}>{part}</React.Fragment>;
    })}
  </>
);

const Tag: React.FC<{ text: string; light?: boolean }> = ({ text, light }) => (
  <div
    style={{
      position: "absolute",
      top: 1400,
      width: "100%",
      textAlign: "center",
      fontFamily: fonts.body,
      fontWeight: 700,
      fontSize: 34,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: light ? colors.greenLight : colors.muted,
    }}
  >
    {text}
  </div>
);

const Headline: React.FC<{ text: string; at?: number; top?: number; size?: number; light?: boolean }> = ({
  text,
  at = 0,
  top = 250,
  size = 100,
  light,
}) => (
  <div style={{ position: "absolute", top, left: 80, right: 80 }}>
    <Slam at={at} style={{ fontSize: size, color: light ? colors.green : colors.cream }}>
      {text.split("\n").map((l, i) => (
        <div key={i}>
          <Rich text={l} onLight={light} />
        </div>
      ))}
    </Slam>
  </div>
);

export const SlamShot: React.FC<ShotProps<"slam">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const bg = shot.bg ?? "green";
  const light = bg === "cream" || bg === "lime";
  const per = Math.max(1, Math.floor(beats.length / shot.lines.length));
  const stampAt = beats[Math.min(beats.length - 1, Math.max(1, beats.length - 2))] ?? 6;
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor[bg], alignItems: "center", justifyContent: "center", translate: useShake(stampAt, 10, shot.stamp ? 26 : 0) }}>
      {shot.kicker && (
        <div style={{ position: "absolute", top: 330, fontFamily: fonts.body, fontWeight: 800, fontSize: 48, color: light ? colors.greenLight : colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {shot.kicker}
        </div>
      )}
      <div style={{ padding: "0 80px", display: "flex", flexDirection: "column", gap: 18 }}>
        {shot.lines.map((line, i) => (
          <Slam key={i} at={beats[i * per] ?? 0} style={{ fontSize: shot.size ?? 112, color: textOn(bg) }}>
            <Rich text={line} onLight={light} />
          </Slam>
        ))}
      </div>
      {shot.stamp && frame >= stampAt && (
        <div
          style={{
            position: "absolute",
            top: 1180,
            fontFamily: fonts.display,
            fontSize: 120,
            color: colors.red,
            border: `10px solid ${colors.red}`,
            borderRadius: 24,
            padding: "6px 40px",
            rotate: "-8deg",
            scale: String(interpolate(frame, [stampAt, stampAt + 5], [2.6, 1], { ...clamp, easing: punch })),
          }}
        >
          {shot.stamp}
        </div>
      )}
      {shot.tag && <Tag text={shot.tag} light={light} />}
    </AbsoluteFill>
  );
};

export const NotifShot: React.FC<ShotProps<"notif">> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  const pop = Math.round(dur * 0.35);
  const buzz = frame >= pop && frame < pop + 14 ? Math.sin(frame * 2.6) * 4 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, alignItems: "center" }}>
      <Headline text={shot.headline} at={2} size={84} />
      <Phone width={540} height={800} style={{ position: "absolute", top: 640, rotate: `${buzz}deg` }}>
        <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 116, color: colors.cream, textAlign: "center", marginTop: 30 }}>{shot.time ?? "3:52"}</div>
        <div
          style={{
            marginTop: 70,
            background: colors.cream,
            borderRadius: 30,
            padding: 24,
            display: "flex",
            gap: 18,
            alignItems: "center",
            opacity: interpolate(frame, [pop, pop + 3], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [pop, pop + 8], [-380, 0], { ...clamp, easing: springy })}px`,
          }}
        >
          <Avatar letter={shot.sender[0]} size={72} bg={colors.green} color={colors.lime} />
          <div style={{ fontFamily: fonts.body, color: colors.ink }}>
            <div style={{ fontWeight: 800, fontSize: 28 }}>{shot.sender} · now</div>
            <div style={{ fontWeight: 500, fontSize: 29, lineHeight: 1.2 }}>{shot.message}</div>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

export const CounterShot: React.FC<ShotProps<"counter">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const n = shot.steps.length;
  const finalAt = seg(beats, n, n + 1);
  let i = 0;
  for (let k = 0; k < n; k++) if (frame >= seg(beats, k, n + 1)) i = k;
  const start = seg(beats, i, n + 1);
  const from = i === 0 ? 0 : shot.steps[i - 1].value;
  const value = interpolate(frame, [start, start + 10], [from, shot.steps[i].value], { ...clamp, easing: Easing.out(Easing.cubic) });
  const landed = frame >= finalAt;
  return (
    <AbsoluteFill style={{ backgroundColor: landed ? colors.green : colors.ink, alignItems: "center", justifyContent: "center", translate: useShake(finalAt, 12, 30) }}>
      {shot.label && (
        <div style={{ position: "absolute", top: 330, fontFamily: fonts.body, fontWeight: 800, fontSize: 50, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{shot.label}</div>
      )}
      <div style={{ fontFamily: fonts.display, fontSize: 200, color: colors.lime, letterSpacing: "-0.04em", textShadow: landed ? "0 0 80px rgba(198,244,50,0.45)" : undefined, scale: String(interpolate(frame, [finalAt, finalAt + 5, finalAt + 12], [1, 1.15, 1], clamp)) }}>
        {shot.prefix ?? "₹"}{Math.round(value).toLocaleString("en-IN")}
      </div>
      {shot.suffix && <div style={{ fontFamily: fonts.display, fontSize: 64, color: colors.cream, marginTop: -10 }}>{shot.suffix}</div>}
      <div key={i} style={{ marginTop: 30, fontFamily: fonts.display, fontSize: 80, color: colors.cream, translate: `${interpolate(frame, [start, start + 8], [500, 0], { ...clamp, easing: punch })}px 0px` }}>
        {shot.steps[i].note}
      </div>
      {shot.final && (
        <div style={{ position: "absolute", top: 1220, width: "100%" }}>
          <Slam at={finalAt} style={{ fontSize: 110 }}>
            <Rich text={shot.final} />
          </Slam>
        </div>
      )}
      {shot.tag && <Tag text={shot.tag} />}
    </AbsoluteFill>
  );
};

export const CallsShot: React.FC<ShotProps<"calls">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const n = shot.names.length;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center" }}>
      <Headline text={shot.headline} size={92} />
      <div style={{ position: "absolute", top: 600, display: "flex", flexDirection: "column", gap: 28 }}>
        {shot.names.map((name, k) => {
          const at = seg(beats, k, n);
          const stamped = frame >= at + 7;
          return (
            <div key={name} style={{ width: 820, height: 160, borderRadius: 40, background: colors.cream, display: "flex", alignItems: "center", gap: 28, padding: "0 36px", position: "relative", opacity: interpolate(frame, [at, at + 3], [0, 1], clamp), translate: `0px ${interpolate(frame, [at, at + 7], [150, 0], { ...clamp, easing: punch })}px` }}>
              <Avatar letter={name[0]} size={96} bg={colors.green} color={colors.lime} />
              <div style={{ fontFamily: fonts.body, color: colors.ink }}>
                <div style={{ fontWeight: 800, fontSize: 46 }}>{name}</div>
                <div style={{ fontWeight: 500, fontSize: 32, color: stamped ? colors.red : "#5B6B63" }}>{stamped ? "No answer" : "Calling…"}</div>
              </div>
              {stamped && (
                <div style={{ position: "absolute", right: 40, fontFamily: fonts.display, fontSize: 104, color: colors.red, rotate: "-8deg", scale: String(interpolate(frame, [at + 7, at + 11], [2.4, 1], { ...clamp, easing: punch })) }}>✕</div>
              )}
            </div>
          );
        })}
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

export const OpenSlotShot: React.FC<ShotProps<"openSlot">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const tap = seg(beats, 1, 4);
  const send = seg(beats, 2, 4);
  const opened = frame >= tap + 2;
  const ox = 540;
  const oy = 1010;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, alignItems: "center" }}>
      <Headline text={shot.headline} size={84} top={230} />
      <Phone width={560} height={900} style={{ position: "absolute", top: 560 }}>
        <div style={{ fontFamily: fonts.body, color: colors.cream }}>
          <div style={{ fontWeight: 800, fontSize: 34 }}>{shot.sub ?? "Today"}</div>
          <div style={{ height: 26 }} />
          {slots.map((s) => {
            const isOpen = s.cancelled && opened;
            return (
              <div key={s.time} style={{ borderRadius: 26, padding: "22px 24px", marginBottom: 18, background: s.cancelled ? (isOpen ? colors.lime : "rgba(255,77,61,0.16)") : "#18201C", border: s.cancelled && !isOpen ? `3px solid ${colors.red}` : "3px solid transparent", color: isOpen ? colors.green : colors.cream }}>
                <div style={{ fontWeight: 800, fontSize: 30 }}>{s.time}</div>
                <div style={{ fontWeight: 500, fontSize: 26, color: s.cancelled && !isOpen ? colors.red : undefined }}>{s.cancelled ? (isOpen ? "Slot open · sending to waitlist" : "Cancelled") : s.name}</div>
              </div>
            );
          })}
        </div>
      </Phone>
      <TapRipple at={tap} x={ox} y={oy} />
      {waitlist.map((w, i) => {
        const start = send + i * 3;
        const p = interpolate(frame, [start, start + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        const arrived = frame >= start + 10;
        return (
          <React.Fragment key={w.letter}>
            <Avatar letter={w.letter} size={120} bg={arrived ? colors.lime : "#22302A"} color={arrived ? colors.green : colors.muted} style={{ position: "absolute", left: w.x, top: w.y, border: `4px solid ${arrived ? colors.lime : "#33443B"}`, scale: String(interpolate(frame, [start + 10, start + 13, start + 18], [1, 1.25, 1], clamp)) }} />
            {p > 0 && p < 1 && (
              <div style={{ position: "absolute", left: ox + (w.x + 60 - ox) * p - 34, top: oy + (w.y + 60 - oy) * p - Math.sin(p * Math.PI) * 160 - 26, width: 68, height: 52, borderRadius: "18px 18px 18px 4px", background: colors.lime, boxShadow: "0 0 30px rgba(198,244,50,0.6)" }} />
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export const ClaimShot: React.FC<ShotProps<"claim">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const tap = beats[Math.floor(beats.length * (shot.claimAt ?? 0.55))] ?? Math.round(dur * 0.55);
  const claimed = frame >= tap + 2;
  const remaining = 600 - Math.min(frame, tap) * 3;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center" }}>
      <Headline text={shot.headline} size={96} top={240} />
      <Phone width={560} height={900} style={{ position: "absolute", top: 560 }}>
        <div style={{ fontFamily: fonts.body, color: colors.cream }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 30 }}>
            <Avatar letter="S" size={64} />
            <div style={{ fontWeight: 800, fontSize: 30 }}>SlotBack</div>
          </div>
          <div style={{ background: "#18201C", borderRadius: "30px 30px 30px 8px", padding: 28, fontSize: 32, fontWeight: 500, lineHeight: 1.3, opacity: interpolate(frame, [2, 6], [0, 1], clamp) }}>
            {shot.slot} just opened up.
            <div style={{ marginTop: 26, fontSize: 24, color: colors.muted, fontWeight: 700, letterSpacing: "0.08em" }}>LINK EXPIRES IN</div>
            <div style={{ fontFamily: fonts.display, fontSize: 96, color: claimed ? colors.muted : colors.lime, lineHeight: 1.1 }}>{mm}:{ss}</div>
            <div style={{ marginTop: 24, borderRadius: 999, padding: "24px 0", textAlign: "center", fontWeight: 800, fontSize: 36, background: claimed ? colors.cream : colors.lime, color: colors.green, scale: String(interpolate(frame, [tap, tap + 3, tap + 9], [1, 0.92, 1.04], clamp)) }}>
              {claimed ? "Booked ✓" : "Claim slot"}
            </div>
          </div>
        </div>
      </Phone>
      <TapRipple at={tap} x={540} y={1222} />
      {claimed && <Burst at={tap + 2} x={540} y={1222} />}
    </AbsoluteFill>
  );
};

const Burst: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const d = interpolate(frame, [at, at + 20], [0, 260 + random(`b${i}`) * 120], { ...clamp, easing: Easing.out(Easing.cubic) });
        return <div key={i} style={{ position: "absolute", left: x + Math.cos(a) * d - 10, top: y + Math.sin(a) * d - 10, width: 20, height: 20, borderRadius: i % 2 ? 10 : 3, background: i % 3 ? colors.lime : colors.cream, opacity: interpolate(frame, [at + 10, at + 24], [1, 0], clamp) }} />;
      })}
    </>
  );
};

export const FlipShot: React.FC<ShotProps<"flip">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const at = seg(beats, 1, 4);
  const flip = interpolate(frame, [at, at + 9], [0, 180], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const back = flip > 90;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, alignItems: "center" }}>
      <Headline text={shot.headline} at={at + 6} size={100} />
      <div style={{ position: "absolute", top: 760, perspective: 1200 }}>
        <div style={{ width: 760, height: 260, borderRadius: 44, transform: `rotateX(${flip}deg)`, background: back ? colors.lime : "rgba(255,77,61,0.16)", border: back ? "none" : `5px solid ${colors.red}`, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 50px", fontFamily: fonts.body }}>
          <div style={{ transform: back ? "rotateX(180deg)" : undefined }}>
            <div style={{ fontWeight: 800, fontSize: 60, color: back ? colors.green : colors.cream }}>{shot.time}</div>
            <div style={{ fontWeight: 700, fontSize: 46, color: back ? colors.green : colors.red }}>{back ? shot.after : shot.before}</div>
          </div>
        </div>
      </div>
      {shot.amount && back && (
        <div style={{ position: "absolute", top: 1110, fontFamily: fonts.display, fontSize: 170, color: colors.lime, textShadow: "0 0 70px rgba(198,244,50,0.4)", scale: String(interpolate(frame, [at + 10, at + 16, at + 22], [0.5, 1.12, 1], clamp)) }}>{shot.amount}</div>
      )}
    </AbsoluteFill>
  );
};

export const StepShot: React.FC<ShotProps<"step">> = ({ shot }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: shot.num % 2 ? colors.green : colors.ink, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: fonts.display, fontSize: 520, lineHeight: 1, color: colors.lime, scale: String(interpolate(frame, [0, 7], [2.4, 1], { ...clamp, easing: springy })), rotate: `${interpolate(frame, [0, 7], [-12, 0], clamp)}deg` }}>
        {shot.num}
      </div>
      <div style={{ marginTop: 40, padding: "0 90px" }}>
        <Slam at={4} style={{ fontSize: 92 }}>
          <Rich text={shot.text} />
        </Slam>
      </div>
    </AbsoluteFill>
  );
};

export const QuotesShot: React.FC<ShotProps<"quotes">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const n = shot.quotes.length;
  let i = 0;
  for (let k = 0; k < n; k++) if (frame >= seg(beats, k, n)) i = k;
  const at = seg(beats, i, n);
  const stampAt = at + Math.max(4, Math.round((seg(beats, i + 1, n) || at + 20) - at) * 0.5);
  return (
    <AbsoluteFill style={{ backgroundColor: i % 2 ? colors.ink : colors.green, alignItems: "center", justifyContent: "center", translate: useShake(stampAt, 8, 18) }}>
      {shot.headline && (
        <div style={{ position: "absolute", top: 300, fontFamily: fonts.body, fontWeight: 800, fontSize: 46, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{shot.headline}</div>
      )}
      <div key={i} style={{ padding: "0 90px", fontFamily: fonts.display, fontSize: 112, lineHeight: 1, color: colors.cream, textAlign: "center", scale: String(interpolate(frame, [at, at + 6], [1.6, 1], { ...clamp, easing: springy })), opacity: interpolate(frame, [at, at + 2], [0, 1], clamp) }}>
        <Rich text={shot.quotes[i]} />
      </div>
      {frame >= stampAt && (
        <div style={{ position: "absolute", top: 1220, fontFamily: fonts.display, fontSize: 90, color: colors.lime, border: `8px solid ${colors.lime}`, borderRadius: 22, padding: "4px 34px", rotate: "7deg", scale: String(interpolate(frame, [stampAt, stampAt + 5], [2.4, 1], { ...clamp, easing: punch })) }}>
          #{i + 1}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const TimerShot: React.FC<ShotProps<"timer">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const claimAt = shot.running ? beats[Math.floor(beats.length * 0.7)] ?? Math.round(dur * 0.7) : Infinity;
  const ticks = shot.running ? beats.filter((b) => b <= frame).length : 0;
  const remaining = 600 - Math.min(ticks * 17, 600);
  const claimed = frame >= claimAt;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pulse = shot.running ? 1 + 0.06 * Math.exp(-(frame - (beats.filter((b) => b <= frame).pop() ?? 0)) / 3) : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: claimed ? colors.lime : colors.ink, alignItems: "center", justifyContent: "center", translate: useShake(claimAt, 12, 30) }}>
      <Headline text={shot.headline} size={86} light={claimed} />
      {!claimed ? (
        <div style={{ fontFamily: fonts.display, fontSize: 300, color: colors.lime, letterSpacing: "-0.03em", scale: String(pulse), textShadow: "0 0 90px rgba(198,244,50,0.35)" }}>
          {mm}:{ss}
        </div>
      ) : (
        <GlitchText at={claimAt} length={6}>
          <div style={{ fontFamily: fonts.display, fontSize: 190, color: colors.green, scale: String(interpolate(frame, [claimAt, claimAt + 6], [2, 1], { ...clamp, easing: springy })) }}>CLAIMED</div>
        </GlitchText>
      )}
      {claimed && <Burst at={claimAt} x={540} y={960} />}
    </AbsoluteFill>
  );
};

export const ListShot: React.FC<ShotProps<"list">> = ({ shot, beats }) => {
  const bg = shot.bg ?? "ink";
  const light = bg === "cream" || bg === "lime";
  const n = shot.items.length;
  return (
    <AbsoluteFill style={{ backgroundColor: bgColor[bg], alignItems: "center", justifyContent: "center" }}>
      {shot.headline && <Headline text={shot.headline} size={80} light={light} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 34, padding: "0 80px", marginTop: shot.headline ? 200 : 0 }}>
        {shot.items.map((item, k) => (
          <Slam key={k} at={seg(beats, k, n)} style={{ fontSize: n > 3 ? 104 : 96, color: textOn(bg) }}>
            <Rich text={item} onLight={light} />
          </Slam>
        ))}
      </div>
      {shot.tag && <Tag text={shot.tag} light={light} />}
    </AbsoluteFill>
  );
};

export const ChairShot: React.FC<ShotProps<"chair">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const stampAt = seg(beats, 1, 3);
  return (
    <AbsoluteFill style={{ background: shot.dim ? `radial-gradient(circle at 50% 55%, #14281F 0%, ${colors.ink} 70%)` : `radial-gradient(circle at 50% 55%, ${colors.greenLight} 0%, ${colors.green} 45%, ${colors.ink} 100%)`, alignItems: "center", translate: useShake(stampAt, 10, shot.stamp ? 24 : 0) }}>
      <Headline text={shot.headline} size={110} />
      <div style={{ position: "absolute", top: 660, scale: String(interpolate(frame, [0, 60], [1, 1.06], clamp)), opacity: shot.dim ? 0.75 : 1 }}>
        <SalonChair size={500} client={shot.filled ? interpolate(frame, [stampAt, stampAt + 8], [0, 1], clamp) : 0} />
      </div>
      <div style={{ position: "absolute", top: 620, right: 110 }}>
        <Clock size={180} speed={shot.dim ? 6 : 30} />
      </div>
      {shot.stamp && frame >= stampAt && (
        <div style={{ position: "absolute", top: 1000, fontFamily: fonts.display, fontSize: 130, color: colors.red, border: `10px solid ${colors.red}`, borderRadius: 24, padding: "4px 40px", rotate: "-10deg", scale: String(interpolate(frame, [stampAt, stampAt + 5], [2.6, 1], { ...clamp, easing: punch })) }}>
          {shot.stamp}
        </div>
      )}
    </AbsoluteFill>
  );
};

// A day timeline with a 2-hour block that breaks and refills.
export const GapShot: React.FC<ShotProps<"gap">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const at = seg(beats, 1, 3);
  const hours = ["12", "1", "2", "3", "4", "5", "6"];
  const broken = shot.state === "broken" && frame >= at;
  const refilled = shot.state === "refilled";
  const fill = refilled ? interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center", translate: useShake(at, 10, broken ? 26 : 0) }}>
      <Headline text={shot.headline} size={96} at={shot.state === "booked" ? 2 : at} />
      <div style={{ position: "absolute", top: 640, left: 140, width: 800 }}>
        {hours.map((h, i) => (
          <div key={h} style={{ position: "absolute", top: i * 120, left: 0, width: 800, borderTop: "3px solid #2C4A3D", fontFamily: fonts.body, fontWeight: 700, fontSize: 32, color: colors.muted, paddingTop: 6 }}>{h}:00</div>
        ))}
        {[{ top: 6, h: 228, label: "Facial · Rhea" }, { top: 606, h: 108, label: "Brow tint · Isha" }].map((b) => (
          <div key={b.label} style={{ position: "absolute", top: b.top, left: 130, width: 660, height: b.h, borderRadius: 24, background: colors.greenLight, border: `3px solid ${colors.lime}`, fontFamily: fonts.body, fontWeight: 800, fontSize: 34, color: colors.cream, padding: "18px 24px" }}>{b.label}</div>
        ))}
        {!broken && !refilled && (
          <div style={{ position: "absolute", top: 246, left: 130, width: 660, height: 348, borderRadius: 24, background: colors.lime, fontFamily: fonts.display, fontSize: 54, color: colors.green, padding: "24px 28px" }}>Lash set · Zoya<div style={{ fontFamily: fonts.body, fontSize: 32, fontWeight: 700 }}>2:00 – 4:00</div></div>
        )}
        {broken &&
          Array.from({ length: 12 }).map((_, i) => {
            const t = frame - at;
            return <div key={i} style={{ position: "absolute", top: 246 + Math.floor(i / 3) * 87 + t * t * 0.9 * (0.6 + random(`gy${i}`)), left: 130 + (i % 3) * 220 + (random(`gx${i}`) - 0.5) * t * 14, width: 220, height: 87, background: colors.red, opacity: interpolate(t, [0, 18], [1, 0], clamp), rotate: `${(random(`gr${i}`) - 0.5) * t * 12}deg`, borderRadius: 10 }} />;
          })}
        {broken && (
          <div style={{ position: "absolute", top: 246, left: 130, width: 660, height: 348, borderRadius: 24, border: `4px dashed ${colors.red}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontSize: 64, color: colors.red, opacity: interpolate(frame, [at + 6, at + 12], [0, 1], clamp) }}>EMPTY</div>
        )}
        {refilled && (
          <div style={{ position: "absolute", top: 246, left: 130, width: 660, height: 348 * fill, overflow: "hidden", borderRadius: 24, background: colors.lime, fontFamily: fonts.display, fontSize: 54, color: colors.green, padding: "24px 28px" }}>Lash set · Naina<div style={{ fontFamily: fonts.body, fontSize: 32, fontWeight: 700 }}>from the waitlist</div></div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Stylised Goa map pins (illustrative, not real customers).
const pins = [
  { name: "Mapusa", x: 360, y: 700 },
  { name: "Panjim", x: 300, y: 930 },
  { name: "Vasco", x: 230, y: 1130 },
  { name: "Margao", x: 470, y: 1260 },
  { name: "Ponda", x: 640, y: 1010 },
];

export const PinsShot: React.FC<ShotProps<"pins">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center" }}>
      <Headline text={shot.headline} size={100} />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
        <path d="M330 600 C 420 640, 520 760, 560 900 S 700 1150, 640 1340 C 560 1400, 420 1380, 330 1300 S 150 1100, 190 950 S 260 700, 330 600 Z" fill={colors.greenLight} stroke="#2C4A3D" strokeWidth="6" />
      </svg>
      {pins.map((p, i) => {
        const at = seg(beats, i, pins.length);
        const on = frame >= at;
        return (
          <div key={p.name} style={{ position: "absolute", left: p.x, top: p.y, display: "flex", alignItems: "center", gap: 14, opacity: on ? 1 : 0, translate: `0px ${interpolate(frame, [at, at + 6], [-80, 0], { ...clamp, easing: springy })}px` }}>
            <div style={{ width: 44, height: 44, borderRadius: "50% 50% 50% 0", rotate: "-45deg", background: colors.lime, boxShadow: "0 0 24px rgba(198,244,50,0.6)" }} />
            <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 36, color: colors.cream, background: "rgba(7,20,15,0.7)", padding: "6px 16px", borderRadius: 14 }}>
              {p.name} <span style={{ color: colors.lime }}>· Filled</span>
            </div>
          </div>
        );
      })}
      <Tag text="Illustration" />
    </AbsoluteFill>
  );
};

export const RatingShot: React.FC<ShotProps<"rating">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const scoreAt = seg(beats, 1, 2);
  const tone = shot.score >= 8 ? colors.lime : shot.score >= 5 ? colors.cream : colors.red;
  return (
    <AbsoluteFill style={{ backgroundColor: shot.score >= 8 ? colors.green : colors.ink, alignItems: "center", justifyContent: "center", translate: useShake(scoreAt, 10, shot.score >= 8 ? 30 : 16) }}>
      {shot.headline && (
        <div style={{ position: "absolute", top: 280, fontFamily: fonts.body, fontWeight: 800, fontSize: 46, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{shot.headline}</div>
      )}
      <div style={{ width: 880, borderRadius: 44, background: colors.cream, padding: "50px 56px", fontFamily: fonts.display, fontSize: 84, lineHeight: 1.02, color: colors.green, textAlign: "center", rotate: "-2deg", scale: String(interpolate(frame, [0, 7], [1.4, 1], { ...clamp, easing: springy })) }}>
        <Rich text={shot.text} onLight />
      </div>
      {frame >= scoreAt && (
        <div style={{ marginTop: 60, fontFamily: fonts.display, fontSize: 230, lineHeight: 1, color: tone, textShadow: shot.score >= 8 ? "0 0 90px rgba(198,244,50,0.5)" : undefined, scale: String(interpolate(frame, [scoreAt, scoreAt + 6], [2.6, 1], { ...clamp, easing: punch })) }}>
          {shot.score}/10
        </div>
      )}
      {shot.note && frame >= scoreAt + 6 && (
        <div style={{ marginTop: 10, fontFamily: fonts.body, fontWeight: 700, fontSize: 46, color: colors.muted }}>{shot.note}</div>
      )}
    </AbsoluteFill>
  );
};

export const SplitShot: React.FC<ShotProps<"split">> = ({ shot, beats }) => {
  const frame = useCurrentFrame();
  const n = Math.max(shot.left.lines.length, shot.right.lines.length);
  const side = (s: { title: string; lines: string[] }, good: boolean, offset: number) => (
    <div style={{ flex: 1, background: good ? colors.green : colors.ink, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 300, gap: 40, borderLeft: good ? `6px solid ${colors.lime}` : undefined, translate: `0px ${interpolate(frame, [offset, offset + 8], [good ? 1920 : -1920, 0], { ...clamp, easing: punch })}px` }}>
      <div style={{ fontFamily: fonts.display, fontSize: 70, color: good ? colors.lime : colors.muted, textTransform: "uppercase" }}>{s.title}</div>
      {s.lines.map((l, k) => {
        const at = seg(beats, k + 1, n + 1);
        return (
          <div key={k} style={{ padding: "0 40px", textAlign: "center", fontFamily: fonts.display, fontSize: 56, lineHeight: 1.05, color: good ? colors.cream : "#9AA8A0", opacity: frame >= at ? 1 : 0, scale: String(interpolate(frame, [at, at + 6], [1.5, 1], { ...clamp, easing: springy })) }}>
            <Rich text={l} />
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ flexDirection: "row" }}>
      {side(shot.left, false, 0)}
      {side(shot.right, true, 3)}
    </AbsoluteFill>
  );
};

export const FlagShot: React.FC<ShotProps<"flag">> = ({ shot }) => {
  const frame = useCurrentFrame();
  const red = shot.color === "red";
  const c = red ? colors.red : colors.lime;
  return (
    <AbsoluteFill style={{ backgroundColor: red ? "#1B0E0C" : colors.green, alignItems: "center", justifyContent: "center", gap: 60 }}>
      <svg width="220" height="220" viewBox="0 0 100 100" style={{ rotate: `${interpolate(frame, [0, 8], [-25, 0], { ...clamp, easing: springy })}deg` }}>
        <rect x="18" y="8" width="7" height="88" rx="3" fill={colors.cream} />
        <path d="M25 12 C 45 4, 60 22, 86 14 L 86 52 C 60 60, 45 42, 25 50 Z" fill={c} />
      </svg>
      <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 50, letterSpacing: "0.14em", color: c }}>{red ? "RED FLAG" : "GREEN FLAG"} {shot.count ?? ""}</div>
      <div style={{ padding: "0 90px", textAlign: "center", fontFamily: fonts.display, fontSize: 104, lineHeight: 1, color: colors.cream, scale: String(interpolate(frame, [2, 9], [1.6, 1], { ...clamp, easing: springy })), opacity: interpolate(frame, [2, 4], [0, 1], clamp) }}>
        <Rich text={shot.text} />
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.green, alignItems: "center", justifyContent: "center", gap: 70 }}>
      <div style={{ scale: String(interpolate(frame, [0, 7], [1.8, 1], { ...clamp, easing: springy })) }}>
        <Logo size={130} />
      </div>
      <div style={{ borderRadius: 999, background: colors.lime, color: colors.green, padding: "30px 64px", fontFamily: fonts.body, fontWeight: 800, fontSize: 50, opacity: interpolate(frame, [6, 10], [0, 1], clamp), scale: String(interpolate(frame, [6, 13], [0.5, 1], { ...clamp, easing: springy })) }}>
        Free demo · link in bio
      </div>
    </AbsoluteFill>
  );
};

export const shotComponents: { [K in Shot["type"]]: React.FC<ShotProps<K>> } = {
  slam: SlamShot,
  notif: NotifShot,
  counter: CounterShot,
  calls: CallsShot,
  openSlot: OpenSlotShot,
  claim: ClaimShot,
  flip: FlipShot,
  step: StepShot,
  quotes: QuotesShot,
  timer: TimerShot,
  list: ListShot,
  chair: ChairShot,
  gap: GapShot,
  pins: PinsShot,
  rating: RatingShot,
  split: SplitShot,
  flag: FlagShot,
};
