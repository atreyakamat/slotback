import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { colors, fonts } from "../theme";
import { Grain } from "../components/effects";
import { GlassBackdrop, PoolEndCard, glass } from "../pool/glass";
import { movieReels, MovieScene } from "./reels";

// Stock-footage reels with a famous movie line as on-screen text. Clips are
// Pexels (see content/reels/stock/CREDITS.md), copied to public/stock/ before rendering.
export const END_CARD = 54;
const BAR = 150;

export type MovieReelProps = { reelId: string; withSong?: boolean };

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = (frame: number, at: number, len = 8) =>
  interpolate(frame, [at, at + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// *word* renders lime.
const Marked: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*[^*]+\*)/).map((p, i) =>
      p.startsWith("*") ? (
        <span key={i} style={{ color: colors.lime }}>
          {p.slice(1, -1)}
        </span>
      ) : (
        <React.Fragment key={i}>{p}</React.Fragment>
      ),
    )}
  </>
);

const Clip: React.FC<{ s: MovieScene; dur: number }> = ({ s, dur }) => {
  const frame = useCurrentFrame();
  const t = frame / dur;
  const [a, b] = s.zoom === "out" ? [1.2, 1.08] : [1.06, 1.18];
  const scale = a + (b - a) * t;
  const drift = (s.pan ?? 0) * (t - 0.5) * 60;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(`stock/${s.clip}.mp4`)}
        muted
        trimBefore={Math.round((s.from ?? 0) * 30)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${s.focus ?? 50}% 50%`,
          scale: String(scale),
          translate: `${drift}px 0`,
          filter: s.mood === "cold" ? "saturate(0.55) contrast(1.15) brightness(0.85)" : "saturate(1.12) contrast(1.08)",
        }}
      />
      {/* Teal-and-orange grade plus vignette so mixed stock reads as one film. */}
      <AbsoluteFill style={{ background: s.mood === "cold" ? "linear-gradient(180deg, rgba(10,40,60,0.35), rgba(5,20,30,0.45))" : "linear-gradient(180deg, rgba(15,46,34,0.25), rgba(255,140,60,0.10))", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

// Movie-subtitle style: speaker label, words appear in order.
const Subtitle: React.FC<{ who?: string; text: string; dur: number }> = ({ who, text, dur }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const per = Math.max(2, Math.min(5, Math.floor((dur * 0.55) / words.length)));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: BAR + 70, paddingLeft: 70, paddingRight: 70 }}>
      {who && (
        <div style={{ opacity: inOut(frame, 0, 6), fontFamily: fonts.body, fontWeight: 800, fontSize: 30, letterSpacing: "0.18em", color: colors.lime, textTransform: "uppercase", marginBottom: 14 }}>{who}</div>
      )}
      <div style={{ textAlign: "center", fontFamily: fonts.body, fontWeight: 700, fontSize: 60, lineHeight: 1.18, color: colors.cream, textShadow: "0 3px 0 #000, 0 0 24px rgba(0,0,0,0.9)", textWrap: "balance" }}>
        {words.map((w, i) => {
          const o = inOut(frame, 3 + i * per, 5);
          return (
            <span key={i} style={{ opacity: o, display: "inline-block", translate: `0 ${(1 - o) * 18}px`, marginRight: "0.26em" }}>
              <Marked text={w} />
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// The movie line itself: big, centred, slammed in.
const BigLine: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const lines = text.split("\n");
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 64px", background: "rgba(0,0,0,0.35)" }}>
      {lines.map((l, i) => {
        const at = Math.round((i * dur * 0.45) / Math.max(lines.length, 1));
        const o = inOut(frame, at, 7);
        return (
          <div key={i} style={{ opacity: o, scale: String(1.5 - 0.5 * o), fontFamily: fonts.display, fontSize: l.length > 16 ? 92 : 124, lineHeight: 1.02, textAlign: "center", color: colors.cream, textTransform: "uppercase", textShadow: "0 8px 40px rgba(0,0,0,0.8)", letterSpacing: "-0.01em" }}>
            <Marked text={l} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Notif: React.FC<{ from: string; text: string }> = ({ from, text }) => {
  const frame = useCurrentFrame();
  const o = inOut(frame, 4, 9);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: BAR + 110 }}>
      <div style={{ ...glass, background: "rgba(245,239,225,0.92)", color: colors.ink, width: 900, borderRadius: 40, padding: "30px 36px", display: "flex", gap: 26, alignItems: "center", translate: `0 ${(1 - o) * -220}px`, opacity: o }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, background: colors.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>💬</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 32 }}>
            {from} <span style={{ fontWeight: 500, opacity: 0.55 }}>· now</span>
          </div>
          <div style={{ fontFamily: fonts.body, fontWeight: 500, fontSize: 38, lineHeight: 1.2 }}>{text}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const at = Math.round(dur * 0.3);
  const o = inOut(frame, at, 8);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ opacity: o, scale: String(0.6 + 0.4 * o), rotate: `${(1 - o) * -8}deg`, background: colors.lime, color: colors.ink, fontFamily: fonts.display, fontSize: 70, padding: "22px 44px", borderRadius: 999, boxShadow: "0 20px 80px rgba(198,244,50,0.5)", textTransform: "uppercase" }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Letterbox: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const h = BAR * inOut(frame, 0, 10) * (1 - inOut(frame, total - 6, 6));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: "#000" }} />
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ text: string; total: number }> = ({ text, total }) => {
  const frame = useCurrentFrame();
  const o = inOut(frame, 6, 10) * (1 - inOut(frame, total - 6, 6));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: BAR / 2 - 26, left: 0, right: 0, textAlign: "center", opacity: o, fontFamily: fonts.body, fontWeight: 700, fontSize: 30, letterSpacing: "0.2em", color: "rgba(245,239,225,0.85)", textTransform: "uppercase" }}>
        🎬 {text}
      </div>
    </AbsoluteFill>
  );
};

// Every cut gets a quick punch-in so hard cuts feel deliberate, not jumpy.
const Cut: React.FC<{ children: React.ReactNode; first: boolean }> = ({ children, first }) => {
  const frame = useCurrentFrame();
  const o = first ? 1 : inOut(frame, 0, 6);
  return <AbsoluteFill style={{ scale: String(1.08 - 0.08 * o), filter: first ? undefined : `blur(${(1 - o) * 14}px)` }}>{children}</AbsoluteFill>;
};

const CutFlash: React.FC<{ at: number[] }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => (frame >= a && frame < a + 4 ? 0.5 * (1 - (frame - a) / 4) : 0)));
  return <AbsoluteFill style={{ background: "#fff", opacity: o, pointerEvents: "none" }} />;
};

export const movieTimeline = (reelId: string) => {
  const reel = movieReels.find((r) => r.id === reelId);
  if (!reel) throw new Error(`Unknown movie reel ${reelId}`);
  const beat = (60 / reel.song.bpm) * 30;
  let f = 0;
  const placed = reel.scenes.map((s) => {
    const end = Math.max(Math.round(f + beat), Math.round(Math.round((f + s.sec * 30) / beat) * beat));
    const p = { s, from: f, dur: end - f };
    f += p.dur;
    return p;
  });
  // Start the song so its drop lands on the cut into `dropScene`.
  const songStart = Math.max(0, reel.song.drop - (placed[reel.song.dropScene]?.from ?? 0) / 30);
  return { reel, placed, songStart, endFrom: f, total: f + END_CARD };
};

export const movieDuration = (reelId: string) => movieTimeline(reelId).total;

export const MovieReelVideo: React.FC<MovieReelProps> = ({ reelId, withSong = true }) => {
  const { reel, placed, songStart, endFrom, total } = movieTimeline(reelId);
  const cuts = placed.slice(1).map((p) => p.from);
  const sfx: [number, string, number][] = [
    ...cuts.map((c): [number, string, number] => [Math.max(0, c - 4), "whoosh", 0.45]),
    ...placed.filter((p) => p.s.big).map((p): [number, string, number] => [p.from + 1, "impact", 0.7]),
    ...placed.filter((p) => p.s.notif).map((p): [number, string, number] => [p.from + 5, "buzz", 0.7]),
    ...placed.filter((p) => p.s.chip).map((p): [number, string, number] => [p.from + Math.round(p.dur * 0.3), "success", 0.8]),
    [Math.max(0, endFrom - 4), "whoosh", 0.5],
    [endFrom + 4, "pop", 0.8],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {placed.map((p, i) => (
        <Sequence key={i} from={p.from} durationInFrames={p.dur} name={`${i}. ${p.s.clip}`}>
          <Cut first={i === 0}>
            <Clip s={p.s} dur={p.dur} />
          </Cut>
          {p.s.notif && <Notif from={p.s.notif[0]} text={p.s.notif[1]} />}
          {p.s.big && <BigLine text={p.s.big} dur={p.dur} />}
          {p.s.chip && <Chip text={p.s.chip} dur={p.dur} />}
          {p.s.sub && <Subtitle who={p.s.sub[0] || undefined} text={p.s.sub[1]} dur={p.dur} />}
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={endFrom}>
        <Letterbox total={endFrom} />
        <Tag text={reel.tag} total={endFrom} />
      </Sequence>
      <Sequence from={endFrom} name="end card">
        <GlassBackdrop seed={reel.id} />
        <Cut first={false}>
          <PoolEndCard cta={reel.cta} />
        </Cut>
      </Sequence>
      <CutFlash at={[...cuts, endFrom]} />
      <Grain />
      {sfx.map(([frame, name, volume], i) => (
        <Sequence key={`sfx-${i}`} from={frame} layout="none">
          <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume * 0.7} />
        </Sequence>
      ))}
      {withSong && (
        <Audio
          src={staticFile(reel.song.file)}
          trimBefore={Math.round(songStart * 30)}
          volume={(f) => 0.75 * interpolate(f, [total - 20, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
      <ProgressLine total={total} />
    </AbsoluteFill>
  );
};

const ProgressLine: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${(frame / total) * 100}%`, background: colors.lime }} />;
};
