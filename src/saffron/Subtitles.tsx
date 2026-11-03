import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { SAF_COLORS, VO_LINES, vo } from "../storyboard";
import { fontFamily } from "./Text";

type Word = { text: string; start: number; end: number };
type Chunk = { words: Word[]; start: number; end: number };

// Türkçede hece sayısı = ünlü sayısı; kelime sürelerini buna göre paylaştırırız.
const syllables = (w: string) => Math.max(1, (w.match(/[aeıioöuüâîûAEIİOÖUÜ]/g) ?? []).length);

const MAX_CHARS = 20;

const buildChunks = (): Chunk[] => {
  const chunks: Chunk[] = [];
  for (const line of VO_LINES) {
    if (line.showSub === false) continue;
    const start = vo(line.t0);
    const end = vo(line.t1);
    const raw = line.text.split(" ");
    const weights = raw.map((w) => syllables(w) + (/[,.?!]$/.test(w) ? 0.6 : 0) + 0.3);
    const total = weights.reduce((a, b) => a + b, 0);
    let t = start;
    const words: Word[] = raw.map((w, i) => {
      const d = ((end - start) * weights[i]) / total;
      const word = { text: w, start: t, end: t + d };
      t += d;
      return word;
    });
    // Kelimeleri en fazla ~20 karakterlik satırlara grupla; noktalama sonrası yeni grup
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    };
    for (const w of words) {
      const len = cur.map((c) => c.text).join(" ").length;
      if (cur.length && len + 1 + w.text.length > MAX_CHARS) flush();
      cur.push(w);
      if (/[,.?!]$/.test(w.text)) flush();
    }
    flush();
  }
  // Kısa parçaları biraz uzat (sonraki parçanın başlangıcına kadar, en fazla 0.5 sn) -> titreme yok
  return chunks.map((c, i) => {
    const next = chunks[i + 1]?.start ?? c.end + 0.5;
    return { ...c, end: Math.min(next, c.end + 0.5) };
  });
};

const CHUNKS = buildChunks();

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunk = CHUNKS.find((c) => t >= c.start && t < c.end);
  if (!chunk) return null;
  const local = (t - chunk.start) * fps;
  const pop = Math.min(1, local / 4);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1300 }}>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.1,
          textAlign: "center",
          padding: "0 70px",
          transform: `scale(${0.94 + 0.06 * pop})`,
          opacity: 0.4 + 0.6 * pop,
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.start;
          return (
            <span
              key={i}
              style={{
                color: active ? SAF_COLORS.white : "rgba(255,255,255,0.72)",
                WebkitTextStroke: "10px rgba(10,6,12,0.92)",
                paintOrder: "stroke fill",
                textShadow: "0 6px 20px rgba(0,0,0,0.55)",
                ...(active && t < w.end + 0.15 ? { color: SAF_COLORS.gold } : {}),
              }}
            >
              {w.text.toLocaleUpperCase("tr-TR")}
              {i < chunk.words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
