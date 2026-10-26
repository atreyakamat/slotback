import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";
import { EnvKind, ThemeId } from "./types";

export type Theme = {
  bg: string;
  pat: string; // pattern colour, a step away from bg
  fg: string;
  hi: string; // *highlight* text colour
  hiBg?: string; // highlight block behind *text* on light themes
  alert: string; // ~alert~ text colour
  muted: string;
  light: boolean;
};

export const themes: Record<ThemeId, Theme> = {
  lime: { bg: colors.lime, pat: "#B2DE22", fg: colors.green, hi: colors.cream, hiBg: colors.green, alert: colors.red, muted: "#4E6B12", light: true },
  ink: { bg: colors.ink, pat: "#12271E", fg: colors.cream, hi: colors.lime, alert: colors.red, muted: colors.muted, light: false },
  cream: { bg: colors.cream, pat: "#E7DCC2", fg: colors.green, hi: colors.green, hiBg: colors.lime, alert: colors.red, muted: "#8C8370", light: true },
  red: { bg: colors.red, pat: "#E8392A", fg: colors.cream, hi: colors.ink, hiBg: colors.cream, alert: colors.ink, muted: "#FFD2CB", light: false },
  green: { bg: colors.green, pat: colors.greenLight, fg: colors.cream, hi: colors.lime, alert: colors.red, muted: colors.muted, light: false },
  black: { bg: "#000000", pat: "#161616", fg: colors.lime, hi: colors.cream, alert: colors.red, muted: "#6E7A70", light: false },
};

// Default cycle; red is kept rare so it still means "problem".
export const themeCycle: ThemeId[] = ["lime", "ink", "cream", "green", "black", "lime", "cream", "ink", "red", "green"];
export const envCycle: EnvKind[] = ["solid", "stripes", "dots", "burst", "grid", "split", "checker", "rings", "scan", "type", "solid", "solid"];

// Markup inside a line: *highlight*, ~alert~, _muted_.
export const Rich: React.FC<{ text: string; th: Theme }> = ({ text, th }) => (
  <>
    {text.split(/(\*[^*]+\*|~[^~]+~|_[^_]+_)/g).map((part, i) => {
      if (part.startsWith("*"))
        return (
          <span key={i} style={{ color: th.hi, background: th.hiBg, padding: th.hiBg ? "0 0.12em" : undefined, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
            {part.slice(1, -1)}
          </span>
        );
      if (part.startsWith("~")) return <span key={i} style={{ color: th.alert }}>{part.slice(1, -1)}</span>;
      if (part.startsWith("_")) return <span key={i} style={{ color: th.muted }}>{part.slice(1, -1)}</span>;
      return <React.Fragment key={i}>{part}</React.Fragment>;
    })}
  </>
);

// The background world for one cut. Patterns drift slowly so a held cut
// still moves, without any pulsing.
export const Env: React.FC<{ kind: EnvKind; th: Theme; seed: number }> = ({ kind, th, seed }) => {
  const frame = useCurrentFrame();
  const drift = frame * 3;
  const angle = [35, -35, 60, -60, 15][seed % 5];
  let backgroundImage: string | undefined;
  let backgroundSize: string | undefined;
  let backgroundPosition: string | undefined;
  switch (kind) {
    case "stripes":
      backgroundImage = `repeating-linear-gradient(${angle}deg, ${th.pat} 0 60px, transparent 60px 120px)`;
      backgroundPosition = `${drift}px 0`;
      break;
    case "dots":
      backgroundImage = `radial-gradient(${th.pat} 14px, transparent 15px)`;
      backgroundSize = "70px 70px";
      backgroundPosition = `${drift}px ${drift}px`;
      break;
    case "burst":
      backgroundImage = `repeating-conic-gradient(from ${frame * 1.5}deg at 50% 50%, ${th.pat} 0deg 10deg, transparent 10deg 20deg)`;
      break;
    case "grid":
      backgroundImage = `linear-gradient(${th.pat} 4px, transparent 4px), linear-gradient(90deg, ${th.pat} 4px, transparent 4px)`;
      backgroundSize = "120px 120px";
      backgroundPosition = `0 ${drift}px`;
      break;
    case "split":
      backgroundImage = `linear-gradient(${angle + 90}deg, ${th.pat} 50%, transparent 50%)`;
      break;
    case "checker":
      backgroundImage = `conic-gradient(${th.pat} 25%, transparent 0 50%, ${th.pat} 0 75%, transparent 0)`;
      backgroundSize = "180px 180px";
      backgroundPosition = `${drift}px 0`;
      break;
    case "rings":
      backgroundImage = `repeating-radial-gradient(circle at 50% 50%, ${th.pat} 0 40px, transparent 40px 80px)`;
      break;
    case "scan":
      backgroundImage = `repeating-linear-gradient(0deg, ${th.pat} 0 6px, transparent 6px 22px)`;
      backgroundPosition = `0 ${drift}px`;
      break;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: th.bg, backgroundImage, backgroundSize, backgroundPosition }}>
      {kind === "type" && <TypeWall th={th} frame={frame} />}
    </AbsoluteFill>
  );
};

// A wall of giant outlined "SLOTBACK" rows sliding in opposite directions.
const TypeWall: React.FC<{ th: Theme; frame: number }> = ({ th, frame }) => (
  <AbsoluteFill style={{ overflow: "hidden", justifyContent: "center", gap: 10, rotate: "-8deg", scale: "1.3" }}>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        style={{
          whiteSpace: "nowrap",
          fontFamily: fonts.display,
          fontSize: 230,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `4px ${th.pat}`,
          translate: `${interpolate(frame, [0, 60], [0, i % 2 ? 300 : -300]) - 400}px 0`,
        }}
      >
        SLOTBACK SLOTBACK SLOTBACK
      </div>
    ))}
  </AbsoluteFill>
);
