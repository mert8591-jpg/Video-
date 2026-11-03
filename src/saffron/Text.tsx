import { loadFont } from "@remotion/google-fonts/Montserrat";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HOOK, NEEDS, NEEDS_END, OUTRO_CTA, OUTRO_Q, SAF_COLORS } from "../storyboard";

export const { fontFamily } = loadFont("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });

const stroke = "0 4px 18px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.6)";

const useRise = (startSec: number, delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - (startSec + delay) * fps, fps, config: { damping: 18, stiffness: 120, mass: 0.8 } });
};

/** 0–5 sn kanca başlığı */
export const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [(HOOK.end - 0.4) * fps, HOOK.end * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sizes = [92, 112, 128];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, opacity: out }}>
      {HOOK.lines.map((line, i) => (
        <HookLine key={line} line={line} i={i} size={sizes[i]} />
      ))}
    </AbsoluteFill>
  );
};

const HookLine: React.FC<{ line: string; i: number; size: number }> = ({ line, i, size }) => {
  const p = useRise(HOOK.start, i * 0.28);
  const isLast = i === HOOK.lines.length - 1;
  return (
    <div
      style={{
        fontFamily,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: 1,
        color: SAF_COLORS.white,
        textShadow: stroke,
        opacity: p,
        transform: `translateY(${(1 - p) * 70}px) scale(${0.92 + 0.08 * p})`,
        marginTop: isLast ? 22 : 4,
        ...(isLast
          ? {
              backgroundColor: SAF_COLORS.saffron,
              padding: "6px 30px 10px",
              borderRadius: 14,
              textShadow: "0 3px 10px rgba(0,0,0,0.35)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
            }
          : {}),
      }}
    >
      {line}
    </div>
  );
};

/** Üretim gereksinimleri etiketleri */
export const NeedsChips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [(NEEDS_END - 0.45) * fps, NEEDS_END * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ paddingTop: 270, paddingLeft: 70, opacity: out, gap: 22 }}>
      {NEEDS.map((n) => (
        <Chip key={n.label} label={n.label} t={n.t} />
      ))}
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ label: string; t: number }> = ({ label, t }) => {
  const p = useRise(t);
  return (
    <div
      style={{
        alignSelf: "flex-start",
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontFamily,
        fontWeight: 800,
        fontSize: 50,
        color: SAF_COLORS.white,
        backgroundColor: "rgba(14,10,18,0.62)",
        border: `3px solid ${SAF_COLORS.gold}`,
        borderRadius: 999,
        padding: "12px 34px 12px 20px",
        opacity: p,
        transform: `translateX(${(1 - p) * -120}px)`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 999,
          backgroundColor: SAF_COLORS.saffron,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          transform: `scale(${p})`,
        }}
      >
        ✓
      </div>
      {label}
    </div>
  );
};

/** Final: soru + çağrı */
export const Outro: React.FC = () => {
  const q = useRise(OUTRO_Q.start);
  const c = useRise(OUTRO_CTA.start);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: 118,
          lineHeight: 1.05,
          textAlign: "center",
          color: SAF_COLORS.white,
          textShadow: stroke,
          opacity: q,
          transform: `translateY(${(1 - q) * 60}px) scale(${0.9 + 0.1 * q})`,
          padding: "0 60px",
          whiteSpace: "pre-line",
        }}
      >
        {OUTRO_Q.text}
      </div>
      <div
        style={{
          marginTop: 46,
          fontFamily,
          fontWeight: 900,
          fontSize: 58,
          color: SAF_COLORS.white,
          backgroundColor: SAF_COLORS.saffron,
          padding: "16px 38px 20px",
          borderRadius: 18,
          opacity: c,
          transform: `translateY(${(1 - c) * 50}px) scale(${0.85 + 0.15 * c})`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        }}
      >
        {OUTRO_CTA.text}
      </div>
    </AbsoluteFill>
  );
};
