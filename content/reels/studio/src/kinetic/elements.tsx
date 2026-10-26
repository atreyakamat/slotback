import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { Rich, Theme } from "./themes";
import { El } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const snap = Easing.bezier(0.16, 1, 0.3, 1);

export type ElProps<T extends El["t"]> = { el: Extract<El, { t: T }>; th: Theme; dur: number; beats: number[] };

// Start frame of part i of n, snapped to the cut's beats.
export const part = (beats: number[], i: number, n: number) => beats[Math.floor((i * beats.length) / n)] ?? 0;

const plain = (s: string) => s.replace(/[*~_]/g, "");
// Font size that fits the longest line across a 1080px frame with margins.
// Archivo Black advance widths in em, measured from the font file.
const W: Record<string, number> = { I: 0.39, E: 0.72, F: 0.67, J: 0.67, L: 0.67, P: 0.72, S: 0.72, T: 0.72, Z: 0.72, M: 0.94, W: 1, G: 0.83, H: 0.83, K: 0.83, N: 0.83, O: 0.83, Q: 0.83, U: 0.83, " ": 0.33, ".": 0.33, ",": 0.33, ":": 0.33, "!": 0.33, "-": 0.33, "?": 0.61, "'": 0.28, "’": 0.28, "‘": 0.28, '"': 0.5, "“": 0.5, "”": 0.5, "%": 1, "&": 0.89, "…": 1, "+": 0.66, "=": 0.66 };
const ems = (text: string) => [...text.toUpperCase()].reduce((sum, c) => sum + (W[c] ?? (/[0-9]/.test(c) ? 0.67 : 0.78)), 0);

export const fit = (lines: string[], max = 300, min = 64, width = 920) => {
  const widest = Math.max(...lines.map((l) => ems(plain(l))), 1);
  return Math.round(Math.max(min, Math.min(max, width / widest)));
};

// Breaks a long single line at the space nearest its middle, so it can set
// on two lines at a bigger size.
const balance = (text: string) => {
  if (text.includes("\n") || plain(text).length <= 11) return text;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? text : `${text.slice(0, best)}\n${text.slice(best + 1)}`;
};

// Hard-cut entrance: no fade, a 3-frame scale settle.
const In: React.FC<{ at?: number; children: React.ReactNode; from?: number; style?: React.CSSProperties }> = ({ at = 0, children, from = 1.14, style }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = interpolate(frame, [at, at + 3], [from, 1], { ...clamp, easing: snap });
  return <div style={{ scale: String(s), ...style }}>{children}</div>;
};

const Display: React.FC<{ th: Theme; size: number; children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ th, size, children, color, style }) => (
  <div style={{ fontFamily: fonts.display, fontSize: size, lineHeight: 1.04, color: color ?? th.fg, textTransform: "uppercase", textAlign: "center", whiteSpace: "pre-line", ...style }}>{children}</div>
);

const Kicker: React.FC<{ th: Theme; text: string; top?: number }> = ({ th, text, top = 300 }) => (
  <div style={{ position: "absolute", top, width: "100%", textAlign: "center", fontFamily: fonts.body, fontWeight: 800, fontSize: 46, letterSpacing: "0.12em", textTransform: "uppercase", color: th.muted }}>{text}</div>
);

const Center: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 24 }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 70px", flexDirection: "column", gap }}>{children}</AbsoluteFill>
);

const Word: React.FC<ElProps<"word">> = ({ el, th }) => {
  const text = el.size ? el.text : balance(el.text);
  const lines = text.split("\n");
  const size = el.size ?? fit(lines);
  return (
    <Center>
      {el.kicker && <Kicker th={th} text={el.kicker} />}
      <In>
        <Display th={th} size={size} style={el.mono ? { fontFamily: "DejaVu Sans Mono, monospace", fontWeight: 700 } : undefined}>
          <Rich text={text} th={th} />
        </Display>
      </In>
    </Center>
  );
};

// Word exchange: the old word is struck and knocked out, the new one slams in.
const Swap: React.FC<ElProps<"swap">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const mid = part(beats, 1, 2);
  const strike = interpolate(frame, [mid - 4, mid - 1], [0, 1], clamp);
  const swapped = frame >= mid;
  const size = el.size ?? fit([el.before, el.after], 230);
  const small = fit([el.lead ?? "", el.trail ?? ""], 110);
  const jitter = swapped && frame < mid + 4 ? (random(`j${frame}`) - 0.5) * 30 : 0;
  return (
    <Center gap={10}>
      {el.lead && (
        <Display th={th} size={small}>
          <Rich text={el.lead} th={th} />
        </Display>
      )}
      <div style={{ position: "relative", translate: `${jitter}px 0` }}>
        {!swapped ? (
          <Display th={th} size={size} color={th.alert}>
            <span style={{ position: "relative" }}>
              {plain(el.before)}
              <span style={{ position: "absolute", left: 0, top: "52%", height: size * 0.12, width: `${strike * 100}%`, background: th.fg }} />
            </span>
          </Display>
        ) : (
          <In at={mid} from={1.5}>
            <Display th={th} size={size} color={th.hi} style={{ background: th.hiBg, padding: th.hiBg ? "0 0.15em" : undefined }}>
              {plain(el.after)}
            </Display>
          </In>
        )}
      </div>
      {el.trail && (
        <Display th={th} size={small}>
          <Rich text={el.trail} th={th} />
        </Display>
      )}
    </Center>
  );
};

const Stack: React.FC<ElProps<"stack">> = ({ el, th, beats }) => {
  const size = el.size ?? fit(el.lines, 170);
  return (
    <Center gap={16}>
      {el.lines.map((l, i) => (
        <In key={i} at={part(beats, i, el.lines.length)}>
          <Display th={th} size={size}>
            <Rich text={l} th={th} />
          </Display>
        </In>
      ))}
    </Center>
  );
};

const Chat: React.FC<ElProps<"chat">> = ({ el, th, beats }) => (
  <AbsoluteFill style={{ padding: "260px 70px", justifyContent: "center", gap: 26 }}>
    {el.title && <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 40, color: th.muted, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: 20 }}>{el.title}</div>}
    {el.msgs.map((m, i) => (
      <In key={i} at={part(beats, i, el.msgs.length)} from={0.6} style={{ alignSelf: m.me ? "flex-end" : "flex-start", transformOrigin: m.me ? "right" : "left" }}>
        <div
          style={{
            maxWidth: 760,
            padding: "26px 36px",
            borderRadius: 40,
            borderBottomRightRadius: m.me ? 8 : 40,
            borderBottomLeftRadius: m.me ? 40 : 8,
            background: m.me ? colors.lime : colors.cream,
            color: colors.green,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 1.2,
            boxShadow: "0 12px 0 rgba(0,0,0,0.18)",
          }}
        >
          {m.text}
        </div>
      </In>
    ))}
  </AbsoluteFill>
);

const Bar: React.FC<ElProps<"bar">> = ({ el, th, dur }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [2, dur - 6], [el.from, el.to], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Center gap={40}>
      <Display th={th} size={fit([el.label], 110)}>
        <Rich text={el.label} th={th} />
      </Display>
      <div style={{ width: 900, height: 110, borderRadius: 24, border: `8px solid ${th.fg}`, padding: 10 }}>
        <div style={{ width: `${p}%`, height: "100%", borderRadius: 12, background: p >= 100 ? th.hi : th.fg }} />
      </div>
      <Display th={th} size={150}>{Math.round(p)}%</Display>
      {el.note && (
        <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 48, color: th.muted }}>
          <Rich text={el.note} th={th} />
        </div>
      )}
    </Center>
  );
};

const inr = (n: number) => Math.round(n).toLocaleString("en-IN");

const Num: React.FC<ElProps<"num">> = ({ el, th, dur }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [1, Math.max(4, dur * 0.7)], [el.from, el.to], { ...clamp, easing: Easing.out(Easing.cubic) });
  const text = `${el.prefix ?? ""}${inr(v)}${el.suffix ?? ""}`;
  return (
    <Center gap={20}>
      {el.label && <Kicker th={th} text={el.label} top={420} />}
      <Display th={th} size={fit([text], 280)} color={th.hi} style={{ background: th.hiBg, padding: th.hiBg ? "0 0.1em" : undefined }}>
        {text}
      </Display>
      {el.note && (
        <Display th={th} size={80}>
          <Rich text={el.note} th={th} />
        </Display>
      )}
    </Center>
  );
};

// A ticker chart that draws itself across the cut.
const Chart: React.FC<ElProps<"chart">> = ({ el, th, dur }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur - 4], [0, 1], clamp);
  const W = 900, H = 700;
  const min = Math.min(...el.pts), max = Math.max(...el.pts);
  const xy = el.pts.map((v, i) => [(i / (el.pts.length - 1)) * W, H - ((v - min) / (max - min || 1)) * H] as const);
  const n = Math.max(2, Math.ceil(p * el.pts.length));
  const shown = xy.slice(0, n);
  const last = el.pts[n - 1];
  const up = last >= el.pts[Math.max(0, n - 2)];
  const col = up ? th.hi : th.alert;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ display: "flex", gap: 30, alignItems: "baseline", fontFamily: "DejaVu Sans Mono, monospace", fontWeight: 700, color: th.fg }}>
        <span style={{ fontSize: 90 }}>{el.ticker}</span>
        <span style={{ fontSize: 90, color: col }}>
          {up ? "▲" : "▼"} {last}
        </span>
      </div>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {[0, 1, 2, 3].map((g) => (
          <line key={g} x1={0} x2={W} y1={(g * H) / 3} y2={(g * H) / 3} stroke={th.pat} strokeWidth={4} />
        ))}
        <polyline points={shown.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={col} strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={shown[shown.length - 1][0]} cy={shown[shown.length - 1][1]} r={26} fill={col} />
      </svg>
      {el.note && (
        <Display th={th} size={84}>
          <Rich text={el.note} th={th} />
        </Display>
      )}
    </AbsoluteFill>
  );
};

const Receipt: React.FC<ElProps<"receipt">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const n = el.lines.length + (el.total ? 1 : 0) + (el.stamp ? 1 : 0);
  const stampAt = part(beats, n - 1, n);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 820, background: "#FFFDF7", color: "#1B1B1B", padding: "50px 56px", fontFamily: "DejaVu Sans Mono, monospace", fontSize: 44, rotate: "-2deg", boxShadow: "0 30px 0 rgba(0,0,0,0.25)", position: "relative" }}>
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: 52, marginBottom: 26 }}>{el.title}</div>
        <div style={{ borderTop: "4px dashed #1B1B1B", marginBottom: 20 }} />
        {el.lines.map(([a, b], i) =>
          frame >= part(beats, i, n) ? (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span>{a}</span>
              <span>{b}</span>
            </div>
          ) : null,
        )}
        {el.total && frame >= part(beats, el.lines.length, n) && (
          <>
            <div style={{ borderTop: "4px dashed #1B1B1B", margin: "20px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 56 }}>
              <span>{el.total[0]}</span>
              <span>{el.total[1]}</span>
            </div>
          </>
        )}
        {el.stamp && frame >= stampAt && (
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              translate: "-50% -50%",
              rotate: "-14deg",
              border: `10px solid ${colors.red}`,
              color: colors.red,
              fontFamily: fonts.display,
              fontSize: 110,
              padding: "0 30px",
              scale: String(interpolate(frame, [stampAt, stampAt + 4], [2.4, 1], { ...clamp, easing: snap })),
              whiteSpace: "nowrap",
            }}
          >
            {el.stamp}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// 12 slots of the day around a clock face; slots flip state as the cut runs.
const Ring: React.FC<ElProps<"ring">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const R = 390;
  // The label sits inside the ring, so it fits the ring's inner width.
  const label = fit(el.label.split("\n"), 100, 40, 600);
  const colorOf = (c: string) => (c === "b" ? th.fg : c === "x" ? colors.red : c === "r" ? colors.lime : "transparent");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width={1040} height={1040} viewBox="-520 -520 1040 1040">
        {el.slots.split("").map((c, i) => {
          const at = part(beats, i, 12);
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const on = frame >= at;
          const s = on ? interpolate(frame, [at, at + 3], [1.5, 1], { ...clamp, easing: snap }) : 0;
          return (
            <circle key={i} cx={Math.cos(a) * R} cy={Math.sin(a) * R} r={52 * s} fill={colorOf(c)} stroke={th.fg} strokeWidth={c === "e" ? 8 : 0} strokeDasharray={c === "e" ? "14 12" : undefined} />
          );
        })}
      </svg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Display th={th} size={label}>
          <Rich text={el.label} th={th} />
        </Display>
        {el.sub && <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 38, color: th.muted }}>{el.sub}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Grid: React.FC<ElProps<"grid">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const cols = el.cols ?? 3;
  const bingoAt = el.bingo ? part(beats, el.marks.length, el.marks.length + 1) : Infinity;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Display th={th} size={90}>
        <Rich text={el.title} th={th} />
      </Display>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 290px)`, gap: 14 }}>
        {el.cells.map((c, i) => {
          const k = el.marks.indexOf(i);
          const at = k < 0 ? Infinity : part(beats, k, el.marks.length + (el.bingo ? 1 : 0));
          const marked = frame >= at;
          return (
            <div key={i} style={{ height: 250, borderRadius: 20, border: `6px solid ${th.fg}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16, fontFamily: fonts.body, fontWeight: 800, fontSize: 38, lineHeight: 1.15, color: marked ? colors.green : th.fg, background: marked ? colors.lime : "transparent", position: "relative" }}>
              {c}
              {marked && (
                <div style={{ position: "absolute", fontFamily: fonts.display, fontSize: 200, color: colors.red, opacity: 0.5, scale: String(interpolate(frame, [at, at + 3], [1.8, 1], { ...clamp, easing: snap })) }}>✕</div>
              )}
            </div>
          );
        })}
      </div>
      {frame >= bingoAt && (
        <In at={bingoAt} from={2}>
          <Display th={th} size={160} color={th.hi} style={{ background: th.hiBg, padding: "0 0.15em" }}>
            {el.bingo}
          </Display>
        </In>
      )}
    </AbsoluteFill>
  );
};

const tierColor: Record<string, string> = { S: "#FF4D3D", A: "#FF9F43", B: "#FFD84D", C: "#C6F432", D: "#8FA89B", F: "#5B6B63" };

const Tiers: React.FC<ElProps<"tiers">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 50px", gap: 16 }}>
      {el.rows.map((r, i) => {
        const at = part(beats, i, el.rows.length);
        const on = frame >= at;
        return (
          <div key={i} style={{ display: "flex", height: 210, borderRadius: 18, overflow: "hidden", border: `5px solid ${th.fg}` }}>
            <div style={{ width: 200, background: tierColor[r.tier] ?? colors.lime, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.display, fontSize: 120, color: colors.ink }}>{r.tier}</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 34px", background: "rgba(0,0,0,0.2)", fontFamily: fonts.body, fontWeight: 800, fontSize: 52, color: th.light ? colors.green : colors.cream }}>
              {on && (
                <In at={at} from={1.3} style={{ transformOrigin: "left" }}>
                  <Rich text={r.text} th={th} />
                </In>
              )}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const spinWords = ["Traffic", "Fever", "Wedding", "Rain", "Forgot", "Exam", "Guests", "Flat tyre", "Work", "Power cut"];

// Three slot-machine reels spin, then land one by one.
const Slots: React.FC<ElProps<"slots">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const lands = [part(beats, 1, 4), part(beats, 2, 4), part(beats, 3, 4)];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      {el.title && (
        <Display th={th} size={90}>
          <Rich text={el.title} th={th} />
        </Display>
      )}
      <div style={{ display: "flex", gap: 14, padding: 24, borderRadius: 40, background: colors.ink, border: `10px solid ${colors.lime}` }}>
        {el.land.map((w, i) => {
          const landed = frame >= lands[i];
          const word = landed ? w : spinWords[(Math.floor(frame / 2) + i * 3) % spinWords.length];
          return (
            <div key={i} style={{ width: 290, height: 300, borderRadius: 20, background: colors.cream, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: fonts.display, fontSize: 52, textTransform: "uppercase", textAlign: "center", color: landed ? colors.green : colors.muted, filter: landed ? undefined : "blur(3px)", translate: landed ? `0 ${interpolate(frame, [lands[i], lands[i] + 4], [-40, 0], clamp)}px` : `0 ${(frame * 37) % 60 - 30}px` }}>
              {word}
            </div>
          );
        })}
      </div>
      {el.win && frame >= lands[2] + 4 && (
        <In at={lands[2] + 4} from={1.4}>
          <Display th={th} size={fit([el.win], 110)}>
            <Rich text={el.win} th={th} />
          </Display>
        </In>
      )}
    </AbsoluteFill>
  );
};

const Weather: React.FC<ElProps<"weather">> = ({ el, th }) => (
  <Center gap={20}>
    {el.place && <Kicker th={th} text={el.place} top={280} />}
    <In from={1.6}>
      <div style={{ fontSize: 300, lineHeight: 1 }}>{el.icon}</div>
    </In>
    <Display th={th} size={fit([el.big], 260)}>
      <Rich text={el.big} th={th} />
    </Display>
    <Display th={th} size={fit([el.line], 90, 56)}>
      <Rich text={el.line} th={th} />
    </Display>
  </Center>
);

const Score: React.FC<ElProps<"score">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const mid = part(beats, 1, 2);
  const [l, r] = frame >= mid ? el.after : el.before;
  const flash = frame >= mid && frame < mid + 6;
  const box = (name: string, n: number, i: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: 440 }}>
      <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 44, color: th.fg, textTransform: "uppercase", textAlign: "center", height: 110 }}>{name}</div>
      <div style={{ width: 360, height: 360, borderRadius: 30, background: colors.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DejaVu Sans Mono, monospace", fontWeight: 700, fontSize: 260, color: i === 1 ? colors.lime : colors.red, outline: flash && el.after[i] !== el.before[i] ? `12px solid ${colors.lime}` : undefined }}>{n}</div>
    </div>
  );
  return (
    <Center gap={60}>
      <div style={{ fontFamily: "DejaVu Sans Mono, monospace", fontWeight: 700, fontSize: 70, color: th.fg, background: "rgba(0,0,0,0.25)", padding: "10px 40px", borderRadius: 16 }}>{el.clock}</div>
      <div style={{ display: "flex", gap: 40 }}>
        {box(el.left, l, 0)}
        {box(el.right, r, 1)}
      </div>
      {el.note && frame >= mid && (
        <In at={mid}>
          <Display th={th} size={84}>
            <Rich text={el.note} th={th} />
          </Display>
        </In>
      )}
    </Center>
  );
};

const Def: React.FC<ElProps<"def">> = ({ el, th, beats }) => {
  const at = part(beats, 1, 3);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 90px", gap: 24 }}>
      <In>
        <div style={{ fontFamily: fonts.display, fontSize: fit([el.word], 190), color: th.fg, lineHeight: 1 }}>{el.word}</div>
      </In>
      <div style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: 52, color: th.muted }}>
        {el.say} · <i>{el.pos}</i>
      </div>
      <In at={at} from={1.05}>
        <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: 64, lineHeight: 1.25, color: th.fg, borderLeft: `14px solid ${th.hiBg ?? th.hi}`, paddingLeft: 34 }}>
          <Rich text={el.text} th={th} />
        </div>
      </In>
    </AbsoluteFill>
  );
};

const Emoji: React.FC<ElProps<"emoji">> = ({ el, th, beats }) => (
  <Center gap={50}>
    <div style={{ display: "flex", gap: 30, justifyContent: "center", flexWrap: "wrap" }}>
      {el.chars.map((c, i) => (
        <In key={i} at={part(beats, i, el.chars.length)} from={2}>
          <div style={{ fontSize: el.chars.length > 3 ? 200 : 280, lineHeight: 1 }}>{c}</div>
        </In>
      ))}
    </div>
    {el.caption && (
      <Display th={th} size={fit([el.caption], 110)}>
        <Rich text={el.caption} th={th} />
      </Display>
    )}
  </Center>
);

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
};

// Speedrun timer with split labels that tick in.
const Timer: React.FC<ElProps<"timer">> = ({ el, th, dur, beats }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [0, dur - 3], [el.from, el.to], clamp);
  return (
    <Center gap={36}>
      <Kicker th={th} text={el.label} top={330} />
      <div style={{ fontFamily: "DejaVu Sans Mono, monospace", fontWeight: 700, fontSize: 170, color: th.hi, background: th.hiBg, padding: "0 20px", borderRadius: 12 }}>{fmt(v)}</div>
      {el.splits?.map((s, i) =>
        frame >= part(beats, i + 1, el.splits!.length + 1) ? (
          <div key={i} style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 54, color: th.fg }}>
            <Rich text={s} th={th} />
          </div>
        ) : null,
      )}
    </Center>
  );
};

const Choice: React.FC<ElProps<"choice">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const mid = part(beats, 1, 2);
  const decided = frame >= mid;
  const card = (text: string, key: "a" | "b") => {
    const win = decided && el.pick === key;
    const lose = decided && el.pick !== key;
    return (
      <div style={{ width: 900, height: 420, borderRadius: 36, background: win ? colors.lime : lose ? "rgba(7,20,15,0.7)" : colors.cream, color: win ? colors.green : lose ? "rgba(244,239,227,0.75)" : colors.green, textDecoration: lose ? "line-through" : undefined, textDecorationThickness: 8, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40, fontFamily: fonts.display, fontSize: fit([text], 96, 54), textTransform: "uppercase", position: "relative", scale: win ? String(interpolate(frame, [mid, mid + 4], [1.08, 1], clamp)) : "1" }}>
        {text}
        {decided && <div style={{ position: "absolute", right: 30, top: 10, fontSize: 120, color: win ? colors.green : colors.red }}>{win ? "✓" : "✕"}</div>}
      </div>
    );
  };
  return (
    <Center gap={30}>
      {el.q && (
        <Display th={th} size={70}>
          <Rich text={el.q} th={th} />
        </Display>
      )}
      {card(el.a, "a")}
      <div style={{ fontFamily: fonts.display, fontSize: 70, color: th.fg }}>OR</div>
      {card(el.b, "b")}
    </Center>
  );
};

const Quiz: React.FC<ElProps<"quiz">> = ({ el, th, beats }) => {
  const frame = useCurrentFrame();
  const mid = part(beats, 1, 2);
  const shown = frame >= mid;
  const size = fit([el.answer, el.blank], 180);
  return (
    <Center gap={26}>
      <Display th={th} size={84}>
        <Rich text={el.before} th={th} />
      </Display>
      {shown ? (
        <In at={mid} from={1.6}>
          <Display th={th} size={size} color={th.hi} style={{ background: th.hiBg, padding: "0 0.15em" }}>
            {el.answer}
          </Display>
        </In>
      ) : (
        <Display th={th} size={size}>
          {el.blank}
        </Display>
      )}
      {el.after && (
        <Display th={th} size={84}>
          <Rich text={el.after} th={th} />
        </Display>
      )}
    </Center>
  );
};

export const elements: { [K in El["t"]]: React.FC<ElProps<K>> } = {
  word: Word,
  swap: Swap,
  stack: Stack,
  chat: Chat,
  bar: Bar,
  num: Num,
  chart: Chart,
  receipt: Receipt,
  ring: Ring,
  grid: Grid,
  tiers: Tiers,
  slots: Slots,
  weather: Weather,
  score: Score,
  def: Def,
  emoji: Emoji,
  timer: Timer,
  choice: Choice,
  quiz: Quiz,
};
