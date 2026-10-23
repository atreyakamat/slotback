import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fonts } from "../theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const Phone: React.FC<{
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ width = 600, height = 1000, style, children }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 72,
      background: "#0B0F0D",
      border: "10px solid #26302B",
      boxShadow: "0 40px 120px rgba(0,0,0,0.55), inset 0 0 0 2px #3A4640",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 22,
        left: "50%",
        translate: "-50% 0px",
        width: 150,
        height: 38,
        borderRadius: 20,
        background: "#000",
        zIndex: 5,
      }}
    />
    <div style={{ position: "absolute", inset: 0, padding: "92px 32px 32px" }}>{children}</div>
  </div>
);

export const Avatar: React.FC<{
  letter: string;
  size?: number;
  bg?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({ letter, size = 84, bg = colors.lime, color = colors.green, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: bg,
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fonts.display,
      fontSize: size * 0.46,
      flexShrink: 0,
      ...style,
    }}
  >
    {letter}
  </div>
);

// Expanding ring used for taps.
export const TapRipple: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -6 || t > 18) return null;
  const finger = interpolate(t, [-6, 0, 6], [0, 1, 0], clamp);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 45,
          top: y - 45,
          width: 90,
          height: 90,
          borderRadius: 45,
          background: "rgba(255,255,255,0.85)",
          opacity: finger,
          scale: String(interpolate(t, [-6, 0], [1.4, 0.9], clamp)),
          zIndex: 20,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 60,
          top: y - 60,
          width: 120,
          height: 120,
          borderRadius: 60,
          border: `6px solid ${colors.lime}`,
          opacity: interpolate(t, [0, 18], [1, 0], clamp),
          scale: String(interpolate(t, [0, 18], [0.4, 2.4], { ...clamp, easing: Easing.out(Easing.cubic) })),
          zIndex: 20,
        }}
      />
    </>
  );
};

export const Logo: React.FC<{ size?: number; tagline?: boolean }> = ({ size = 150, tagline }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.25 }}>
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.18 }}>
      {/* Logo concept B (content/brand/slotback-logo.svg): calendar inside a return arrow. */}
      <svg width={size * 0.95} height={size * 0.95} viewBox="120 120 840 840">
        <path d="M668.3 187.6 A375 375 0 1 1 232.8 324.9" fill="none" stroke={colors.lime} strokeWidth="62" strokeLinecap="round" />
        <path d="M277.3 261.4 L174.4 284.0 L291.2 365.8 Z" fill={colors.lime} stroke={colors.lime} strokeWidth="16" strokeLinejoin="round" />
        <rect x="375" y="415" width="330" height="290" rx="52.8" fill="none" stroke={colors.cream} strokeWidth="48" />
        <line x1="375" y1="502" x2="705" y2="502" stroke={colors.cream} strokeWidth="48" />
        <line x1="474" y1="362.2" x2="474" y2="443.8" stroke={colors.cream} strokeWidth="48" strokeLinecap="round" />
        <line x1="606" y1="362.2" x2="606" y2="443.8" stroke={colors.cream} strokeWidth="48" strokeLinecap="round" />
        <path d="M470.7 600.6 L520.2 644.1 L615.9 560" fill="none" stroke={colors.lime} strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontFamily: fonts.display, fontSize: size * 0.72, letterSpacing: "-0.03em", lineHeight: 1 }}>
        <span style={{ color: colors.cream }}>Slot</span>
        <span style={{ color: colors.lime }}>Back</span>
      </div>
    </div>
    {tagline && (
      <div style={{ fontFamily: fonts.body, fontWeight: 700, fontSize: size * 0.3, color: colors.muted }}>
        Fill every cancelled slot.
      </div>
    )}
  </div>
);

export const SalonChair: React.FC<{ size?: number; client?: number }> = ({ size = 520, client = 0 }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 200 230">
    {/* client silhouette fades in when the slot is filled */}
    <g opacity={client}>
      <circle cx="100" cy="38" r="22" fill={colors.cream} />
      <path d="M66 120 Q66 70 100 66 Q134 70 134 120 Z" fill={colors.cream} />
    </g>
    <rect x="58" y="20" width="84" height="104" rx="22" fill={colors.greenLight} stroke={colors.lime} strokeWidth="4" opacity={1 - client * 0.6} />
    <rect x="40" y="112" width="120" height="34" rx="14" fill={colors.greenLight} stroke={colors.lime} strokeWidth="4" />
    <rect x="28" y="96" width="24" height="44" rx="10" fill={colors.green} stroke={colors.lime} strokeWidth="4" />
    <rect x="148" y="96" width="24" height="44" rx="10" fill={colors.green} stroke={colors.lime} strokeWidth="4" />
    <rect x="94" y="146" width="12" height="48" fill={colors.lime} />
    <ellipse cx="100" cy="206" rx="62" ry="12" fill={colors.lime} />
  </svg>
);

export const Clock: React.FC<{ size?: number; speed?: number }> = ({ size = 180, speed = 24 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="44" fill={colors.cream} stroke={colors.lime} strokeWidth="6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="12"
          x2="50"
          y2={i % 3 === 0 ? 20 : 16}
          stroke={colors.green}
          strokeWidth="3"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <line x1="50" y1="50" x2="50" y2="28" stroke={colors.green} strokeWidth="5" strokeLinecap="round" transform={`rotate(${frame * (speed / 12)} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="18" stroke={colors.red} strokeWidth="3" strokeLinecap="round" transform={`rotate(${frame * speed} 50 50)`} />
      <circle cx="50" cy="50" r="4" fill={colors.green} />
    </svg>
  );
};
