import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { GlitchText, punch, useShake } from "../components/effects";
import { Logo } from "../components/ui";
import { Rich, seg } from "../series/shots";
import { GlassShot } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const springy = Easing.bezier(0.34, 1.56, 0.64, 1);

type Props<T extends GlassShot["type"]> = { shot: Extract<GlassShot, { type: T }>; dur: number; beats: number[] };

// No backdrop-filter: over the soft backdrop it barely shows and it triples render time.
export const glass: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
  border: "2px solid rgba(255,255,255,0.18)",
  borderRadius: 48,
  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3), 0 40px 90px rgba(0,0,0,0.42)",
};
export const glassLime: React.CSSProperties = {
  ...glass,
  background: "linear-gradient(135deg, rgba(214,255,90,0.96), rgba(170,220,30,0.86))",
  border: "2px solid rgba(255,255,255,0.5)",
  color: colors.green,
  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.6), 0 0 90px rgba(198,244,50,0.35), 0 40px 90px rgba(0,0,0,0.4)",
};

// Pop-in for any element: scale from `from`, fade, slight lift and de-blur.
const pop = (frame: number, at: number, len = 8, from = 0.6) => {
  const p = interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: springy });
  const o = interpolate(frame, [at, at + 3], [0, 1], clamp);
  return { opacity: o, scale: String(from + (1 - from) * p), translate: `0px ${(1 - Math.min(p, 1)) * 60}px`, filter: o < 1 ? `blur(${(1 - o) * 14}px)` : undefined } as React.CSSProperties;
};

// Always-moving backdrop shared by every shot: drifting lime and green light,
// rotating rings, floating glass orbs, a scrolling grid and rising sparks.
export const GlassBackdrop: React.FC<{ seed: string }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const r = (k: string) => random(`${seed}-${k}`);
  const blobs = [
    { c: "rgba(198,244,50,0.42)", s: 1300, x: 0.15, y: 0.18 },
    { c: "rgba(26,120,78,0.85)", s: 1500, x: 0.85, y: 0.5 },
    { c: "rgba(198,244,50,0.22)", s: 1200, x: 0.3, y: 0.88 },
    { c: "rgba(15,46,34,0.9)", s: 1300, x: 0.7, y: 0.05 },
  ];
  return (
    <AbsoluteFill style={{ background: colors.ink, overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const ph = r(`p${i}`) * Math.PI * 2;
        const x = b.x * 1080 + Math.sin(frame / (70 + i * 13) + ph) * 260 - b.s / 2;
        const y = b.y * 1920 + Math.cos(frame / (90 + i * 17) + ph) * 300 - b.s / 2;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: b.s, height: b.s, borderRadius: "50%", background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)` }} />;
      })}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(245,239,225,0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(245,239,225,0.05) 2px, transparent 2px)",
          backgroundSize: "120px 120px",
          backgroundPosition: `0px ${(frame * 1.2) % 120}px`,
          maskImage: "radial-gradient(ellipse at 50% 45%, #000 20%, transparent 75%)",
        }}
      />
      {[0, 1].map((i) => {
        const s = 900 + i * 500;
        return (
          <div
            key={`ring${i}`}
            style={{
              position: "absolute",
              left: (i ? 700 : -300) - s / 2 + 300,
              top: (i ? 1500 : 300) - s / 2,
              width: s,
              height: s,
              borderRadius: "50%",
              border: "4px solid rgba(198,244,50,0.3)",
              boxShadow: "0 0 70px rgba(198,244,50,0.22), inset 0 0 70px rgba(198,244,50,0.12)",
              rotate: `${frame * (i ? -0.3 : 0.4)}deg`,
              scale: String(1 + Math.sin(frame / 40 + i) * 0.04),
            }}
          />
        );
      })}
      {[0, 1, 2].map((i) => {
        const s = 120 + r(`os${i}`) * 140;
        return (
          <div
            key={`orb${i}`}
            style={{
              position: "absolute",
              left: r(`ox${i}`) * 900 + Math.sin(frame / (30 + i * 9)) * 40,
              top: 200 + r(`oy${i}`) * 1500 + Math.cos(frame / (36 + i * 7)) * 60,
              width: s,
              height: s,
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), rgba(255,255,255,0.08) 35%, rgba(198,244,50,0.14) 70%, rgba(255,255,255,0.04))",
              border: "2px solid rgba(255,255,255,0.25)",
              boxShadow: "inset -20px -30px 60px rgba(7,20,15,0.4), 0 30px 60px rgba(0,0,0,0.35)",
            }}
          />
        );
      })}
      {Array.from({ length: 16 }).map((_, i) => {
        const speed = 2 + r(`ss${i}`) * 4;
        const y = (1920 + 100 - ((frame * speed + r(`sy${i}`) * 2000) % 2100));
        return <div key={`sp${i}`} style={{ position: "absolute", left: r(`sx${i}`) * 1080, top: y, width: 8, height: 8, borderRadius: 4, background: colors.lime, opacity: 0.25 + r(`so${i}`) * 0.4, boxShadow: "0 0 14px rgba(198,244,50,0.8)" }} />;
      })}
    </AbsoluteFill>
  );
};

// Words rise in one after another with a blur-to-sharp pop.
const Words: React.FC<{ text: string; at: number; size: number; color?: string; stagger?: number }> = ({ text, at, size, color = colors.cream, stagger = 2 }) => {
  const frame = useCurrentFrame();
  // Keep markup spans whole so *lime words* stay coloured.
  const tokens = text.match(/(\*[^*]+\*|~[^~]+~|_[^_]+_|\S+)/g) ?? [];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.26}px`, fontFamily: fonts.display, fontSize: size, lineHeight: 1.0, letterSpacing: "-0.03em", color, textAlign: "center" }}>
      {tokens.map((tok, i) => {
        const s = at + i * stagger;
        const p = interpolate(frame, [s, s + 8], [0, 1], { ...clamp, easing: springy });
        const o = interpolate(frame, [s, s + 3], [0, 1], clamp);
        return (
          <span key={i} style={{ display: "inline-block", opacity: o, translate: `0px ${(1 - p) * 70}px`, scale: String(0.7 + 0.3 * p), filter: o < 1 ? `blur(${(1 - o) * 16}px)` : undefined, textShadow: tok.startsWith("*") ? "0 0 50px rgba(198,244,50,0.5)" : undefined }}>
            <Rich text={tok} />
          </span>
        );
      })}
    </div>
  );
};

const Kicker: React.FC<{ text: string; at?: number }> = ({ text, at = 0 }) => {
  const frame = useCurrentFrame();
  return (
  <div style={{ ...pop(frame, at, 6, 0.8), ...glass, borderRadius: 999, padding: "14px 34px", fontFamily: fonts.body, fontWeight: 800, fontSize: 34, letterSpacing: "0.14em", textTransform: "uppercase", color: colors.lime }}>{text}</div>
  );
};

// Slow push-in so a held frame is never still.
const Drift: React.FC<{ dur: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ dur, children, style }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", scale: String(interpolate(frame, [0, dur], [1, 1.06])), ...style }}>{children}</AbsoluteFill>;
};

export const TextShot: React.FC<Props<"text">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const n = shot.lines.length;
  const size = shot.size ?? (n > 2 ? 116 : 140);
  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
      {shot.lines.map((l, i) => (
        <Words key={i} text={l} at={seg(beats, i, Math.max(n, 2)) + (i === 0 ? 1 : 0)} size={size} />
      ))}
    </div>
  );
  return (
    <Drift dur={dur} style={{ gap: 50, padding: "0 70px", flexDirection: "column" }}>
      {shot.kicker && <Kicker text={shot.kicker} />}
      {shot.card ? <div style={{ ...glass, padding: "70px 60px" }}>{body}</div> : body}
      {shot.sub && (
        <div style={{ ...pop(frame, seg(beats, Math.max(n, 2) - 1, Math.max(n, 2)) + 6, 8), fontFamily: fonts.body, fontWeight: 700, fontSize: 46, color: "rgba(245,239,225,0.8)", textAlign: "center", maxWidth: 860 }}>
          <Rich text={shot.sub} />
        </div>
      )}
    </Drift>
  );
};

// Slot-machine word swap: one word every half beat, the last one holds.
export const TickerShot: React.FC<Props<"ticker">> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  const step = 7;
  const n = shot.words.length;
  const i = Math.min(n - 1, Math.floor(frame / step));
  const local = frame - i * step;
  const last = i === n - 1;
  const roll = interpolate(local, [0, 4], [1, 0], { ...clamp, easing: punch });
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 40, padding: "0 60px" }}>
      {shot.pre && <div style={{ fontFamily: fonts.display, fontSize: 80, color: colors.cream, textAlign: "center", lineHeight: 1 }}><Rich text={shot.pre} /></div>}
      <div style={{ ...(last ? glassLime : glass), padding: "34px 60px", overflow: "hidden", minWidth: 700, textAlign: "center", scale: String(last ? interpolate(local, [0, 4, 9], [1, 1.12, 1], clamp) : 1) }}>
        <div style={{ fontFamily: fonts.display, fontSize: 130, lineHeight: 1.05, letterSpacing: "-0.03em", color: last ? colors.green : colors.lime, translate: `0px ${roll * 140}px`, filter: roll > 0.05 ? `blur(${roll * 18}px)` : undefined }}>
          {shot.words[i].replace(/[*~_]/g, "")}
        </div>
      </div>
      {shot.post && last && <div style={{ ...pop(frame, i * step + 4, 8), fontFamily: fonts.display, fontSize: 70, color: colors.cream, textAlign: "center" }}><Rich text={shot.post} /></div>}
    </Drift>
  );
};

export const ChatShot: React.FC<Props<"chat">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const n = shot.msgs.length;
  const times = shot.msgs.map((_, k) => seg(beats, k, n) + 4);
  const shown = times.filter((t) => t <= frame).length;
  const nextIn = shown < n && shot.msgs[shown][0] === "in" && frame >= (times[shown] ?? 0) - 9;
  const scroll = Math.max(0, shown - 5) * 190;
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 40 }}>
      {shot.title && <Kicker text={shot.title} />}
      <div style={{ ...glass, width: 900, height: Math.min(1250, 330 + n * 200), borderRadius: 70, padding: "40px 36px", overflow: "hidden", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 26, borderBottom: "2px solid rgba(255,255,255,0.12)", fontFamily: fonts.body, fontWeight: 800, fontSize: 36, color: colors.cream }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: colors.lime, color: colors.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontSize: 34 }}>C</div>
          Client <span style={{ color: colors.muted, fontWeight: 600, fontSize: 28 }}>online</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 30, translate: `0px ${-interpolate(frame, [0, 1], [scroll, scroll])}px`, transition: "none" }}>
          {shot.msgs.slice(0, shown).map(([side, text], k) => {
            const pp = pop(frame, times[k], 8, 0.5);
            const out = side === "out";
            return (
              <div key={k} style={{ ...pp, transformOrigin: out ? "right bottom" : "left bottom", alignSelf: out ? "flex-end" : "flex-start", maxWidth: 680, padding: "26px 32px", borderRadius: out ? "38px 38px 10px 38px" : "38px 38px 38px 10px", background: out ? "linear-gradient(135deg, rgba(214,255,90,0.95), rgba(170,220,30,0.85))" : "rgba(255,255,255,0.12)", border: out ? "none" : "2px solid rgba(255,255,255,0.16)", color: out ? colors.green : colors.cream, fontFamily: fonts.body, fontWeight: 600, fontSize: 40, lineHeight: 1.3 }}>
                <Rich text={text} onLight={out} />
              </div>
            );
          })}
          {nextIn && (
            <div style={{ alignSelf: "flex-start", padding: "26px 34px", borderRadius: 38, background: "rgba(255,255,255,0.12)", display: "flex", gap: 12 }}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{ width: 16, height: 16, borderRadius: 8, background: colors.cream, opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame + d * 4) / 4)) }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Drift>
  );
};

export const StatShot: React.FC<Props<"stat">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const land = Math.round(dur * 0.55);
  const v = interpolate(frame, [2, land], [0, shot.value], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ring = interpolate(frame, [2, land], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const C = 2 * Math.PI * 380;
  return (
    <Drift dur={dur} style={{ translate: useShake(land, 10, 22) }}>
      <svg width={900} height={900} style={{ position: "absolute", rotate: "-90deg" }}>
        <circle cx={450} cy={450} r={380} stroke="rgba(255,255,255,0.1)" strokeWidth={26} fill="none" />
        <circle cx={450} cy={450} r={380} stroke={colors.lime} strokeWidth={26} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ring)} style={{ filter: "drop-shadow(0 0 24px rgba(198,244,50,0.7))" }} />
      </svg>
      <div style={{ ...glass, width: 640, height: 640, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 32, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.muted, textAlign: "center", padding: "0 60px" }}>{shot.label}</div>
        <div style={{ fontFamily: fonts.display, fontSize: String(Math.round(shot.value)).length > 5 ? 120 : 150, color: colors.lime, letterSpacing: "-0.04em", textShadow: "0 0 60px rgba(198,244,50,0.5)", scale: String(interpolate(frame, [land, land + 5, land + 12], [1, 1.14, 1], clamp)) }}>
          {shot.prefix ?? ""}{Math.round(v).toLocaleString("en-IN")}{shot.suffix ?? ""}
        </div>
      </div>
      {shot.note && (
        <div style={{ position: "absolute", top: 1480, width: "100%", ...pop(frame, land + 2, 8) }}>
          <Words text={shot.note} at={land + 2} size={84} />
        </div>
      )}
      <div style={{ position: "absolute", top: 260 }}>{beats.length > 0 && <Kicker text="Example numbers" />}</div>
    </Drift>
  );
};

export const StageShot: React.FC<Props<"stage">> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 50, padding: "0 70px" }}>
      <Kicker text={`Stage ${shot.i} of ${shot.n}`} />
      <div style={{ display: "flex", gap: 16 }}>
        {Array.from({ length: shot.n }).map((_, k) => (
          <div key={k} style={{ width: 110, height: 18, borderRadius: 9, background: k < shot.i ? colors.lime : "rgba(255,255,255,0.14)", boxShadow: k === shot.i - 1 ? "0 0 24px rgba(198,244,50,0.8)" : undefined, scale: k === shot.i - 1 ? `${interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: springy })} 1` : "1 1" }} />
        ))}
      </div>
      <GlitchText at={2} length={7}>
        <div style={{ fontFamily: fonts.display, fontSize: 150, color: colors.lime, textTransform: "uppercase", letterSpacing: "-0.03em", textAlign: "center", lineHeight: 0.95, textShadow: "0 0 60px rgba(198,244,50,0.45)", scale: String(interpolate(frame, [2, 10], [1.6, 1], { ...clamp, easing: springy })) }}>{shot.name}</div>
      </GlitchText>
      {shot.line && <div style={{ ...glass, padding: "36px 46px", ...pop(frame, 9, 8) }}><Words text={shot.line} at={10} size={62} /></div>}
    </Drift>
  );
};

export const VsShot: React.FC<Props<"vs">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const n = Math.max(shot.left.lines.length, shot.right.lines.length);
  const winAt = shot.win ? seg(beats, n + 1, n + 2) : Infinity;
  const won = frame >= winAt;
  const side = (s: { title: string; lines: string[] }, which: "left" | "right") => {
    const isWin = won && shot.win === which;
    const isLose = won && shot.win && shot.win !== which;
    const enter = interpolate(frame, [which === "left" ? 0 : 3, which === "left" ? 9 : 12], [which === "left" ? -900 : 900, 0], { ...clamp, easing: punch });
    return (
      <div style={{ ...(isWin ? glassLime : glass), flex: 1, minHeight: 980, padding: "50px 34px", display: "flex", flexDirection: "column", gap: 34, translate: `${enter}px 0px`, opacity: isLose ? 0.45 : 1, scale: String(isWin ? interpolate(frame, [winAt, winAt + 6, winAt + 12], [1, 1.08, 1.03], clamp) : isLose ? 0.94 : 1), position: "relative" }}>
        <div style={{ fontFamily: fonts.display, fontSize: 66, textTransform: "uppercase", color: isWin ? colors.green : colors.lime, textAlign: "center", lineHeight: 1 }}>{s.title}</div>
        {s.lines.map((l, k) => {
          const at = seg(beats, k + 1, n + 2);
          return (
            <div key={k} style={{ ...pop(frame, at, 7), fontFamily: fonts.body, fontWeight: 800, fontSize: 48, lineHeight: 1.18, color: isWin ? colors.green : colors.cream, textAlign: "center" }}>
              <Rich text={l} onLight={isWin} />
            </div>
          );
        })}
        {isLose && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontSize: 300, color: colors.red, scale: String(interpolate(frame, [winAt, winAt + 5], [2.4, 1], { ...clamp, easing: punch })) }}>✕</div>}
      </div>
    );
  };
  return (
    <Drift dur={dur}>
      <div style={{ display: "flex", gap: 28, padding: "0 50px", width: "100%" }}>
        {side(shot.left, "left")}
        {side(shot.right, "right")}
      </div>
      <div style={{ position: "absolute", width: 170, height: 170, borderRadius: 85, background: colors.lime, color: colors.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontSize: 72, boxShadow: "0 0 70px rgba(198,244,50,0.7)", rotate: `${interpolate(frame, [4, 14], [-200, 0], { ...clamp, easing: punch })}deg`, scale: String(interpolate(frame, [4, 14], [0, 1], { ...clamp, easing: springy })) }}>VS</div>
    </Drift>
  );
};

export const PollShot: React.FC<Props<"poll">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const fillAt = seg(beats, 1, 3);
  const top = Math.max(...shot.options.map((o) => o[1]));
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 50, padding: "0 70px" }}>
      <Words text={shot.q} at={1} size={96} />
      <div style={{ ...glass, width: 920, padding: 44, display: "flex", flexDirection: "column", gap: 28 }}>
        {shot.options.map(([label, pct], k) => {
          const at = fillAt + k * 3;
          const p = interpolate(frame, [at, at + 16], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
          const best = pct === top && frame >= at + 16;
          return (
            <div key={k} style={{ position: "relative", height: 130, borderRadius: 36, background: "rgba(255,255,255,0.08)", overflow: "hidden", ...pop(frame, 4 + k * 2, 7, 0.9) }}>
              <div style={{ position: "absolute", inset: 0, width: `${p}%`, background: best ? "linear-gradient(90deg, #b5e82a, #d6ff5a)" : "rgba(198,244,50,0.32)", boxShadow: best ? "0 0 40px rgba(198,244,50,0.6)" : undefined }} />
              <div style={{ position: "absolute", inset: "0 36px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: fonts.body, fontWeight: 800, fontSize: 44, color: best ? colors.green : colors.cream }}>
                <span><Rich text={label} onLight={best} /></span>
                <span>{Math.round(p)}%</span>
              </div>
            </div>
          );
        })}
        <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 26, color: colors.muted, textAlign: "center", letterSpacing: "0.1em" }}>ILLUSTRATIVE · VOTE IN THE COMMENTS</div>
      </div>
    </Drift>
  );
};

export const GridShot: React.FC<Props<"grid">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const n = shot.tiles.length;
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 46 }}>
      <Words text={shot.title} at={0} size={92} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, width: 920 }}>
        {shot.tiles.map(([emoji, label], k) => {
          const at = seg(beats, k, n + 1) + 3;
          return (
            <div key={k} style={{ ...glass, ...pop(frame, at, 8, 0.3), height: n > 4 ? 300 : 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, rotate: `${Math.sin((frame + k * 20) / 18) * 2}deg` }}>
              <div style={{ fontSize: n > 4 ? 110 : 140 }}>{emoji}</div>
              <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 36, color: colors.cream, textAlign: "center", padding: "0 20px" }}><Rich text={label} /></div>
            </div>
          );
        })}
      </div>
    </Drift>
  );
};

export const RankShot: React.FC<Props<"rank">> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  const score = shot.score ?? 0;
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 40, padding: "0 70px" }}>
      <div style={{ fontFamily: fonts.display, fontSize: 420, lineHeight: 0.8, color: "transparent", WebkitTextStroke: `6px ${colors.lime}`, textShadow: "0 0 60px rgba(198,244,50,0.3)", rotate: `${interpolate(frame, [0, 9], [-30, 0], { ...clamp, easing: springy })}deg`, scale: String(interpolate(frame, [0, 9], [2, 1], { ...clamp, easing: springy })) }}>#{shot.n}</div>
      <Words text={shot.text} at={5} size={96} />
      {shot.sub && <div style={{ ...pop(frame, 10, 8), fontFamily: fonts.body, fontWeight: 700, fontSize: 44, color: "rgba(245,239,225,0.8)", textAlign: "center" }}><Rich text={shot.sub} /></div>}
      {shot.score !== undefined && (
        <div style={{ ...glass, padding: "28px 36px", width: 760, ...pop(frame, 12, 8) }}>
          <div style={{ display: "flex", gap: 12 }}>
            {Array.from({ length: 10 }).map((_, k) => (
              <div key={k} style={{ flex: 1, height: 26, borderRadius: 13, background: frame >= 14 + k * 1.5 && k < score ? (score >= 7 ? colors.lime : score >= 4 ? "#F5C542" : colors.red) : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <div style={{ marginTop: 14, fontFamily: fonts.display, fontSize: 50, color: colors.cream, textAlign: "center" }}>{score}/10</div>
        </div>
      )}
    </Drift>
  );
};

export const CheckShot: React.FC<Props<"check">> = ({ shot, beats, dur }) => {
  const frame = useCurrentFrame();
  const n = shot.items.length;
  return (
    <Drift dur={dur} style={{ flexDirection: "column", gap: 40, padding: "0 70px" }}>
      {shot.title && <Words text={shot.title} at={0} size={90} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 920 }}>
        {shot.items.map((item, k) => {
          const at = seg(beats, k, n) + 3;
          const tick = interpolate(frame, [at + 4, at + 10], [0, 1], clamp);
          return (
            <div key={k} style={{ ...glass, ...pop(frame, at, 7, 0.8), display: "flex", alignItems: "center", gap: 28, padding: "30px 36px", borderRadius: 36 }}>
              <div style={{ width: 76, height: 76, flexShrink: 0, borderRadius: 24, background: tick > 0 ? colors.lime : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: tick > 0.9 ? "0 0 30px rgba(198,244,50,0.6)" : undefined }}>
                <svg width={46} height={46} viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6" fill="none" stroke={colors.green} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - tick)} /></svg>
              </div>
              <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 44, color: colors.cream, lineHeight: 1.15 }}><Rich text={item} /></div>
            </div>
          );
        })}
      </div>
    </Drift>
  );
};

export const PoolEndCard: React.FC<{ cta: string }> = ({ cta }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
      <div style={{ ...glass, padding: "80px 70px", display: "flex", flexDirection: "column", alignItems: "center", gap: 56, scale: String(interpolate(frame, [0, 8], [1.5, 1], { ...clamp, easing: springy })) }}>
        <Logo size={160} />
        <div style={{ ...glassLime, borderRadius: 999, padding: "34px 64px", fontFamily: fonts.body, fontWeight: 800, fontSize: 56, ...pop(frame, 6, 8, 0.4) }}>{cta}</div>
        <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 44, color: colors.muted, opacity: interpolate(frame, [10, 14], [0, 1], clamp) }}>@slotback.app</div>
      </div>
    </AbsoluteFill>
  );
};

export const glassComponents: { [K in GlassShot["type"]]: React.FC<Props<K>> } = {
  text: TextShot,
  ticker: TickerShot,
  chat: ChatShot,
  stat: StatShot,
  stage: StageShot,
  vs: VsShot,
  poll: PollShot,
  grid: GridShot,
  rank: RankShot,
  check: CheckShot,
};
