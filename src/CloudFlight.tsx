import { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import {
  BOLT_CORE,
  BOLT_GLOW,
  FOCAL,
  FOG_FAR,
  FOG_GLOW_AQUA,
  FOG_GLOW_PINK,
  FOG_HAZE,
  STRIKES,
  THUNDER_DELAY,
  TUNNEL_LENGTH,
} from "./storyboard";
import { getSprites, SPRITE_LIGHT_ANGLE, SPRITE_SIZE } from "./clouds/sprites";
import { BOLTS, makePuffs, puffState, strikeIntensity, strikePosition } from "./clouds/scene";

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type DrawItem = { z: number; draw: () => void };

export const CloudFlight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const puffs = useMemo(makePuffs, []);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const sprites = getSprites();
    const t = frame / fps;
    const cx = width / 2;
    const cy = height / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    // Derinlik sisi (gökyüzü değil; uzaktaki bulut yoğunluğu)
    ctx.fillStyle = FOG_FAR;
    ctx.fillRect(0, 0, width, height);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, height * 0.7);
    bg.addColorStop(0, FOG_GLOW_PINK);
    bg.addColorStop(0.35, FOG_GLOW_AQUA + "aa");
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const flashes = STRIKES.map((s, i) => ({ s, i, I: strikeIntensity(s, t), pos: strikePosition(s, t) }));
    const active = flashes.filter((f) => f.I > 0.01 && f.pos.z > 1);

    const items: DrawItem[] = [];
    const bolts: DrawItem[] = [];

    for (const p of puffs) {
      const st = puffState(p, t);
      const z = st.z;
      const sx = cx + (FOCAL * st.x) / z;
      const sy = cy + (FOCAL * st.y) / z;
      const size = (FOCAL * p.size) / z;
      if (sx + size < 0 || sx - size > width || sy + size < 0 || sy - size > height) continue;
      // Uzakta sisle karış, çok yakında yumuşakça kaybol
      const appear = smooth(TUNNEL_LENGTH + 0.6, TUNNEL_LENGTH - 18, z);
      const near = smooth(0.8, 3.2, z);
      const alpha = appear * near;
      if (alpha <= 0.01) continue;
      const fog = smooth(25, TUNNEL_LENGTH * 0.85, z);
      let lit = 0;
      for (const f of active) {
        const d2 = (st.x - f.pos.x) ** 2 + (st.y - f.pos.y) ** 2 + (z - f.pos.z) ** 2;
        lit += f.I * Math.exp(-d2 / (2 * 13 * 13));
      }
      const img = (p.aqua ? sprites.aqua : sprites.pink)[p.shape];
      // Işık tünelin sonundan gelir: bulutun aydınlık yüzü merkeze bakar
      const rot = Math.atan2(cy - sy, cx - sx) - SPRITE_LIGHT_ANGLE + (p.spin - Math.PI) * 0.12;
      items.push({
        z,
        draw: () => {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(rot);
          const s = size * 2;
          ctx.globalAlpha = alpha;
          ctx.drawImage(img, -s / 2, -s / 2, s, s);
          ctx.restore();
          if (fog > 0.01) {
            // Sis: aynı bulutun şeklinde sis rengi -> uzaktakiler derinlikte kaybolur
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(rot);
            ctx.globalAlpha = alpha * fog * 0.8;
            ctx.drawImage(fogSprite(img), -s / 2, -s / 2, s, s);
            ctx.restore();
          }
          if (lit > 0.02) {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(rot);
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = Math.min(0.8, lit * 0.9) * alpha;
            ctx.drawImage(img, -s / 2, -s / 2, s, s);
            ctx.restore();
          }
        },
      });
    }

    // Şimşekler: kendi derinliklerinde çizilir, öndeki bulutlar onları kısmen örter
    for (const f of active) {
      const { pos, I, i } = f;
      const k = FOCAL / pos.z;
      const px = cx + pos.x * k;
      const py = cy + pos.y * k;
      bolts.push({
        z: pos.z,
        draw: () => {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const gs = 24 * k;
          ctx.globalAlpha = Math.min(0.75, I * 0.6);
          ctx.drawImage(getSprites().glow, px - gs / 2, py - gs / 2, gs, gs);
          if (I > 0.25) {
            const bolt = BOLTS[i];
            const paths = [bolt.main, ...bolt.branches];
            const strokes: [number, string, number][] = [
              [34, BOLT_GLOW, 0.07],
              [14, BOLT_GLOW, 0.22],
              [6, BOLT_CORE, 0.55],
              [2.6, BOLT_CORE, 1],
            ];
            for (const [w, color, a] of strokes) {
              ctx.strokeStyle = color;
              ctx.lineJoin = "round";
              ctx.lineCap = "round";
              ctx.globalAlpha = Math.min(1, I) * a;
              paths.forEach((path, pi) => {
                ctx.lineWidth = w * 1.8 * (pi === 0 ? 1 : 0.45);
                ctx.beginPath();
                path.forEach(([x, y], j) => {
                  const X = px + x * k * 1.8;
                  const Y = py + y * k * 1.8;
                  if (j === 0) ctx.moveTo(X, Y);
                  else ctx.lineTo(X, Y);
                });
                ctx.stroke();
              });
            }
          }
          ctx.restore();
        },
      });
    }

    items.sort((a, b) => b.z - a.z);
    for (const it of items) it.draw();
    for (const b of bolts) b.draw();

    // Çakma anında tüm sahneye hafif bir aydınlanma
    const total = active.reduce((acc, f) => acc + f.I, 0);
    if (total > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(0.14, total * 0.08);
      ctx.fillStyle = BOLT_GLOW;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Hafif vinyet: göz merkeze, uçuş yönüne odaklanır
    const vg = ctx.createRadialGradient(cx, cy, height * 0.35, cx, cy, height * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(10,8,30,0.3)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, width, height);
  }, [frame, fps, width, height, dpr, puffs]);

  return (
    <AbsoluteFill>
      <canvas ref={ref} width={width * dpr} height={height * dpr} style={{ width, height }} />
      {STRIKES.map((s, i) => (
        <Sequence key={i} from={Math.round((s.t + THUNDER_DELAY[i]) * fps)} layout="none">
          <Audio src={staticFile(`thunder-${i + 1}.wav`)} volume={0.55 * s.power + 0.2} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Bulut şeklinde sis katmanı (her sprite için bir kez üretilir)
const fogCache = new Map<HTMLCanvasElement, HTMLCanvasElement>();
const fogSprite = (img: HTMLCanvasElement) => {
  let c = fogCache.get(img);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = SPRITE_SIZE;
  c.height = SPRITE_SIZE;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = FOG_HAZE;
  g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  fogCache.set(img, c);
  return c;
};
