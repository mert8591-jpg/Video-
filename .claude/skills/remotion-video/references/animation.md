# Animasyon Kalıpları

## interpolate

```tsx
import { interpolate, Easing, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();

// Fade in (0-20) → bekle → fade out (100-120)
const opacity = interpolate(frame, [0, 20, 100, 120], [0, 1, 1, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

// Easing ile kayma
const x = interpolate(frame, [0, 30], [-200, 0], {
  easing: Easing.bezier(0.16, 1, 0.3, 1), // "expo out" — premium his
  extrapolateRight: "clamp",
});
```

Faydalı bezier eğrileri:
- `Easing.bezier(0.16, 1, 0.3, 1)` — hızlı giriş, yumuşak duruş (başlıklar için ideal)
- `Easing.bezier(0.65, 0, 0.35, 1)` — simetrik in-out (kamera/pan hareketleri)
- `Easing.bezier(0.7, 0, 0.84, 0)` — çıkışlar (hızlanarak ekrandan ayrılma)

## spring

```tsx
import { spring, useVideoConfig } from "remotion";

const { fps } = useVideoConfig();
const s = spring({ frame, fps, config: { damping: 200 } });           // sekmesiz, yumuşak
const pop = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 180 } }); // hafif sekme
const scale = interpolate(pop, [0, 1], [0.6, 1]);
```

- `damping: 200` → kurumsal/temiz. `damping: 10-15` → enerjik, oyuncu.
- Gecikme için `frame - gecikme` ver; `durationInFrames` ile süreyi sabitleyebilirsin.

## Kademeli (stagger) giriş

```tsx
const words = text.split(" ");
return (
  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
    {words.map((w, i) => {
      const p = spring({ frame: frame - i * 4, fps, config: { damping: 200 } });
      return (
        <span key={i} style={{
          opacity: p,
          transform: `translateY(${(1 - p) * 40}px)`,
          display: "inline-block",
        }}>{w}</span>
      );
    })}
  </div>
);
```

## Zamanlama yardımcıları

```tsx
// storyboard.ts
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);
export const SCENES = {
  intro:   { from: 0,        duration: sec(3) },
  problem: { from: sec(3),   duration: sec(4) },
  outro:   { from: sec(7),   duration: sec(3) },
} as const;
export const TOTAL = sec(10);
```

## Ken Burns (fotoğrafa canlılık)

```tsx
const { durationInFrames } = useVideoConfig();
const zoom = interpolate(frame, [0, durationInFrames], [1, 1.12]);
const panX = interpolate(frame, [0, durationInFrames], [0, -40]);
<Img src={staticFile("photo.jpg")} style={{
  width: "100%", height: "100%", objectFit: "cover",
  transform: `scale(${zoom}) translateX(${panX}px)`,
}} />
```

## Sayaç (count-up)

```tsx
const value = Math.round(interpolate(frame, [0, 45], [0, 12500], {
  easing: Easing.out(Easing.cubic), extrapolateRight: "clamp",
}));
<span>{value.toLocaleString("tr-TR")}</span>
```

## SVG çizgi çizme (yol/rota animasyonu)

```tsx
import { evolvePath } from "@remotion/paths"; // npm i @remotion/paths
const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);
<path d={d} stroke="#fff" strokeWidth={6} fill="none"
      strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
```

## Kaçınılacaklar

- Aynı anda çok fazla öğeyi hareket ettirme — göz tek odak ister.
- Her şeye aynı süreyi verme; ritim için 8–20 kare arası farklı süreler kullan.
- Hareket bulanıklığı gerekiyorsa `@remotion/motion-blur` (`<CameraMotionBlur>`) kullan,
  CSS blur ile taklit etme.
