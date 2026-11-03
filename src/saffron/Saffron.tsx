import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FACTS, HOOK, MUSIC_VOLUME, NEEDS, NEEDS_END, OUTRO_Q, SAF_DURATION, SHOTS, VO_OFFSET, XFADE } from "../storyboard";
import { KenBurns } from "./KenBurns";
import { Subtitles } from "./Subtitles";
import { FactCard, HookTitle, NeedsChips, Outro } from "./Text";

const ShotLayer: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = SHOTS[i];
  const pre = i === 0 ? 0 : XFADE / 2;
  const post = i === SHOTS.length - 1 ? 0 : XFADE / 2;
  const len = Math.round((shot.end - shot.start + pre + post) * fps);
  const fadeF = XFADE * fps;
  const opacity =
    i === 0
      ? 1
      : interpolate(frame, [0, fadeF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity }}>
      <KenBurns img={shot.img} from={shot.from} to={shot.to} durationInFrames={len} />
    </AbsoluteFill>
  );
};

/** Havada süzülen ince altın toz parçacıkları (hafif derinlik / paralaks hissi) */
const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(26).fill(0).map((_, i) => {
        const depth = 0.4 + random(`d${i}`) * 0.9;
        const x = (random(`x${i}`) * 1180 - 50 + Math.sin(t * 0.4 + i) * 30 * depth) % 1180;
        const y = (((random(`y${i}`) * 2100 - t * 28 * depth) % 2100) + 2100) % 2100 - 90;
        const size = 3 + depth * 6;
        const tw = 0.35 + 0.35 * Math.sin(t * 1.3 + i * 1.7);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: 99,
              background: "radial-gradient(circle, rgba(255,215,140,0.95), rgba(255,170,60,0))",
              opacity: tw * depth * 0.8,
              filter: `blur(${(1.3 - depth) * 2}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Hafif film greni: büyütülmüş görsellerdeki "fazla pürüzsüz" görünümü doğal kılar */
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = Math.floor(random(`gx${frame}`) * 400);
  const dy = Math.floor(random(`gy${frame}`) * 400);
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 0.07, mixBlendMode: "overlay" }}>
      <Img
        src={staticFile("saffron/grain.png")}
        style={{ position: "absolute", left: -dx, top: -dy, width: 1480, height: 2320, imageRendering: "pixelated" }}
      />
    </AbsoluteFill>
  );
};

export const Saffron: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / fps;
  // Üstte metin varken üst gradyanı koyulaştır (okunabilirlik)
  const topDark =
    (t > FACTS[0].start - 0.3 && t < FACTS[1].end) ||
    t < HOOK.end || t > OUTRO_Q.start - 0.3 || (t > NEEDS[0].t - 0.3 && t < NEEDS_END)
      ? 1
      : 0.35;
  const fadeOut = interpolate(frame, [SAF_DURATION - 12, SAF_DURATION - 1], [1, 0.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        {SHOTS.map((s, i) => {
          const pre = i === 0 ? 0 : XFADE / 2;
          const post = i === SHOTS.length - 1 ? 0 : XFADE / 2;
          const from = Math.round((s.start - pre) * fps);
          const dur = Math.round((s.end + post) * fps) - from;
          return (
            <Sequence key={i} from={from} durationInFrames={dur} premountFor={30}>
              <ShotLayer i={i} />
            </Sequence>
          );
        })}
        <Dust />
        <Grain />
        {/* Sinematik vinyet + metin okunabilirliği için gradyanlar */}
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        <AbsoluteFill
          style={{
            opacity: interpolate(topDark, [0, 1], [0.35, 1]),
            background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 42%)",
          }}
        />
        <AbsoluteFill
          style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.0) 18%, rgba(0,0,0,0.45) 34%, rgba(0,0,0,0) 50%)" }}
        />
        <Sequence durationInFrames={Math.round(HOOK.end * fps)}>
          <HookTitle />
        </Sequence>
        {FACTS.map((f) => (
          <FactCard key={f.big} {...f} />
        ))}
        <NeedsChips />
        <Outro />
        <Subtitles />
      </AbsoluteFill>
      <Sequence from={Math.round(VO_OFFSET * fps)}>
        <Audio src={staticFile("saffron/narration.wav")} volume={1} />
      </Sequence>
      <Audio
        src={staticFile("saffron/music.wav")}
        volume={(f) =>
          MUSIC_VOLUME *
          interpolate(f, [0, 20, SAF_DURATION - 30, SAF_DURATION], [0.6, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
